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
 * Get course details with sessions
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

        res.json({ course });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * POST /api/courses
 * Create new course (Owner only)
 */
router.post('/', authMiddleware, requireOwner, async (req, res) => {
    try {
        const { title, description, specialist_id, total_sessions, price, image_url } = req.body;

        const courseData = {
            id: uuidv4(),
            title,
            description,
            specialist_id,
            total_sessions: total_sessions || 4,
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
            .select('title, specialist_id')
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

        // 🎯 AUTO-ASSIGN TO GROUP (max 4 per group)
        // Find an existing group for this course with < 4 members
        const { data: groups } = await supabase
            .from('course_groups')
            .select('id, name, member_count')
            .eq('course_id', courseId)
            .lt('member_count', 4)
            .order('created_at', { ascending: true })
            .limit(1);

        let targetGroupId;
        let groupName;

        if (groups && groups.length > 0) {
            // Join existing group
            targetGroupId = groups[0].id;
            groupName = groups[0].name;

            // Update enrollment with group_id
            await supabase
                .from('enrollments')
                .update({ group_id: targetGroupId })
                .eq('user_id', userId)
                .eq('course_id', courseId);

            // Update member count
            await supabase
                .from('course_groups')
                .update({ member_count: (groups[0].member_count || 0) + 1 })
                .eq('id', targetGroupId);
        } else {
            // Create new group
            const groupNumber = Math.floor(Math.random() * 1000);
            groupName = `${course.title} - مجموعة ${groupNumber}`;

            const { data: newGroup } = await supabase
                .from('course_groups')
                .insert({
                    id: uuidv4(),
                    name: groupName,
                    course_id: courseId,
                    specialist_id: course.specialist_id,
                    member_count: 1
                })
                .select()
                .single();

            if (newGroup) {
                targetGroupId = newGroup.id;

                // Update enrollment with group_id
                await supabase
                    .from('enrollments')
                    .update({ group_id: targetGroupId })
                    .eq('user_id', userId)
                    .eq('course_id', courseId);
            }
        }

        // Send welcome message to the group
        if (targetGroupId) {
            const { data: user } = await supabase
                .from('users')
                .select('nickname')
                .eq('id', userId)
                .single();

            const welcomeMsg = `مرحباً ${user?.nickname || 'بك'} في ${groupName}! نتمنى لك رحلة موفقة نحو التعافي 🌸`;

            await supabase
                .from('messages')
                .insert({
                    id: uuidv4(),
                    content: welcomeMsg,
                    sender_id: course.specialist_id, // From specialist
                    course_id: courseId,
                    type: 'group',
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
        const { title, description, price, total_sessions, specialist_id, is_active } = req.body;

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (price !== undefined) updateData.price = Number(price);
        if (total_sessions !== undefined) updateData.total_sessions = Number(total_sessions);
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
        const { payment_screenshot } = req.body; // Screenshot as base64

        const { data: payment, error: payError } = await supabase
            .from('payments')
            .insert({
                id: uuidv4(),
                user_id: userId,
                course_id: courseId,
                amount: amount || course.price,
                payment_method: payment_method || 'unknown',
                payment_code: payment_code,
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

