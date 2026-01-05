/**
 * Settings Routes
 * Platform settings management (Owner only for updates)
 */

const express = require('express');
const supabase = require('../lib/supabase');
const { authMiddleware, requireOwner } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/settings
 * Get all platform settings (Public)
 */
router.get('/', async (req, res) => {
    try {
        const { data: settings, error } = await supabase
            .from('settings')
            .select('key, value');

        if (error) {
            console.error('Settings fetch error:', error);
            return res.status(500).json({ error: 'حدث خطأ في جلب الإعدادات' });
        }

        // Convert array to object
        const settingsObj = {};
        (settings || []).forEach(s => {
            settingsObj[s.key] = s.value;
        });

        res.json({ settings: settingsObj });
    } catch (error) {
        console.error('Settings error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/settings/:key
 * Get a specific setting value
 */
router.get('/:key', async (req, res) => {
    try {
        const { key } = req.params;

        const { data: setting, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error || !setting) {
            return res.status(404).json({ error: 'الإعداد غير موجود' });
        }

        res.json({ key, value: setting.value });
    } catch (error) {
        console.error('Setting fetch error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * PUT /api/settings/:key
 * Update a specific setting (Owner only)
 */
router.put('/:key', authMiddleware, requireOwner, async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        if (value === undefined) {
            return res.status(400).json({ error: 'القيمة مطلوبة' });
        }

        const { data, error } = await supabase
            .from('settings')
            .upsert({
                key,
                value,
                updated_at: new Date().toISOString(),
                updated_by: req.userId
            })
            .select()
            .single();

        if (error) {
            console.error('Setting update error:', error);
            return res.status(500).json({ error: 'حدث خطأ أثناء تحديث الإعداد' });
        }

        res.json({ message: 'تم تحديث الإعداد بنجاح', setting: data });
    } catch (error) {
        console.error('Setting update error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * PUT /api/settings
 * Bulk update settings (Owner only)
 */
router.put('/', authMiddleware, requireOwner, async (req, res) => {
    try {
        const { settings } = req.body;

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ error: 'الإعدادات مطلوبة' });
        }

        // Update each setting individually
        for (const [key, value] of Object.entries(settings)) {
            const { error } = await supabase
                .from('settings')
                .upsert({
                    key,
                    value,
                    updated_at: new Date().toISOString(),
                    updated_by: req.userId
                }, { onConflict: 'key' });

            if (error) {
                console.error(`Error updating setting ${key}:`, error);
            }
        }

        res.json({ message: 'تم تحديث الإعدادات بنجاح' });
    } catch (error) {
        console.error('Settings bulk update error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

module.exports = router;
