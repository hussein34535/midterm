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
                specialist:users!specialist_id(id, nickname, email, avatar)
            `);

        if (course_id) {
            query = query.eq('course_id', course_id);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Get actual member count for each group from enrollments (exclude owners)
        const groupsWithCounts = await Promise.all(
            data.map(async (group) => {
                const { count } = await supabase
                    .from('enrollments')
                    .select('*, user:users!inner(role)', { count: 'exact', head: true })
                    .eq('group_id', group.id)
                    .neq('user.role', 'owner');

                return {
                    ...group,
                    member_count: count || 0
                };
            })
        );

        res.json({ success: true, groups: groupsWithCounts });
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

        // 1. Check Capacity (exclude owner)
        const { data: group, error: groupError } = await supabase
            .from('course_groups')
            .select('capacity, course_id')
            .eq('id', id)
            .single();

        if (groupError) throw groupError;

        const { count } = await supabase
            .from('enrollments')
            .select('*, user:users!inner(role)', { count: 'exact', head: true })
            .eq('group_id', id)
            .neq('user.role', 'owner');

        const currentCount = count || 0;

        if (currentCount >= group.capacity) {
            return res.status(400).json({ success: false, error: 'Group is full' });
        }

        // 2. Update/Create Enrollment
        // Use upsert to handle both cases (existing enrollment or new one)
        const { data, error } = await supabase
            .from('enrollments')
            .upsert({
                user_id: user_id,
                course_id: group.course_id,
                group_id: id,
                enrolled_at: new Date().toISOString(),
                status: 'active'
            }, {
                onConflict: 'user_id, course_id'
            })
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
 * Note: id can be either group_id OR course_id (since conversations use course_id)
 */
router.get('/:id/members', async (req, res) => {
    try {
        const { id } = req.params;

        // Try to find group by ID first
        let { data: group, error: groupError } = await supabase
            .from('course_groups')
            .select('id, name, course_id, capacity')
            .eq('id', id)
            .single();

        // If not found by group_id, try by course_id
        if (groupError || !group) {
            const { data: groupByCourse } = await supabase
                .from('course_groups')
                .select('id, name, course_id, capacity')
                .eq('course_id', id)
                .limit(1)
                .single();

            group = groupByCourse;
        }

        // Get course info if we still don't have a group
        if (!group) {
            // Maybe there's no group yet, get members directly from enrollments by course_id
            const { data: members, error: membersError } = await supabase
                .from('enrollments')
                .select(`
                    user_id,
                    user:users(id, nickname, avatar)
                `)
                .eq('course_id', id);

            if (membersError) throw membersError;

            const formattedMembers = (members || []).map(m => ({
                id: m.user?.id,
                nickname: m.user?.nickname,
                avatar: m.user?.avatar
            })).filter(m => m.id);

            return res.json({
                success: true,
                group: { id, name: 'أعضاء الكورس', member_count: formattedMembers.length, capacity: 4 },
                members: formattedMembers
            });
        }

        // Get members from enrollments table using group_id (exclude owners)
        const { data: members, error: membersError } = await supabase
            .from('enrollments')
            .select(`
                user_id,
                user:users!inner(id, nickname, avatar, role)
            `)
            .eq('group_id', group.id)
            .neq('user.role', 'owner');

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
                member_count: formattedMembers.length,
                capacity: group.capacity
            },
            members: formattedMembers
        });
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /:id/members/:userId
 * Remove a member from a group/course (Admin only)
 * Note: id can be group_id or course_id
 */
router.delete('/:id/members/:userId', async (req, res) => {
    try {
        const { id, userId } = req.params;

        // First try to find if this is a group_id
        let courseId = id;
        const { data: group } = await supabase
            .from('course_groups')
            .select('course_id')
            .eq('id', id)
            .single();

        if (group) {
            courseId = group.course_id;
        }

        // Delete the enrollment entirely (removes user from course)
        const { error } = await supabase
            .from('enrollments')
            .delete()
            .eq('course_id', courseId)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ success: true, message: 'تم إزالة العضو من المجموعة' });
    } catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * DELETE /:id
 * Delete a group
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Clear group_id from enrollments first
        await supabase
            .from('enrollments')
            .update({ group_id: null })
            .eq('group_id', id);

        // 2. Delete the group
        const { error } = await supabase
            .from('course_groups')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: 'تم حذف المجموعة' });
    } catch (error) {
        console.error('Delete group error:', error);
        res.status(500).json({ success: false, error: 'فشل حذف المجموعة' });
    }
});

module.exports = router;
