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
                id, title, description, total_sessions,
                sessions:sessions(id, title, session_number, status)
            `)
            .eq('specialist_id', req.userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ courses: courses || [] });
    } catch (error) {
        console.error('Courses error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/specialist/groups
 * Get course groups assigned to this specialist
 */
router.get('/groups', async (req, res) => {
    try {
        // First get courses ids for this specialist
        const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('id, title')
            .eq('specialist_id', req.userId);

        if (coursesError) throw coursesError;

        const courseIds = courses.map(c => c.id);

        if (courseIds.length === 0) {
            return res.json({ groups: [] });
        }

        // Get groups for these courses
        const { data: groups, error: groupsError } = await supabase
            .from('course_groups')
            .select(`
                *,
                course:courses(title)
            `)
            .in('course_id', courseIds)
            .order('updated_at', { ascending: false });

        if (groupsError) throw groupsError;

        res.json({ groups: groups || [] });
    } catch (error) {
        console.error('Groups error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/specialist/schedule
 * Get all sessions (upcoming and past)
 */
router.get('/schedule', async (req, res) => {
    try {
        // Get sessions linked to specialist's courses
        // First get courses
        const { data: courses } = await supabase
            .from('courses')
            .select('id')
            .eq('specialist_id', req.userId);

        const courseIds = courses?.map(c => c.id) || [];

        if (courseIds.length === 0) {
            return res.json({ upcoming: [], past: [] });
        }

        const { data: sessions, error } = await supabase
            .from('sessions')
            .select(`
                *,
                course:courses(title)
            `)
            .in('course_id', courseIds)
            .order('scheduled_at', { ascending: true }); // Order by schedule date

        if (error) throw error;

        const now = new Date();
        const upcoming = [];
        const past = [];

        (sessions || []).forEach(session => {
            // Use scheduled_at if available, otherwise created_at
            const sessionDate = new Date(session.scheduled_at || session.created_at);
            if (sessionDate >= now && session.status !== 'ended') {
                upcoming.push(session);
            } else {
                past.push(session);
            }
        });

        // Sort past sessions desc
        past.sort((a, b) => new Date(b.scheduled_at || b.created_at) - new Date(a.scheduled_at || a.created_at));

        res.json({ upcoming, past });
    } catch (error) {
        console.error('Schedule error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * POST /api/specialist/courses/:courseId/sessions
 * Create a new session for a course
 */
router.post('/courses/:courseId/sessions', async (req, res) => {
    try {
        const { title, session_number, type, scheduled_at } = req.body;
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
            type: type || 'group',
            course_id: courseId,
            session_number: session_number || 1,
            host_id: req.userId,
            participants: [],
            status: 'waiting', // or 'scheduled'
            created_at: new Date().toISOString(),
            scheduled_at: scheduled_at || new Date().toISOString() // New field
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
