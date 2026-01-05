/**
 * User Routes
 * Handles user profile management
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'غير مصرح' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ error: 'التوكن غير صالح' });
    }
};

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, nickname, email, role, avatar, created_at')
            .eq('id', req.userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }

        res.json({ user });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put('/me', authMiddleware, async (req, res) => {
    try {
        const { nickname, avatar } = req.body;

        const { data, error } = await supabase
            .from('users')
            .update({ nickname, avatar })
            .eq('id', req.userId)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'فشل التحديث' });
        }

        res.json({ message: 'تم تحديث الملف الشخصي', user: data });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ أثناء التحديث' });
    }
});

/**
 * GET /api/users/enrollments
 * Get user's enrolled courses
 */
router.get('/enrollments', authMiddleware, async (req, res) => {
    try {
        const { data: enrollments, error } = await supabase
            .from('enrollments')
            .select(`
                id,
                completed_sessions,
                enrolled_at,
                course:courses (
                    id,
                    title,
                    total_sessions
                )
            `)
            .eq('user_id', req.userId)
            .order('enrolled_at', { ascending: false });

        if (error) {
            console.error('Enrollments fetch error:', error);
            return res.status(500).json({ error: 'فشل في جلب الكورسات' });
        }

        res.json({ enrollments: enrollments || [] });
    } catch (error) {
        console.error('Enrollments error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/users/schedule
 * Get user's upcoming sessions
 */
router.get('/schedule', authMiddleware, async (req, res) => {
    try {
        // Get user's enrolled courses
        const { data: enrollments, error: enrollError } = await supabase
            .from('enrollments')
            .select('course_id')
            .eq('user_id', req.userId);

        if (enrollError) {
            return res.status(500).json({ error: 'فشل في جلب الاشتراكات' });
        }

        if (!enrollments || enrollments.length === 0) {
            return res.json({ sessions: [] });
        }

        const courseIds = enrollments.map(e => e.course_id);

        // Get upcoming sessions for enrolled courses
        const { data: sessions, error: sessError } = await supabase
            .from('sessions')
            .select(`
                id,
                title,
                scheduled_at,
                status,
                course:courses (
                    id,
                    title,
                    specialist:users!courses_specialist_id_fkey (
                        nickname
                    )
                )
            `)
            .in('course_id', courseIds)
            .gte('scheduled_at', new Date().toISOString())
            .order('scheduled_at', { ascending: true })
            .limit(5);

        if (sessError) {
            console.error('Sessions fetch error:', sessError);
            return res.status(500).json({ error: 'فشل في جلب الجلسات' });
        }

        // Format sessions for frontend
        const formattedSessions = (sessions || []).map(s => ({
            id: s.id,
            title: s.title,
            course_title: s.course?.title || '',
            scheduled_at: s.scheduled_at,
            specialist_name: s.course?.specialist?.nickname || 'أخصائي'
        }));

        res.json({ sessions: formattedSessions });
    } catch (error) {
        console.error('Schedule error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * PATCH /api/user/avatar
 * Update user avatar only
 */
router.patch('/avatar', authMiddleware, async (req, res) => {
    try {
        const { avatar } = req.body;

        if (!avatar) {
            return res.status(400).json({ error: 'الأفاتار مطلوب' });
        }

        const { data, error } = await supabase
            .from('users')
            .update({ avatar, updated_at: new Date().toISOString() })
            .eq('id', req.userId)
            .select('id, nickname, avatar')
            .single();

        if (error) {
            console.error('Avatar update error:', error);
            return res.status(500).json({ error: 'فشل تحديث الأفاتار' });
        }

        res.json({ message: 'تم تحديث الأفاتار', user: data });
    } catch (error) {
        console.error('Avatar error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

// ... existing code ...

/**
 * GET /api/users/search
 * Search users by name, email or ID
 */
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.json({ users: [] });
        }

        let query = supabase
            .from('users')
            .select('id, nickname, email, avatar, role');

        // Check if query is UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);

        if (isUUID) {
            query = query.eq('id', q);
        } else {
            query = query.or(`nickname.ilike.%${q}%,email.ilike.%${q}%`);
        }

        const { data, error } = await query.limit(10);

        if (error) throw error;

        res.json({ users: data });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'حدث خطأ في البحث' });
    }
});

module.exports = router;
