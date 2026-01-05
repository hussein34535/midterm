/**
 * Specialist Routes
 * Specialist-specific endpoints for course and session management
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');
const { authMiddleware, requireSpecialist } = require('../middleware/auth');
const router = express.Router();

// All specialist routes require authentication and specialist role
router.use(authMiddleware);
router.use(requireSpecialist);

/**
 * GET /api/specialist/courses
 * Get courses assigned to this specialist
 */
router.get('/courses', async (req, res) => {
    try {
        const { data: courses, error } = await supabase
            .from('courses')
            .select(`
                *,
                sessions(id, title, session_number, status)
            `)
            .eq('specialist_id', req.userId)
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
 * GET /api/specialist/courses/:courseId/sessions
 * Get sessions for a specific course
 */
router.get('/courses/:courseId/sessions', async (req, res) => {
    try {
        // Verify course belongs to specialist
        const { data: course } = await supabase
            .from('courses')
            .select('id, title, total_sessions')
            .eq('id', req.params.courseId)
            .eq('specialist_id', req.userId)
            .single();

        if (!course) {
            return res.status(404).json({ error: 'الكورس غير موجود أو ليس لك' });
        }

        const { data: sessions, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('course_id', req.params.courseId)
            .order('session_number', { ascending: true });

        if (error) {
            return res.status(500).json({ error: 'حدث خطأ' });
        }

        res.json({
            course,
            sessions: sessions || [],
            totalSessions: course.total_sessions
        });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * POST /api/specialist/courses/:courseId/sessions
 * Create a new session for a course
 */
router.post('/courses/:courseId/sessions', async (req, res) => {
    try {
        const { title, session_number } = req.body;
        const courseId = req.params.courseId;

        // Verify course belongs to specialist
        const { data: course } = await supabase
            .from('courses')
            .select('id, title, total_sessions')
            .eq('id', courseId)
            .eq('specialist_id', req.userId)
            .single();

        if (!course) {
            return res.status(404).json({ error: 'الكورس غير موجود أو ليس لك' });
        }

        const sessionData = {
            id: uuidv4(),
            channel_name: `sakina-${uuidv4().substring(0, 8)}`,
            title: title || `${course.title} - الجلسة ${session_number || 1}`,
            type: 'group',
            course_id: courseId,
            session_number: session_number || 1,
            host_id: req.userId,
            participants: [],
            status: 'waiting',
            created_at: new Date().toISOString()
        };

        const { data: session, error } = await supabase
            .from('sessions')
            .insert(sessionData)
            .select()
            .single();

        if (error) {
            console.error('Session creation error:', error);
            return res.status(500).json({ error: 'حدث خطأ' });
        }

        res.status(201).json({ message: 'تم إنشاء الجلسة', session });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * PATCH /api/specialist/sessions/:id/start
 * Start a session
 */
router.patch('/sessions/:id/start', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: session, error: fetchError } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', id)
            .eq('host_id', req.userId)
            .single();

        if (fetchError || !session) {
            return res.status(404).json({ error: 'الجلسة غير موجودة أو ليست لك' });
        }

        if (session.status === 'ended') {
            return res.status(400).json({ error: 'الجلسة منتهية بالفعل' });
        }

        const { data: updatedSession, error } = await supabase
            .from('sessions')
            .update({ status: 'active' })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'حدث خطأ' });
        }

        res.json({ message: 'تم بدء الجلسة', session: updatedSession });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * PATCH /api/specialist/sessions/:id/end
 * End a session
 */
router.patch('/sessions/:id/end', async (req, res) => {
    try {
        const { id } = req.params;

        const { data: session, error: fetchError } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', id)
            .eq('host_id', req.userId)
            .single();

        if (fetchError || !session) {
            return res.status(404).json({ error: 'الجلسة غير موجودة أو ليست لك' });
        }

        const { data: updatedSession, error } = await supabase
            .from('sessions')
            .update({
                status: 'ended',
                ended_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(500).json({ error: 'حدث خطأ' });
        }

        res.json({ message: 'تم إنهاء الجلسة', session: updatedSession });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/specialist/stats
 * Get specialist's statistics
 */
router.get('/stats', async (req, res) => {
    try {
        // Get courses count
        const { count: coursesCount } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true })
            .eq('specialist_id', req.userId);

        // Get sessions
        const { data: sessions } = await supabase
            .from('sessions')
            .select('status')
            .eq('host_id', req.userId);

        const completed = sessions?.filter(s => s.status === 'ended').length || 0;
        const active = sessions?.filter(s => s.status === 'active').length || 0;

        res.json({
            stats: {
                courses: coursesCount || 0,
                totalSessions: sessions?.length || 0,
                completedSessions: completed,
                activeSessions: active
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

module.exports = router;
