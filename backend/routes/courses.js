/**
 * Courses Routes
 * Course management and enrollment
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');
const { authMiddleware, requireOwner, requireSpecialist } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/courses
 * Get all active courses (public)
 */
router.get('/', async (req, res) => {
    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select(`
                *,
                specialist:users!specialist_id(id, nickname, avatar)
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Courses fetch error:', error);
            return res.status(500).json({ error: 'حدث خطأ' });
        }

        res.json({ courses: courses || [] });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/courses/:id
 * Get course details with sessions (Syllabus)
 */
router.get('/:id', async (req, res) => {
    try {
        const { data: course, error } = await supabase
            .from('courses')
            .select(`
                *,
                specialist:users!specialist_id(id, nickname, avatar),
                sessions(id, title, session_number, status, created_at)
            `)
            .eq('id', req.params.id)
            .single();

        if (error || !course) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }

        // Sort sessions by number
        if (course.sessions) {
            course.sessions.sort((a, b) => a.session_number - b.session_number);
            // Sanitize syllabus sessions for public view
            course.sessions = course.sessions.map(s => ({
                ...s,
                status: 'waiting' // Always waiting for public/syllabus view
            }));
        }

        res.json({ course });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/courses/:id/my-sessions
 * Get sessions with user's group status/schedule
 */
router.get('/:id/my-sessions', authMiddleware, async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.userId;

        // 1. Get Enrollment & Group
        const { data: enrollment } = await supabase
            .from('enrollments')
            .select('group_id')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .single();

        if (!enrollment || !enrollment.group_id) {
            return res.status(403).json({ error: 'غير مشترك في مجموعة' });
        }

        // 2. Get Syllabus (Template Sessions)
        const { data: sessions } = await supabase
            .from('sessions')
            .select('id, title, session_number')
            .eq('course_id', courseId)
            .order('session_number', { ascending: true });

        // 3. Get Scheduled Group Sessions
        const { data: groupSessions } = await supabase
            .from('group_sessions')
            .select('*')
            .eq('group_id', enrollment.group_id);

        // 4. Merge
        const result = sessions.map(session => {
            const groupSession = groupSessions?.find(gs => gs.session_id === session.id);
            if (groupSession) {
                return {
                    ...session,
                    id: groupSession.id, // Use Group Session ID for joining
                    status: groupSession.status,
                    scheduled_at: groupSession.scheduled_at,
                    is_group_session: true
                };
            } else {
                return {
                    ...session,
                    status: 'waiting', // Not scheduled yet
                    scheduled_at: null,
                    is_group_session: false
                };
            }
        });

        res.json({ sessions: result });

    } catch (error) {
        console.error('My Sessions error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * POST /api/courses
 * Create new course (Owner only)
 */
router.post('/', authMiddleware, requireOwner, async (req, res) => {
    try {
        const { title, description, specialist_id, total_sessions, group_capacity, price, image_url } = req.body;

        const courseData = {
            id: uuidv4(),
            title,
            description,
            specialist_id,
            total_sessions: total_sessions || 4,
            group_capacity: group_capacity || 4,
            price: price || 0,
            image_url,
            is_active: true,
            created_at: new Date().toISOString()
        };

        const { data: course, error } = await supabase
            .from('courses')
            .insert(courseData)
            .select()
            .single();

        if (error) {
            console.error('Course creation error:', error);
            return res.status(500).json({ error: 'حدث خطأ' });
        }

        res.status(201).json({ message: 'تم إنشاء الكورس', course });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/courses/:id/enrollment-status
 * Check if user is enrolled in this course
 */
router.get('/:id/enrollment-status', authMiddleware, async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.userId;

        const { data: enrollment } = await supabase
            .from('enrollments')
            .select('id, enrolled_at')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .single();

        res.json({ isEnrolled: !!enrollment, enrollment });
    } catch (error) {
        console.error('Enrollment check error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * POST /api/courses/:id/enroll
 * Enroll user in course + Auto-assign to group
 */
router.post('/:id/enroll', authMiddleware, async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.userId;

        // Check if already enrolled
        const { data: existing } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'أنت مشترك بالفعل' });
        }

        // Get course info
        const { data: course } = await supabase
            .from('courses')
            .select('title, specialist_id, group_capacity')
            .eq('id', courseId)
            .single();

        if (!course) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }

        // Create enrollment
        const { data: enrollment, error: enrollError } = await supabase
            .from('enrollments')
            .insert({
                id: uuidv4(),
                user_id: userId,
                course_id: courseId
            })
            .select()
            .single();

        if (enrollError) {
            console.error('Enrollment error:', enrollError);
            return res.status(500).json({ error: 'حدث خطأ' });
        }

        // 🎯 AUTO-ASSIGN TO GROUP
        // Get all groups for this course with their actual member counts
        const { data: allGroups } = await supabase
            .from('course_groups')
            .select('id, name, capacity, course_id')
            .eq('course_id', courseId)
            .order('created_at', { ascending: true });

        let targetGroupId = null;
        let groupName = '';

        console.log(`Auto-assigning user ${userId} to course ${courseId}`);
        console.log(`Found ${allGroups?.length || 0} existing groups.`);

        // Determine capacity (Group Override > Course Default > Hardcoded 4)
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

                console.log(`Group ${group.name} (${group.id}): ${memberCount}/${capacity}`);

                if (memberCount < capacity) {
                    targetGroupId = group.id;
                    groupName = group.name;
                    console.log(`>> Selected existing group: ${groupName}`);
                    break;
                }
            }
        }

        // If no available group found, create a new one
        if (!targetGroupId) {
            let groupNumber = (allGroups?.length || 0) + 1;
            let created = false;
            let attempts = 0;

            console.log('>> No available group found, attempting creation...');

            // Try to create a group with a unique name (retry up to 5 times)
            while (!created && attempts < 5) {
                groupName = `${course.title} - مجموعة ${groupNumber}`;
                console.log(`Attempt ${attempts + 1}: Creating group "${groupName}"`);

                const { data: newGroup, error: createError } = await supabase
                    .from('course_groups')
                    .insert({
                        id: uuidv4(),
                        name: groupName,
                        course_id: courseId,
                        specialist_id: course.specialist_id,
                        capacity: COURSE_CAPACITY
                    })
                    .select()
                    .single();

                if (!createError && newGroup) {
                    targetGroupId = newGroup.id;
                    created = true;
                    console.log(`>> Created new group: ${newGroup.id}`);
                } else {
                    // If error (likely name collision), try next number
                    console.warn(`Failed to create group ${groupName}, retrying...`, createError);
                    groupNumber++;
                    attempts++;
                }
            }
        }

        // Update enrollment with group_id
        if (targetGroupId) {
            const { error: updateError } = await supabase
                .from('enrollments')
                .update({ group_id: targetGroupId })
                .eq('user_id', userId)
                .eq('course_id', courseId);

            if (updateError) console.error('Failed to assign group_id:', updateError);
            else console.log(`>> Successfully assigned user to group ${targetGroupId}`);

            // Send welcome message to the group
            // ... existing welcome msg code ...


            // Send welcome message to the group
            const { data: user } = await supabase
                .from('users')
                .select('nickname')
                .eq('id', userId)
                .single();

            const welcomeMsg = `🌸 مرحباً بك ${user?.nickname || ''} في المجموعة! نتمنى لك رحلة موفقة نحو التعافي.`;

            await supabase
                .from('messages')
                .insert({
                    id: uuidv4(),
                    content: welcomeMsg,
                    sender_id: null, // System message, no sender
                    course_id: courseId,
                    group_id: targetGroupId, // Send to the specific group
                    is_system: true,
                    type: 'text',
                    created_at: new Date().toISOString()
                });
        }

        res.status(201).json({
            message: 'تم الاشتراك بنجاح وإضافتك للمجموعة',
            enrollment,
            group_name: groupName
        });
    } catch (error) {
        console.error('Enrollment error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/courses/:id/sessions
 * Get all sessions for a course
 */
router.get('/:id/sessions', async (req, res) => {
    try {
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('course_id', req.params.id)
            .order('session_number', { ascending: true });

        if (error) {
            return res.status(500).json({ error: 'حدث خطأ' });
        }

        res.json({ sessions: sessions || [] });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * PATCH /api/courses/:id/assign
 * Assign specialist to course (Owner only)
 */
router.patch('/:id/assign', authMiddleware, requireOwner, async (req, res) => {
    try {
        const { specialist_id } = req.body;

        const { data: course, error } = await supabase
            .from('courses')
            .update({ specialist_id })
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'حدث خطأ' });
        }

        res.json({ message: 'تم تعيين الأخصائي', course });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * PUT /api/courses/:id
 * Update course (Owner only)
 */
router.put('/:id', authMiddleware, requireOwner, async (req, res) => {
    try {
        const { title, description, price, total_sessions, group_capacity, specialist_id, is_active } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = Number(price);
        if (total_sessions !== undefined) updateData.total_sessions = Number(total_sessions);
        if (group_capacity !== undefined) updateData.group_capacity = Number(group_capacity);
        // Handle empty string as null for specialist_id
        if (specialist_id !== undefined) {
            updateData.specialist_id = specialist_id === '' ? null : specialist_id;
        }
        if (is_active !== undefined) updateData.is_active = is_active;
        updateData.updated_at = new Date().toISOString();

        console.log('Updating course:', req.params.id, updateData);

        const { data: course, error } = await supabase
            .from('courses')
            .update(updateData)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) {
            console.error('Course update error:', error);
            return res.status(500).json({ error: 'حدث خطأ في تحديث الكورس: ' + error.message });
        }

        res.json({ message: 'تم تحديث الكورس', course });
    } catch (error) {
        console.error('Course update exception:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * DELETE /api/courses/:id
 * Delete course (Owner only)
 */
router.delete('/:id', authMiddleware, requireOwner, async (req, res) => {
    try {
        // Soft delete - just deactivate
        const { error } = await supabase
            .from('courses')
            .update({ is_active: false })
            .eq('id', req.params.id);

        if (error) {
            console.error('Course delete error:', error);
            return res.status(500).json({ error: 'حدث خطأ في حذف الكورس' });
        }

        res.json({ message: 'تم حذف الكورس' });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * POST /api/courses/:id/payment
 * Record payment and enroll user
 */
router.post('/:id/payment', authMiddleware, async (req, res) => {
    try {
        const courseId = req.params.id;
        const userId = req.userId;
        const { payment_method, payment_code, amount } = req.body;

        // Get course to verify price
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('id, title, price')
            .eq('id', courseId)
            .single();

        if (courseError || !course) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }

        // Check if already enrolled
        const { data: existing } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'أنت مشترك بالفعل في هذا الكورس' });
        }

        // Record payment
        const { payment_screenshot, sender_number } = req.body; // Screenshot as base64

        const { data: payment, error: payError } = await supabase
            .from('payments')
            .insert({
                id: uuidv4(),
                user_id: userId,
                course_id: courseId,
                amount: amount || course.price,
                payment_method: payment_method || 'unknown',
                payment_code: payment_code,
                sender_number: sender_number || null,
                screenshot: payment_screenshot || null,
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (payError) {
            console.error('Payment record error:', payError);
            return res.status(500).json({ error: 'حدث خطأ في تسجيل الدفع' });
        }

        // NOTE: Enrollment will be created ONLY when admin confirms payment
        // See admin/payments endpoint for confirmation logic

        res.status(201).json({
            message: 'تم إرسال طلب الدفع بنجاح! سيتم تفعيل اشتراكك خلال ساعات بعد التحقق من الدفع',
            payment
        });
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

module.exports = router;

