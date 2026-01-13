/**
 * Admin Routes
 * Owner/Admin endpoints for platform management
 */

const express = require('express');
const supabase = require('../lib/supabase');
const { authMiddleware, requireAdmin, requireOwner } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const sendEmail = require('../utils/sendEmail');
const router = express.Router();

// All admin routes require authentication
router.use(authMiddleware);

/**
 * GET /api/admin/stats
 * Get platform statistics (Admin+)
 */
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        // Get user count
        const { count: userCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        // Get session counts
        const { count: totalSessions } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true });

        const { count: activeSessions } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        const { count: specialistCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'specialist');

        // Get revenue stats from payments
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, status, created_at');

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

        let totalRevenue = 0;
        let monthlyRevenue = 0;
        let pendingRevenue = 0;

        (payments || []).forEach(p => {
            const amount = parseFloat(p.amount) || 0;
            if (p.status === 'confirmed' || p.status === 'completed') {
                totalRevenue += amount;
                if (p.created_at >= startOfMonth) {
                    monthlyRevenue += amount;
                }
            } else if (p.status === 'pending') {
                pendingRevenue += amount;
            }
        });

        // Get course count
        const { count: courseCount } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true });

        // Get enrollment count
        const { count: enrollmentCount } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true });

        res.json({
            stats: {
                users: userCount || 0,
                specialists: specialistCount || 0,
                totalSessions: totalSessions || 0,
                activeSessions: activeSessions || 0,
                courses: courseCount || 0,
                enrollments: enrollmentCount || 0,
                totalRevenue,
                monthlyRevenue,
                pendingRevenue
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'حدث خطأ في جلب الإحصائيات' });
    }
});

