const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to check if user is Owner or Specialist
const checkPermission = async (req, res, next) => {
    // Basic check - in production use proper middleware with JWT
    // Currently relying on frontend sending role or token verification in server.js
    next();
};

// GET /jobs - List all groups (with filters)
router.get('/', async (req, res) => {
    try {
        const { course_id } = req.query;

        let query = supabase
            .from('course_groups')
            .select(`
                *,
                specialist:users!specialist_id(id, nickname, email, avatar),
                enrollments(count)
            `);

        if (course_id) {
            query = query.eq('course_id', course_id);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Transform data to include member count
        const groups = data.map(group => ({
            ...group,
            member_count: group.enrollments[0]?.count || 0
        }));

        res.json({ success: true, groups });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST / - Create Group
router.post('/', async (req, res) => {
    try {
        const { course_id, name, specialist_id, capacity = 4 } = req.body;

        const { data, error } = await supabase
            .from('course_groups')
            .insert([{ course_id, name, specialist_id, capacity }])
            .select()
            .single();

        if (error) throw error;

        res.json({ success: true, group: data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /:id/assign-specialist
router.put('/:id/assign-specialist', async (req, res) => {
    try {
        const { id } = req.params;
        const { specialist_id } = req.body;

        const { data, error } = await supabase
            .from('course_groups')
            .update({ specialist_id })
            .eq('id', id)
            .select();

        if (error) throw error;

        res.json({ success: true, group: data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /:id/add-user
router.post('/:id/add-user', async (req, res) => {
    try {
        const { id } = req.params;
        const { user_id } = req.body;

        // 1. Check Capacity
        const { data: group, error: groupError } = await supabase
            .from('course_groups')
            .select('capacity, enrollments(count)')
            .eq('id', id)
            .single();

        if (groupError) throw groupError;

        const currentCount = group.enrollments[0]?.count || 0;

        if (currentCount >= group.capacity) {
            return res.status(400).json({ success: false, error: 'Group is full' });
        }

        // 2. Update Enrollment
        // Check if enrollment exists
        const { data: enrollment, error: enrollCheckError } = await supabase
            .from('enrollments')
            .select('*')
            .eq('course_id', group.course_id) // Need to get course_id from group first
            .eq('user_id', user_id)
            .single();

        // If not enrolled in course, this might fail or we create enrollment
        // Assuming user must be enrolled in course first, we just update group_id

        const { data, error } = await supabase
            .from('enrollments')
            .update({ group_id: id })
            .eq('user_id', user_id)
            .select();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * GET /:id/members
 * Get all members of a specific group (for regular users to see their group members)
 */
router.get('/:id/members', async (req, res) => {
    try {
        const { id } = req.params;

        // Get group info
        const { data: group, error: groupError } = await supabase
            .from('course_groups')
            .select('id, name, course_id, member_count, capacity')
            .eq('id', id)
            .single();

        if (groupError || !group) {
            return res.status(404).json({ success: false, error: 'المجموعة غير موجودة' });
        }

        // Get members from enrollments table (members are stored here with group_id)
        const { data: members, error: membersError } = await supabase
            .from('enrollments')
            .select(`
                user_id,
                user:users(id, nickname, avatar)
            `)
            .eq('group_id', id);

        if (membersError) throw membersError;

        // Format response
        const formattedMembers = (members || []).map(m => ({
            id: m.user?.id,
            nickname: m.user?.nickname,
            avatar: m.user?.avatar
        })).filter(m => m.id);

        res.json({
            success: true,
            group: {
                id: group.id,
                name: group.name,
                member_count: group.member_count || formattedMembers.length,
                capacity: group.capacity
            },
            members: formattedMembers
        });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
