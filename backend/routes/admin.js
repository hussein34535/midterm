/**
 * Admin Routes
 * Owner/Admin endpoints for platform management
 */

const express = require('express');
const supabase = require('../lib/supabase');
const { authMiddleware, requireAdmin, requireOwner } = require('../middleware/auth');
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

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete error:', error);
            return res.status(500).json({ error: 'حدث خطأ أثناء الحذف' });
        }

        res.json({ message: 'تم حذف المستخدم بنجاح' });
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
                user:users!user_id(id, nickname, email, avatar),
                course:courses!course_id(id, title, price)
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
 * PATCH /api/admin/payments/:id
 * Update payment status (Owner only - confirm/reject)
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
            .select('user_id, course_id')
            .eq('id', id)
            .single();

        if (fetchError || !payment) {
            return res.status(404).json({ error: 'الدفعة غير موجودة' });
        }

        // Update payment status
        const { error } = await supabase
            .from('payments')
            .update({ status })
            .eq('id', id);

        if (error) {
            console.error('Payment update error:', error);
            return res.status(500).json({ error: 'حدث خطأ أثناء تحديث الدفعة' });
        }

        // If confirmed, add user to course enrollments
        if (status === 'confirmed' || status === 'completed') {
            await supabase
                .from('enrollments')
                .upsert({
                    user_id: payment.user_id,
                    course_id: payment.course_id,
                    enrolled_at: new Date().toISOString()
                }, { onConflict: 'user_id,course_id' });
        }

        res.json({ message: 'تم تحديث حالة الدفعة بنجاح' });
    } catch (error) {
        console.error('Payment update error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
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
        const { limit = 100, type } = req.query;

        let query = supabase
            .from('messages')
            .select(`
                *,
                sender:users!messages_sender_id_fkey(id, nickname, avatar)
            `)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (type === 'group') {
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

module.exports = router;

/**
 * GET /api/admin/reports
 * Get advanced platform statistics
 */
router.get('/reports', requireAdmin, async (req, res) => {
    try {
        // Run queries in parallel for performance
        const [usersRes, coursesRes, sessionsRes, paymentsRes] = await Promise.all([
            supabase.from('users').select('id, created_at', { count: 'exact' }),
            supabase.from('courses').select('id', { count: 'exact' }),
            supabase.from('sessions').select('id', { count: 'exact' }),
            supabase.from('payments').select('amount, created_at').eq('status', 'confirmed')
        ]);

        if (usersRes.error) throw usersRes.error;
        if (coursesRes.error) throw coursesRes.error;
        if (sessionsRes.error) throw sessionsRes.error;
        if (paymentsRes.error) throw paymentsRes.error;

        const payments = paymentsRes.data || [];
        const users = usersRes.data || [];

        // Calculate Total Revenue
        const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        // Prepare Chart Data (Last 30 days revenue)
        const last30Days = [...Array(30)].map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const revenueChart = last30Days.map(date => {
            const dayRevenue = payments
                .filter(p => p.created_at.startsWith(date))
                .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
            return { date, revenue: dayRevenue };
        });

        // User Growth (Last 30 days)
        const userGrowthChart = last30Days.map(date => {
            const dayUsers = users.filter(u => u.created_at.startsWith(date)).length;
            return { date, users: dayUsers };
        });

        res.json({
            stats: {
                totalUsers: usersRes.count,
                totalCourses: coursesRes.count,
                totalSessions: sessionsRes.count,
                totalRevenue,
                recentRevenue: revenueChart,
                recentUsers: userGrowthChart
            }
        });

    } catch (error) {
        console.error('Reports error:', error);
        res.status(500).json({ error: 'حدث خطأ في جلب التقارير' });
    }
});

