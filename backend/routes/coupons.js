const express = require('express');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');
const { authMiddleware, requireOwner } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/coupons
 * List all coupons (Owner only)
 */
router.get('/', authMiddleware, requireOwner, async (req, res) => {
    try {
        const { data: coupons, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ coupons: coupons || [] });
    } catch (error) {
        console.error('Fetch coupons error:', error);
        res.status(500).json({ error: 'حدث خطأ في جلب الكوبونات' });
    }
});

/**
 * POST /api/coupons
 * Create new coupon (Owner only)
 */
router.post('/', authMiddleware, requireOwner, async (req, res) => {
    try {
        const { code, discount_type, value, usage_limit, expires_at } = req.body;

        if (!code || !discount_type || !value) {
            return res.status(400).json({ error: 'بيانات غير مكتملة' });
        }

        const { data: coupon, error } = await supabase
            .from('coupons')
            .insert({
                id: uuidv4(),
                code: code.toUpperCase(),
                discount_type,
                value: Number(value),
                usage_limit: usage_limit ? Number(usage_limit) : null,
                expires_at: expires_at || null,
                created_by: req.userId,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return res.status(400).json({ error: 'كود الكوبون مستخدم مسبقاً' });
            }
            throw error;
        }

        res.status(201).json({ message: 'تم إنشاء الكوبون', coupon });
    } catch (error) {
        console.error('Create coupon error:', error);
        res.status(500).json({ error: 'حدث خطأ في إنشاء الكوبون' });
    }
});

/**
 * DELETE /api/coupons/:id
 * Deactivate/Delete coupon (Owner only)
 */
router.delete('/:id', authMiddleware, requireOwner, async (req, res) => {
    try {
        // Hard delete (actually remove from database)
        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;

        res.json({ message: 'تم حذف الكوبون' });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ في حذف الكوبون' });
    }
});

/**
 * POST /api/coupons/validate
 * Validate coupon code (Public/Auth)
 */
router.post('/validate', authMiddleware, async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'أدخل كود الكوبون' });

        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error || !coupon) {
            return res.status(404).json({ valid: false, error: 'الكوبون غير صحيح' });
        }

        // Check expiration
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
            return res.status(400).json({ valid: false, error: 'الكوبون منتهي الصلاحية' });
        }

        // Check usage limit
        if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
            return res.status(400).json({ valid: false, error: 'تم تجاوز حد استخدام الكوبون' });
        }

        res.json({
            valid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discount_type: coupon.discount_type,
                value: coupon.value
            }
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

module.exports = router;
