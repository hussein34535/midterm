/**
 * Session Routes
 * Handles voice call sessions with Supabase
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');
const router = express.Router();

// Auth Middleware
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
 * POST /api/sessions/create
 * Create a new voice session
 */
router.post('/create', authMiddleware, async (req, res) => {
    try {
        const { title, type } = req.body;

        const sessionData = {
            id: uuidv4(),
            channel_name: `iwaa-${uuidv4().substring(0, 8)}`,
            title: title || 'جلسة دعم نفسي',
            type: type || 'individual',
            host_id: req.userId,
            participants: [req.userId],
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
            return res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الجلسة' });
        }

        res.status(201).json({
            message: 'تم إنشاء الجلسة',
            session
        });

    } catch (error) {
        console.error('Session creation error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الجلسة' });
    }
});

/**
 * GET /api/sessions/:id
 * Get session details
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { data: session, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !session) {
            return res.status(404).json({ error: 'الجلسة غير موجودة' });
        }

        res.json({ session });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * POST /api/sessions/:id/join
 * Join a session
 */
router.post('/:id/join', authMiddleware, async (req, res) => {
    try {
        const { data: session, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !session) {
            return res.status(404).json({ error: 'الجلسة غير موجودة' });
        }

        if (session.status === 'ended') {
            return res.status(400).json({ error: 'الجلسة منتهية' });
        }

        // Add participant if not already in
        let participants = session.participants || [];
        if (!participants.includes(req.userId)) {
            participants.push(req.userId);
        }

        // Update session
        const { data: updatedSession, error: updateError } = await supabase
            .from('sessions')
            .update({
                participants,
                status: session.status === 'waiting' ? 'active' : session.status
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (updateError) {
            return res.status(500).json({ error: 'حدث خطأ أثناء الانضمام' });
        }

        res.json({
            message: 'تم الانضمام للجلسة',
            session: updatedSession
        });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * POST /api/sessions/:id/end
 * End a session
 */
router.post('/:id/end', authMiddleware, async (req, res) => {
    try {
        const { data: session, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !session) {
            return res.status(404).json({ error: 'الجلسة غير موجودة' });
        }

        if (session.host_id !== req.userId) {
            return res.status(403).json({ error: 'فقط مضيف الجلسة يمكنه إنهاءها' });
        }

        const { data: updatedSession, error: updateError } = await supabase
            .from('sessions')
            .update({
                status: 'ended',
                ended_at: new Date().toISOString()
            })
            .eq('id', req.params.id)
            .select()
            .single();

        if (updateError) {
            return res.status(500).json({ error: 'حدث خطأ أثناء إنهاء الجلسة' });
        }

        res.json({
            message: 'تم إنهاء الجلسة',
            session: updatedSession
        });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/sessions
 * Get all active sessions
 */
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select('*')
            .neq('status', 'ended')
            .order('created_at', { ascending: false });

        if (error) {
            return res.status(500).json({ error: 'حدث خطأ' });
        }

        res.json({ sessions: sessions || [] });
    } catch (error) {
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

module.exports = router;
