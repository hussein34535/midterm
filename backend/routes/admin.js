/**
 * Admin Routes
 * Owner/Admin endpoints for platform management
 */

const express = require('express');
const supabase = require('../lib/supabase');
const { authMiddleware, requireAdmin, requireOwner } = require('../middleware/auth');
const router = express.Router();

// All admin routes require authentication
router.use(authMiddleware);

/**
 * GET /api/admin/stats
 * Get platform statistics (Admin+)
 */
router.get('/stats', requireAdmin, async (req, res) => {
    try {
        // Get user count
        const { count: userCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        // Get session counts
        const { count: totalSessions } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true });

        const { count: activeSessions } = await supabase
            .from('sessions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        const { count: specialistCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'specialist');

        // Get revenue stats from payments
        const { data: payments } = await supabase
            .from('payments')
            .select('amount, status, created_at');

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

        let totalRevenue = 0;
        let monthlyRevenue = 0;
        let pendingRevenue = 0;

        (payments || []).forEach(p => {
            const amount = parseFloat(p.amount) || 0;
            if (p.status === 'confirmed' || p.status === 'completed') {
                totalRevenue += amount;
                if (p.created_at >= startOfMonth) {
                    monthlyRevenue += amount;
                }
            } else if (p.status === 'pending') {
                pendingRevenue += amount;
            }
        });

        // Get course count
        const { count: courseCount } = await supabase
            .from('courses')
            .select('*', { count: 'exact', head: true });

        // Get enrollment count
        const { count: enrollmentCount } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true });

        res.json({
            stats: {
                users: userCount || 0,
                specialists: specialistCount || 0,
                totalSessions: totalSessions || 0,
                activeSessions: activeSessions || 0,
                courses: courseCount || 0,
                enrollments: enrollmentCount || 0,
                totalRevenue,
                monthlyRevenue,
                pendingRevenue
            }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'حدث خطأ في جلب الإحصائيات' });
    }
});

/**
 * GET /api/admin/users
 * List all users (Admin+)
 */
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id, nickname, email, avatar, role, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Users fetch error:', error);
            return res.status(500).json({ error: 'حدث خطأ في جلب المستخدمين' });
        }

        res.json({ users: users || [] });
    } catch (error) {
        console.error('Users error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * PATCH /api/admin/users/:id/role
 * Change user role (Owner can change anything, Admin can only promote to specialist)
 */
router.patch('/users/:id/role', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Validate role
        const validRoles = ['user', 'specialist', 'admin', 'owner'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: 'رتبة غير صالحة' });
        }

        // Only owner can assign 'admin' or 'owner' roles
        if ((role === 'admin' || role === 'owner') && req.userRole !== 'owner') {
            return res.status(403).json({
                error: 'فقط المالك يمكنه تعيين رتبة مدير أو مالك'
            });
        }

        // Prevent demoting yourself
        if (id === req.userId && role !== req.userRole) {
            return res.status(400).json({ error: 'لا يمكنك تغيير رتبتك الخاصة' });
        }

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ role, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('id, nickname, email, role')
            .single();

        if (error) {
            console.error('Role update error:', error);
            return res.status(500).json({ error: 'حدث خطأ أثناء تحديث الرتبة' });
        }

        res.json({
            message: 'تم تحديث الرتبة بنجاح',
            user: updatedUser
        });
    } catch (error) {
        console.error('Role update error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * DELETE /api/admin/users/:id
 * Ban/Delete user (Admin+, but only Owner can delete Admins)
 */
router.delete('/users/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        // Get user to check role
        const { data: targetUser, error: fetchError } = await supabase
            .from('users')
            .select('role')
            .eq('id', id)
            .single();

        if (fetchError || !targetUser) {
            return res.status(404).json({ error: 'المستخدم غير موجود' });
        }

        // Only owner can delete admins
        if (targetUser.role === 'admin' && req.userRole !== 'owner') {
            return res.status(403).json({ error: 'فقط المالك يمكنه حذف المديرين' });
        }

        // Cannot delete owner
        if (targetUser.role === 'owner') {
            return res.status(403).json({ error: 'لا يمكن حذف المالك' });
        }

        // Prevent self-deletion
        if (id === req.userId) {
            return res.status(400).json({ error: 'لا يمكنك حذف حسابك من هنا' });
        }

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Delete error:', error);
            return res.status(500).json({ error: 'حدث خطأ أثناء الحذف' });
        }

        res.json({ message: 'تم حذف المستخدم بنجاح' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/admin/sessions
 * Get all sessions (Admin+)
 */
router.get('/sessions', requireAdmin, async (req, res) => {
    try {
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select(`
                *,
                host:users!host_id(id, nickname, email)
            `)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Sessions fetch error:', error);
            return res.status(500).json({ error: 'حدث خطأ' });
        }

        res.json({ sessions: sessions || [] });
    } catch (error) {
        console.error('Sessions error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/admin/specialists
 * Get all specialists (Admin+)
 */
router.get('/specialists', requireAdmin, async (req, res) => {
    try {
        const { data: specialists, error } = await supabase
            .from('users')
            .select('id, nickname, email, avatar, created_at')
            .eq('role', 'specialist')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Specialists fetch error:', error);
            return res.status(500).json({ error: 'حدث خطأ في جلب الأخصائيين' });
        }

        // Get course counts for each specialist
        const specialistsWithCounts = await Promise.all(
            (specialists || []).map(async (spec) => {
                const { count } = await supabase
                    .from('courses')
                    .select('*', { count: 'exact', head: true })
                    .eq('specialist_id', spec.id);

                return {
                    ...spec,
                    courses_count: count || 0
                };
            })
        );

        res.json({ specialists: specialistsWithCounts });
    } catch (error) {
        console.error('Specialists error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

module.exports = router;

