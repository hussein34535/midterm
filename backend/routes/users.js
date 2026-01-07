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
 * Get user's upcoming sessions (from their enrolled groups only)
 */
router.get('/schedule', authMiddleware, async (req, res) => {
    try {
        // Get user's enrolled groups
        const { data: enrollments, error: enrollError } = await supabase
            .from('enrollments')
            .select('group_id, course_id')
            .eq('user_id', req.userId);

        if (enrollError) {
            return res.status(500).json({ error: 'فشل في جلب الاشتراكات' });
        }

        if (!enrollments || enrollments.length === 0) {
            return res.json({ sessions: [] });
        }

        // Filter out enrollments without group_id
        const groupIds = enrollments.filter(e => e.group_id).map(e => e.group_id);

        if (groupIds.length === 0) {
            return res.json({ sessions: [] });
        }

        // Get upcoming group_sessions for user's groups
        const { data: groupSessions, error: sessError } = await supabase
            .from('group_sessions')
            .select(`
                id,
                scheduled_at,
                status,
                session:sessions!session_id(title),
                course:courses!course_id(
                    id,
                    title,
                    specialist:users!courses_specialist_id_fkey(nickname)
                )
            `)
            .in('group_id', groupIds)
            .gte('scheduled_at', new Date().toISOString())
            .neq('status', 'ended')
            .order('scheduled_at', { ascending: true })
            .limit(5);

        if (sessError) {
            console.error('Sessions fetch error:', sessError);
            return res.status(500).json({ error: 'فشل في جلب الجلسات' });
        }

        // Format sessions for frontend
        const formattedSessions = (groupSessions || []).map(s => ({
            id: s.id, // group_session id
            title: s.session?.title || 'جلسة',
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
 * Search users by name, email or ID with Pagination
 * Query Params:
 * - q: Search query (optional)
 * - page: Page number (default 1)
 * - limit: Items per page (default 100 for list, 20 for search)
 */
router.get('/search', authMiddleware, async (req, res) => {
    try {
        const { q, page = 1 } = req.query;
        let { limit } = req.query;

        // Default limit: 100 for browsing (no query), 20 for searching
        if (!limit) {
            limit = (q && q.length >= 2) ? 20 : 100;
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = supabase
            .from('users')
            .select('id, nickname, email, avatar, role', { count: 'exact' });

        if (q && q.length >= 2) {
            // Check if query is UUID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);

            if (isUUID) {
                query = query.eq('id', q);
            } else {
                query = query.or(`nickname.ilike.%${q}%,email.ilike.%${q}%`);
            }
        }

        const { data, count, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        // Check if there are more results
        const hasMore = count > to + 1;

        res.json({
            users: data,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                hasMore
            }
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'حدث خطأ في البحث' });
    }
});

/**
 * PUT /api/users/change-password
 * Update user password
 */
const bcrypt = require('bcryptjs'); // Ensure bcrypt is imported

router.put('/change-password', authMiddleware, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'كلمة المرور الحالية والجديدة مطلوبة' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
        }

        // Get current password hash
        const { data: user, error } = await supabase
            .from('users')
            .select('password')
            .eq('id', req.userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) {
            return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword, updated_at: new Date().toISOString() })
            .eq('id', req.userId);

        if (updateError) {
            return res.status(500).json({ error: 'فشل تغيير كلمة المرور' });
        }

        res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

module.exports = router;
