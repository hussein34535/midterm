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

router.get('/schedule', async (req, res) => {
    try {
        // Get sessions linked to specialist's groups
        const { data: groupSessions, error } = await supabase
            .from('group_sessions')
            .select(`
                *,
                session:sessions(title, session_number),
                group:course_groups(name),
                course:courses(title)
            `)
            .order('scheduled_at', { ascending: true });

        // Filter for this specialist by joining/filtering in application
        // (Supabase join filtering can be tricky, easier to filter results if dataset is small, 
        // OR better: get specialist's groups first. 
        // Let's refine the query to be efficient.)

        // 1. Get specialist's course groups
        const { data: myGroups } = await supabase
            .from('course_groups')
            .select('id')
            .eq('specialist_id', req.userId);

        const myGroupIds = myGroups?.map(g => g.id) || [];

        if (myGroupIds.length === 0) {
            return res.json({ upcoming: [], past: [] });
        }

        const { data: sessions, error: sessionsError } = await supabase
            .from('group_sessions')
            .select(`
                id,
                scheduled_at,
                status,
                group_id,
                session:sessions!session_id(title, session_number),
                group:course_groups!group_id(name),
                course:courses!course_id(title)
            `)
            .in('group_id', myGroupIds)
            .order('scheduled_at', { ascending: true });

        if (sessionsError) throw sessionsError;

        const now = new Date();
        const upcoming = [];
        const past = [];

        sessions.forEach(s => {
            const item = {
                id: s.id, // group_session id
                title: `${s.course?.title} - ${s.group?.name} - ${s.session?.title || 'جلسة'}`,
                scheduled_at: s.scheduled_at,
                status: s.status,
                group_name: s.group?.name
            };

            const sessionDate = new Date(s.scheduled_at);
            if (sessionDate >= now && s.status !== 'ended') {
                upcoming.push(item);
            } else {
                past.push(item);
            }
        });

        // Sort past sessions desc
        past.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

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
 * POST /api/specialist/groups/:groupId/schedule
 * Schedule a syllabus session for a group
 */
router.post('/groups/:groupId/schedule', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { session_id, scheduled_at } = req.body;

        // Verify group belongs to specialist
        const { data: group } = await supabase
            .from('course_groups')
            .select('id, course_id, name')
            .eq('id', groupId)
            .eq('specialist_id', req.userId)
            .single();

        if (!group) {
            return res.status(404).json({ error: 'المجموعة غير موجودة أو ليست لك' });
        }

        // Verify session exists and belongs to course
        const { data: sessionData } = await supabase
            .from('sessions')
            .select('id, title')
            .eq('id', session_id)
            .eq('course_id', group.course_id)
            .single();

        if (!sessionData) {
            return res.status(404).json({ error: 'الجلسة غير موجودة في هذا الكورس' });
        }

        // Create group session
        const { data: groupSession, error } = await supabase
            .from('group_sessions')
            .upsert({
                group_id: groupId,
                session_id: session_id,
                course_id: group.course_id,
                scheduled_at: scheduled_at,
                status: 'scheduled',
                channel_name: `group-${groupId}-sess-${session_id}`.substring(0, 60) // Unique channel
            }, { onConflict: 'group_id, session_id' })
            .select()
            .single();

        if (error) {
            console.error('Scheduling error:', error);
            return res.status(500).json({ error: 'حدث خطأ في الجدولة' });
        }

        // Send notification to group members (TODO)

        res.status(201).json({ message: 'تم جدولة الجلسة للمجموعة', session: groupSession });

    } catch (error) {
        console.error('Schedule exception:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * PATCH /api/specialist/sessions/:id/start
 * Start a group session (id is group_session_id)
 */
router.patch('/sessions/:id/start', async (req, res) => {
    try {
        const { id } = req.params; // This is now group_session_id

        // Verify ownership via course ownership or group specialist
        // We need to join to check specialist_id
        const { data: session, error: fetchError } = await supabase
            .from('group_sessions')
            .select(`
                *,
                group:course_groups(specialist_id)
            `)
            .eq('id', id)
            .single();

        if (fetchError || !session) {
            return res.status(404).json({ error: 'الجلسة غير موجودة' });
        }

        if (session.group?.specialist_id !== req.userId) {
            return res.status(403).json({ error: 'ليس لديك صلاحية بدء هذه الجلسة' });
        }

        if (session.status === 'ended') {
            return res.status(400).json({ error: 'الجلسة منتهية بالفعل' });
        }

        const { data: updatedSession, error } = await supabase
            .from('group_sessions')
            .update({
                status: 'active',
                started_at: new Date().toISOString()
            })
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
 * End a group session
 */
router.patch('/sessions/:id/end', async (req, res) => {
    try {
        const { id } = req.params; // group_session_id

        const { data: session, error: fetchError } = await supabase
            .from('group_sessions')
            .select(`
                 *,
                 group:course_groups(specialist_id)
             `)
            .eq('id', id)
            .single();

        if (fetchError || !session) {
            return res.status(404).json({ error: 'الجلسة غير موجودة' });
        }

        if (session.group?.specialist_id !== req.userId) {
            return res.status(403).json({ error: 'ليس لديك صلاحية إنهاء هذه الجلسة' });
        }

        const { data: updatedSession, error } = await supabase
            .from('group_sessions')
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