/**
 * GET /api/admin/users
 * List all users (Admin+)
 */
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, nickname, email, avatar, role, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Users fetch error:', error);
            return res.status(500).json({ error: 'حدث خطأ في جلب المستخدمين' });
        }

        res.json({ users: users || [] });
    } catch (error) {
        console.error('Users error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * PATCH /api/admin/users/:id/role
 * Change user role (Owner can change anything, Admin can only promote to specialist)
 */
router.patch('/users/:id/role', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Validate role
        const validRoles = ['user', 'specialist', 'admin', 'owner'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'رتبة غير صالحة' });
        }

        // Only owner can assign 'admin' or 'owner' roles
        if ((role === 'admin' || role === 'owner') && req.userRole !== 'owner') {
            return res.status(403).json({
                error: 'فقط المالك يمكنه تعيين رتبة مدير أو مالك'
            });
        }

        // Prevent demoting yourself
        if (id === req.userId && role !== req.userRole) {
            return res.status(400).json({ error: 'لا يمكنك تغيير رتبتك الخاصة' });
        }

        // Special Logic: Transfer Ownership
        // Special Logic: Add Co-Owner (Multiple Owners Supported)
        if (role === 'owner') {
            // Promote new user to Owner
            const { error: promoteError } = await supabase
                .from('users')
                .update({ role: 'owner', updated_at: new Date().toISOString() })
                .eq('id', id);

            if (promoteError) throw promoteError;

            return res.json({
                message: 'تم إضافة مالك جديد بنجاح! كلاهما يملك صلاحيات كاملة.',
                needRelogin: false
            });
        }

        // Standard Role Update (for other roles)
        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ role, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('id, nickname, email, role')
            .single();

        if (error) {
            console.error('Role update error:', error);
            return res.status(500).json({ error: 'حدث خطأ أثناء تحديث الرتبة' });
        }

        res.json({
            message: 'تم تحديث الرتبة بنجاح',
            user: updatedUser
        });
    } catch (error) {
        console.error('Role update error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * DELETE /api/admin/users/:id
 * Ban/Delete user (Admin+, but only Owner can delete Admins)
 */
// 188: router.delete('/users/:id', requireAdmin, async (req, res) => {
router.delete('/users/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Get user to check role
        const { data: targetUser, error: fetchError } = await supabase
            .from('users')
            .select('role')
            .eq('id', id)
            .single();

        if (fetchError || !targetUser) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }

        // Only owner can delete admins
        if (targetUser.role === 'admin' && req.userRole !== 'owner') {
            return res.status(403).json({ error: 'فقط المالك يمكنه حذف المديرين' });
        }

        // Cannot delete owner
        if (targetUser.role === 'owner') {
            return res.status(403).json({ error: 'لا يمكن حذف المالك' });
        }

        // Prevent self-deletion
        if (id === req.userId) {
            return res.status(400).json({ error: 'لا يمكنك حذف حسابك من هنا' });
        }

        // --- CASCADE DELETE LOGIC ---

        // 1. If Specialist: Delete their Courses/Content & Sub-dependencies
        if (targetUser.role === 'specialist') {
            const { data: specialistCourses } = await supabase
                .from('courses')
                .select('id')
                .eq('specialist_id', id);

            if (specialistCourses && specialistCourses.length > 0) {
                const courseIds = specialistCourses.map(c => c.id);

                // Get Groups for these courses
                const { data: courseGroups } = await supabase
                    .from('course_groups')
                    .select('id')
                    .in('course_id', courseIds);

                const groupIds = courseGroups ? courseGroups.map(g => g.id) : [];

                if (groupIds.length > 0) {
                    // 1a. Delete Group Members
                    await supabase.from('group_members').delete().in('group_id', groupIds);

                    // 1b. Delete Group Sessions (Schedule)
                    await supabase.from('group_sessions').delete().in('group_id', groupIds);

                    // 1c. Delete Messages in these Groups
                    await supabase.from('messages').delete().in('group_id', groupIds);

                    // 1d. Delete the Groups themselves
                    await supabase.from('course_groups').delete().in('course_id', courseIds);
                }

                // 1e. Delete Messages in these Courses (if any, legacy)
                await supabase.from('messages').delete().in('course_id', courseIds);

                // 1f. Delete Enrollments in these courses
                await supabase.from('enrollments').delete().in('course_id', courseIds);

                // 1g. Delete Syllabus Sessions in these courses
                await supabase.from('sessions').delete().in('course_id', courseIds);

                // 1h. Delete Payments linked to these courses (Optional: keep for records? User asked to delete user, so standard practice is full wipe or anonymize)
                // Let's delete payments for these courses to be safe against FKs
                await supabase.from('payments').delete().in('course_id', courseIds);

                // 1i. Delete the Courses themselves
                await supabase.from('courses').delete().in('id', courseIds);
            }
        }

        // 2. Delete user's personal messages (sender/receiver)
        await supabase.from('messages').delete().eq('sender_id', id);
        await supabase.from('messages').delete().eq('receiver_id', id);

        // 3. Delete user's personal enrollments (as a student)
        await supabase.from('enrollments').delete().eq('user_id', id);

        // 4. Delete user's payments
        await supabase.from('payments').delete().eq('user_id', id);

        // 5. Delete from group_members (if they were a member of any group)
        await supabase.from('group_members').delete().eq('user_id', id);

        // 5b. Delete any sessions where this user is the HOST (e.g. 1-on-1s or extra sessions)
        // This fixes the "sessions_host_id_fkey" violation
        await supabase.from('sessions').delete().eq('host_id', id);

        // 6. Finally, delete the user
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete error:', error);
            if (error.code === '23503') {
                return res.status(400).json({ error: 'عذراً، لا يمكن حذف المستخدم لوجود بيانات مرتبطة به لم يتم تنظيفها.' });
            }
            return res.status(500).json({ error: 'حدث خطأ أثناء الحذف' });
        }

        res.json({ message: 'تم حذف المستخدم وجميع بياناته بنجاح' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});


/**
 * GET /api/admin/sessions
 * Get all sessions (Admin+)
 */
router.get('/sessions', requireAdmin, async (req, res) => {
    try {
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select(`
                *,
                host:users!host_id(id, nickname, email)
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Sessions fetch error:', error);
            return res.status(500).json({ error: 'حدث خطأ' });
        }

        res.json({ sessions: sessions || [] });
    } catch (error) {
        console.error('Sessions error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/admin/specialists
 * Get all specialists (Admin+)
 */
router.get('/specialists', requireAdmin, async (req, res) => {
    try {
        const { data: specialists, error } = await supabase
            .from('users')
            .select('id, nickname, email, avatar, created_at')
            .eq('role', 'specialist')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Specialists fetch error:', error);
            return res.status(500).json({ error: 'حدث خطأ في جلب الأخصائيين' });
        }

        // Get course counts for each specialist
        const specialistsWithCounts = await Promise.all(
            (specialists || []).map(async (spec) => {
                const { count } = await supabase
                    .from('courses')
                    .select('*', { count: 'exact', head: true })
                    .eq('specialist_id', spec.id);

                return {
                    ...spec,
                    courses_count: count || 0
                };
            })
        );

        res.json({ specialists: specialistsWithCounts });
    } catch (error) {
        console.error('Specialists error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

// =============================================
// COURSES MANAGEMENT (Owner+)
// =============================================

/**
 * GET /api/admin/courses
 * Get all courses with details (Admin+)
 */
router.get('/courses', requireAdmin, async (req, res) => {
    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select(`
                *,
                specialist:users!specialist_id(id, nickname, email, avatar)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Courses fetch error:', error);
            return res.status(500).json({ error: 'حدث خطأ في جلب الكورسات' });
        }

        // Get enrollment counts
        const coursesWithStats = await Promise.all(
            (courses || []).map(async (course) => {
                const { count } = await supabase
                    .from('enrollments')
                    .select('*', { count: 'exact', head: true })
                    .eq('course_id', course.id);

                return {
                    ...course,
                    enrollments_count: count || 0
                };
            })
        );

        res.json({ courses: coursesWithStats });
    } catch (error) {
        console.error('Courses error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * DELETE /api/admin/courses/:id
 * Delete a course (Owner only)
 */
router.delete('/courses/:id', requireOwner, async (req, res) => {
    try {
        const { id } = req.params;

        // Delete related enrollments first
        await supabase
            .from('enrollments')
            .delete()
            .eq('course_id', id);

        // Delete related sessions
        await supabase
            .from('sessions')
            .delete()
            .eq('course_id', id);

        // Delete the course
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Course delete error:', error);
            return res.status(500).json({ error: 'حدث خطأ أثناء حذف الكورس' });
        }

        res.json({ message: 'تم حذف الكورس بنجاح' });
    } catch (error) {
        console.error('Course delete error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * PATCH /api/admin/courses/:id
 * Update a course (Admin+)
 */
router.patch('/courses/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, price, duration, total_sessions, is_active, specialist_id } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = price;
        if (duration !== undefined) updateData.duration = duration;
        if (total_sessions !== undefined) updateData.total_sessions = total_sessions;
        if (is_active !== undefined) updateData.is_active = is_active;
        if (specialist_id !== undefined) updateData.specialist_id = specialist_id;

        const { data: updatedCourse, error } = await supabase
            .from('courses')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Course update error:', error);
            return res.status(500).json({ error: 'حدث خطأ أثناء تحديث الكورس' });
        }

        res.json({ message: 'تم تحديث الكورس بنجاح', course: updatedCourse });
    } catch (error) {
        console.error('Course update error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

// =============================================
// PAYMENTS MANAGEMENT (Owner+)
// =============================================

/**
 * GET /api/admin/payments
 * Get all payments (Admin+)
 */
router.get('/payments', requireAdmin, async (req, res) => {
    try {
        const { status } = req.query;

        let query = supabase
            .from('payments')
            .select(`
                *,
                user:users!payments_user_id_fkey(id, nickname, email, avatar),
                course:courses!payments_course_id_fkey(id, title, price)
            `)
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: payments, error } = await query;

        if (error) {
            console.error('Payments fetch error:', error);
            return res.status(500).json({ error: 'حدث خطأ في جلب المدفوعات' });
        }

        res.json({ payments: payments || [] });
    } catch (error) {
        console.error('Payments error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/admin/payments/:id
 * Get single payment details (Admin+)
 */
router.get('/payments/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const { data: payment, error } = await supabase
            .from('payments')
            .select(`
                *,
                user:users!payments_user_id_fkey(id, nickname, email, avatar),
                course:courses!payments_course_id_fkey(id, title, price, description)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Payment fetch error:', error);
            return res.status(500).json({ error: 'حدث خطأ في جلب بيانات الدفعة' });
        }

        if (!payment) {
            return res.status(404).json({ error: 'الدفعة غير موجودة' });
        }

        res.json({ payment });
    } catch (error) {
        console.error('Payment detail error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * PATCH /api/admin/payments/:id
 * Update payment status (Owner only - confirm/reject)
 * Handles both full course payments and per-session payments
 */
router.patch('/payments/:id', requireOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'confirmed', 'rejected', 'completed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'حالة غير صالحة' });
        }

        const { data: payment, error: fetchError } = await supabase
            .from('payments')
            .select('user_id, course_id, payment_type, metadata')
            .eq('id', id)
            .single();

        if (fetchError || !payment) {
            return res.status(404).json({ error: 'الدفعة غير موجودة' });
        }

        // Update payment status
        const { error } = await supabase
            .from('payments')
            .update({
                status,
                confirmed_by: req.userId,
                confirmed_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Payment update error:', error);
            return res.status(500).json({ error: 'حدث خطأ أثناء تحديث الدفعة' });
        }

        // Handle confirmation based on payment type
        if (status === 'confirmed' || status === 'completed') {

            // === SESSION PAYMENT ===
            if (payment.payment_type === 'session') {
                const sessionNumber = payment.metadata?.session_number;

                if (sessionNumber) {
                    // Check if already recorded
                    const { data: existing } = await supabase
                        .from('session_payments')
                        .select('id')
                        .eq('user_id', payment.user_id)
                        .eq('course_id', payment.course_id)
                        .eq('session_number', sessionNumber)
                        .single();

                    if (!existing) {
                        // Record the paid session
                        await supabase
                            .from('session_payments')
                            .insert({
                                id: uuidv4(),
                                user_id: payment.user_id,
                                course_id: payment.course_id,
                                session_number: sessionNumber,
                                payment_id: id,
                                paid_at: new Date().toISOString()
                            });

                        console.log(`✅ Session ${sessionNumber} marked as paid for user ${payment.user_id}`);
                    }
                }

                return res.json({
                    message: `تم تأكيد دفع الجلسة ${sessionNumber} بنجاح`,
                    type: 'session',
                    session_number: sessionNumber
                });
            }

            // === FULL COURSE PAYMENT ===
            // Check if enrollment already exists
            const { data: existingEnroll } = await supabase
                .from('enrollments')
                .select('id')
                .eq('user_id', payment.user_id)
                .eq('course_id', payment.course_id)
                .single();

            if (!existingEnroll) {
                // Create enrollment
                await supabase
                    .from('enrollments')
                    .insert({
                        id: uuidv4(),
                        user_id: payment.user_id,
                        course_id: payment.course_id,
                        payment_id: id,
                        enrolled_at: new Date().toISOString()
                    });

                // Get course info for group assignment
                const { data: course } = await supabase
                    .from('courses')
                    .select('title, specialist_id, group_capacity')
                    .eq('id', payment.course_id)
                    .single();

                // 🎯 AUTO-ASSIGN TO GROUP
                // Get all groups for this course with their actual member counts
                const { data: allGroups } = await supabase
                    .from('course_groups')
                    .select('id, name, capacity, course_id')
                    .eq('course_id', payment.course_id)
                    .order('created_at', { ascending: true });

                let targetGroupId = null;
                let groupName = '';

                // Determine capacity
                const COURSE_CAPACITY = course.group_capacity || 4;

                // Check each group for available capacity
                if (allGroups && allGroups.length > 0) {
                    for (const group of allGroups) {
                        // Count actual members in this group (exclude owners)
                        const { count } = await supabase
                            .from('enrollments')
                            .select('*, user:users!inner(role)', { count: 'exact', head: true })
                            .eq('group_id', group.id)
                            .neq('user.role', 'owner');

                        const memberCount = count || 0;
                        const capacity = group.capacity || COURSE_CAPACITY;

                        if (memberCount < capacity) {
                            targetGroupId = group.id;
                            groupName = group.name;
                            break;
                        }
                    }
                }

                // If no available group found, create a new one
                if (!targetGroupId) {
                    let groupNumber = (allGroups?.length || 0) + 1;
                    let created = false;
                    let attempts = 0;

                    // Try to create a group with a unique name (retry up to 5 times)
                    while (!created && attempts < 5) {
                        groupName = `${course?.title || 'كورس'} - مجموعة ${groupNumber}`;

                        const { data: newGroup, error: createError } = await supabase
                            .from('course_groups')
                            .insert({
                                id: uuidv4(),
                                name: groupName,
                                course_id: payment.course_id,
                                specialist_id: course?.specialist_id,
                                capacity: COURSE_CAPACITY
                            })
                            .select()
                            .single();

                        if (!createError && newGroup) {
                            targetGroupId = newGroup.id;
                            created = true;
                        } else {
                            // If error (likely name collision), try next number
                            console.warn(`Failed to create group ${groupName}, retrying...`, createError);
                            groupNumber++;
                            attempts++;
                        }
                    }
                }

                // Update enrollment with group_id and Send welcome message
                if (targetGroupId) {
                    await supabase
                        .from('enrollments')
                        .update({ group_id: targetGroupId })
                        .eq('user_id', payment.user_id)
                        .eq('course_id', payment.course_id);

                    // Send welcome message
                    const { data: user } = await supabase
                        .from('users')
                        .select('nickname')
                        .eq('id', payment.user_id)
                        .single();

                    const welcomeMsg = `🌸 مرحباً بك ${user?.nickname || ''} في المجموعة! نتمنى لك رحلة موفقة نحو التعافي.`;

                    await supabase
                        .from('messages')
                        .insert({
                            id: uuidv4(),
                            content: welcomeMsg,
                            sender_id: null, // System message
                            course_id: payment.course_id,
                            group_id: targetGroupId,
                            is_system: true,
                            type: 'text',
                            created_at: new Date().toISOString()
                        });
                }
            }
        }

        // 🔔 Send confirmation email to user
        try {
            const { data: user } = await supabase
                .from('users')
                .select('email, nickname')
                .eq('id', payment.user_id)
                .single();

            const { data: course } = await supabase
                .from('courses')
                .select('title')
                .eq('id', payment.course_id)
                .single();

            if (user?.email && status === 'confirmed') {
                const confirmHtml = `
                    <div style="text-align: right; direction: rtl; font-family: Arial, sans-serif;">
                        <h2>تم تأكيد الدفع بنجاح! ✅</h2>
                        <p>مرحباً ${user.nickname || 'عزيزي/عزيزتي'}،</p>
                        <p>تم تأكيد دفعتك وتفعيل اشتراكك في:</p>
                        <div style="background: #e8f5e9; padding: 15px; border-radius: 10px; margin: 15px 0; border-right: 4px solid #4caf50;">
                            <p style="margin: 0; font-weight: bold; font-size: 18px;">${course?.title || 'الكورس'}</p>
                        </div>
                        <p>يمكنك الآن الوصول للمحتوى والانضمام للمجموعة.</p>
                        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; background: #4caf50; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            الذهاب للوحة التحكم
                        </a>
                    </div>
                `;
                sendEmail(user.email, `تم تفعيل اشتراكك: ${course?.title || 'كورس'}`, confirmHtml)
                    .then(() => console.log('✅ Payment confirmation email sent to:', user.email))
                    .catch(err => console.error('❌ Payment email error:', err));
            }
        } catch (emailErr) {
            console.error('Payment confirmation email error:', emailErr);
        }

        res.json({ message: 'تم تحديث حالة الدفعة بنجاح', type: 'course' });
    } catch (error) {
        console.error('Payment update error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/admin/conversations
 * Get all conversations (Groups + Directs)
 */
router.get('/conversations', requireAdmin, async (req, res) => {
    try {
        // 1. Get all Groups
        const { data: groups, error: groupsError } = await supabase
            .from('course_groups')
            .select(`
                id,
                name,
                capacity,
                created_at,
                course:courses(title)
            `)
            .order('created_at', { ascending: false });

        if (groupsError) throw groupsError;

        // 1.5 Get Courses (Global Chats)
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('id, title, created_at')
            .order('created_at', { ascending: false });

        if (coursesError) throw coursesError;

        // 2. Get Direct Conversations (Users who have messaged)
        // Since we don't have a conversations table, we aggregate messages
        // DISTINCT sender_id for direct messages
        const { data: directMsgs, error: dmError } = await supabase
            .from('messages')
            .select('sender_id, receiver_id, created_at, content')
            .is('course_id', null)
            .order('created_at', { ascending: false });

        if (dmError) throw dmError;

        // Group DMs by user (unique interaction partners)
        // We assume "Support" is User <-> Owner/Specialist
        // We'll list users who have DMs
        const dmUsers = new Set();
        const directs = [];

        for (const msg of directMsgs) {
            // Identifier is the Other Person (not the admin/owner if possible, but let's just grab the sender if it's not me, or receiver if it is me)
            // For simplicity, we just look for distinct users who initiated conversations
            // But if current user is Admin, they might receive messages.
            // Let's just group by "sender_id" if sender is not an admin/specialist (implies User asking for support)
            // Actually, we'll just show the latest message for each unique user interaction

            // Simplified: Unique Sender ID for inbound messages
            if (!dmUsers.has(msg.sender_id)) {
                dmUsers.add(msg.sender_id);
                directs.push({
                    id: msg.sender_id, // Use User ID as "Conversation ID" for DMs
                    type: 'direct',
                    last_message: msg.content,
                    last_active: msg.created_at,
                    user_id: msg.sender_id
                });
            }
        }

        // Fetch user details for DMs
        const { data: users } = await supabase
            .from('users')
            .select('id, nickname, avatar, email')
            .in('id', Array.from(dmUsers));

        const enrichedDirects = directs.map(d => {
            const u = users.find(user => user.id === d.user_id);
            return {
                id: d.id,
                name: u?.nickname || 'مستخدم',
                subtitle: u?.email,
                avatar: u?.avatar,
                type: 'direct',
                last_message: d.last_message,
                created_at: d.last_active, // sort by last active
                member_count: 2
            };
        });

        // Format Groups
        const formattedGroups = groups.map(g => ({
            id: g.id,
            name: g.name,
            subtitle: g.course?.title,
            type: 'group',
            created_at: g.created_at,
            member_count: g.members?.[0]?.count || 0,
            isGroup: true
        }));

        // Format Courses (Global)
        const formattedCourses = (courses || []).map(c => ({
            id: c.id,
            name: c.title,
            subtitle: 'المحادثة العامة',
            type: 'group', // handled as group in UI but logic differs
            isCourse: true,
            created_at: c.created_at,
            member_count: 0 // Could fetch enrollment count if needed
        }));

        // Combine and Sort
        const allConversations = [...formattedCourses, ...formattedGroups, ...enrichedDirects].sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );

        res.json({ conversations: allConversations });
    } catch (error) {
        console.error('Conversations error:', error);
        res.status(500).json({ error: 'حدث خطأ في جلب المحادثات' });
    }
});

// =============================================
// SESSIONS MANAGEMENT (Owner+)
// =============================================

/**
 * DELETE /api/admin/sessions/:id
 * Delete a session (Owner only)
 */
router.delete('/sessions/:id', requireOwner, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Session delete error:', error);
            return res.status(500).json({ error: 'حدث خطأ أثناء حذف الجلسة' });
        }

        res.json({ message: 'تم حذف الجلسة بنجاح' });
    } catch (error) {
        console.error('Session delete error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

// =============================================
// MESSAGES MANAGEMENT (Owner+)
// =============================================

/**
 * GET /api/admin/messages
 * Get all messages (Admin+ with filters)
 */
router.get('/messages', requireAdmin, async (req, res) => {
    try {
        const { limit = 100, type, courseId, userId, groupId } = req.query;

        let query = supabase
            .from('messages')
            .select(`
                *,
                sender:users!messages_sender_id_fkey(id, nickname, avatar)
            `)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (groupId) {
            query = query.eq('group_id', groupId);
        } else if (courseId) {
            // Global Course Chat (No Group)
            query = query.eq('course_id', courseId).is('group_id', null);
        } else if (userId) {
            // For DM, we want messages between this user and ANYONE (usually admin/support)
            // But usually DMs are User <-> System.
            query = query.or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);
        } else if (type === 'group') {
            query = query.not('course_id', 'is', null);
        } else if (type === 'direct') {
            query = query.is('course_id', null);
        }

        const { data: messages, error } = await query;

        if (error) {
            console.error('Messages fetch error:', error);
            return res.status(500).json({ error: 'حدث خطأ في جلب الرسائل' });
        }

        res.json({ messages: messages || [] });
    } catch (error) {
        console.error('Messages error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * DELETE /api/admin/messages/:id
 * Delete a message (Owner only)
 */
router.delete('/messages/:id', requireOwner, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Message delete error:', error);
            return res.status(500).json({ error: 'حدث خطأ أثناء حذف الرسالة' });
        }

        res.json({ message: 'تم حذف الرسالة بنجاح' });
    } catch (error) {
        console.error('Message delete error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * DELETE /api/admin/conversations/:id
 * Delete a conversation (Group or DM)
 */
router.delete('/conversations/:id', requireOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // 'group' or 'direct'

        if (type === 'group') {
            // Delete Group (Cascade will verify later, but let's be explicit)
            // 1. Clear group_id from enrollments
            await supabase.from('enrollments').update({ group_id: null }).eq('group_id', id);
            // 2. Delete Messages
            await supabase.from('messages').delete().eq('course_id', id);
            // 3. Delete Group
            const { error } = await supabase.from('course_groups').delete().eq('id', id);

            if (error) throw error;
        } else if (type === 'direct') {
            // Delete DMs with this user
            // ID here is the User ID of the other person
            const userId = id;
            const { error } = await supabase
                .from('messages')
                .delete()
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .is('course_id', null);

            if (error) throw error;
        }

        res.json({ message: 'تم حذف المحادثة بنجاح' });
    } catch (error) {
        console.error('Conversation delete error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء حذف المحادثة' });
    }
});

module.exports = router;

/**
 * GET /api/admin/reports
 * Get advanced platform statistics
 */
router.get('/reports', requireAdmin, async (req, res) => {
    try {
        const { period = '30' } = req.query;
        const daysToFetch = parseInt(period) || 30;

        // Run queries in parallel for performance
        const [usersRes, coursesRes, sessionsRes, paymentsRes] = await Promise.all([
            supabase.from('users').select('id, nickname, created_at', { count: 'exact' }),
            supabase.from('courses').select('id, title', { count: 'exact' }),
            supabase.from('sessions').select('id', { count: 'exact' }),
            supabase.from('payments')
                .select('id, amount, created_at, user_id, course_id')
                .eq('status', 'confirmed')
                .order('created_at', { ascending: false })
        ]);

        if (usersRes.error) throw usersRes.error;
        if (coursesRes.error) throw coursesRes.error;
        if (sessionsRes.error) throw sessionsRes.error;
        if (paymentsRes.error) throw paymentsRes.error;

        // Filter payments by period if needed for Total, but usually Total Revenue is ALL TIME.
        // The user asked for "Specify period in statistics".
        // The charts use "daysToFetch".
        // Let's decide: Should "Total Revenue" card show ALL TIME or PERIOD?
        // Usually "Total Revenue" means ALL TIME. "Period Revenue" is separate.
        // But if filtering, maybe we want to see stats for that period.
        // Let's keep Total Revenue as ALL TIME (or explicit) and add "Period Revenue".
        // But for charts we filter.
        // For the *Transaction Table*, we should return detailed list.

        const allPayments = paymentsRes.data || [];
        const users = usersRes.data || [];
        const courses = coursesRes.data || [];

        // Create Lookup Maps for faster access
        const userMap = new Map(users.map(u => [u.id, u]));
        const courseMap = new Map(courses.map(c => [c.id, c]));

        // Filter for specific period calculations
        const periodPayments = allPayments.filter(p => {
            const date = new Date(p.created_at);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - daysToFetch);
            return date >= cutoff;
        });

        const paymentsToUse = periodPayments; // Use filtered payments for charts/tables?

        // Calculate Total Revenue (All Time)
        const totalRevenue = allPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        // Calculate Period Revenue
        const periodRevenue = periodPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        // Prepare Chart Data (Dynamic period)
        const lastNDays = [...Array(daysToFetch)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const revenueChart = lastNDays.map(date => {
            const dayRevenue = periodPayments
                .filter(p => p.created_at.startsWith(date))
                .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            return { date, revenue: dayRevenue };
        });

        // User Growth
        // use users variable we fetched earlier
        const userGrowthChart = lastNDays.map(date => {
            const dayUsers = users.filter(u => u.created_at.startsWith(date)).length;
            return { date, users: dayUsers };
        });

        res.json({
            stats: {
                totalUsers: usersRes.count,
                totalCourses: coursesRes.count,
                totalSessions: sessionsRes.count,
                totalRevenue, // Keep showing All Time
                periodRevenue, // New: Revenue for selected period
                recentRevenue: revenueChart,
                recentUsers: userGrowthChart,
                transactions: periodPayments.map(p => ({
                    id: p.id,
                    amount: p.amount,
                    date: p.created_at,
                    user: userMap.get(p.user_id)?.nickname || 'مستخدم',
                    course: courseMap.get(p.course_id)?.title || 'كورس'
                }))
            }
        });

    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({ error: 'حدث خطأ في جلب التقارير' });
    }
});

