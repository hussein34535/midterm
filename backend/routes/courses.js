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
 * POST /api/courses/:id/enroll
 * Enroll user in course
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

        // Create enrollment
        const { data: enrollment, error } = await supabase
            .from('enrollments')
            .insert({
                id: uuidv4(),
                user_id: userId,
                course_id: courseId
            })
            .select()
            .single();

        if (error) {
            console.error('Enrollment error:', error);
            return res.status(500).json({ error: 'حدث خطأ' });
        }

        res.status(201).json({ message: 'تم الاشتراك بنجاح', enrollment });
    } catch (error) {
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
        const { data: payment, error: payError } = await supabase
            .from('payments')
            .insert({
                id: uuidv4(),
                user_id: userId,
                course_id: courseId,
                amount: amount || course.price,
                payment_method: payment_method || 'unknown',
                payment_code: payment_code,
                status: 'pending',
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (payError) {
            console.error('Payment record error:', payError);
            // Continue anyway - enrollment is more important
        }

        // Create enrollment
        const { data: enrollment, error: enrollError } = await supabase
            .from('enrollments')
            .insert({
                id: uuidv4(),
                user_id: userId,
                course_id: courseId,
                payment_id: payment?.id,
                enrolled_at: new Date().toISOString()
            })
            .select()
            .single();

        if (enrollError) {
            console.error('Enrollment error:', enrollError);
            return res.status(500).json({ error: 'حدث خطأ في التسجيل' });
        }

        // Send Welcome Message to Group Chat
        try {
            await supabase
                .from('messages')
                .insert({
                    course_id: courseId,
                    content: `مرحباً بك في الكورس! 🎉 يسعدنا انضمامك إلينا.`,
                    type: 'alert',
                    is_system: true,
                    sender_id: userId, // The user announced their arrival (or use Admin ID if preferred)
                    created_at: new Date().toISOString()
                });
        } catch (msgError) {
            console.error('Welcome message error:', msgError);
        }

        res.status(201).json({
            message: 'تم التسجيل بنجاح! سيتم تفعيل اشتراكك بعد التحقق من الدفع',
            enrollment,
            payment
        });
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

module.exports = router;

