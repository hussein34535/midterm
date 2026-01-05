/**
 * Messages Routes
 * Handles messaging between users and specialists
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');

// Configure Multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

const { authMiddleware } = require('../middleware/auth');

/**
 * GET /api/messages/conversations
 * Get list of conversations (Direct + Groups)
 */
router.get('/conversations', authMiddleware, async (req, res) => {
    try {
        // 1. Get Direct Messages (users)
        const { data: messages, error } = await supabase
            .from('messages')
            .select(`
                id,
                content,
                sender_id,
                receiver_id,
                course_id,
                created_at,
                read,
                type,
                sender:users!messages_sender_id_fkey (id, nickname, avatar),
                receiver:users!messages_receiver_id_fkey (id, nickname, avatar)
            `)
            .or(`sender_id.eq.${req.userId},receiver_id.eq.${req.userId}`)
            .is('course_id', null) // Only direct messages
            .order('created_at', { ascending: false });

        if (error && error.code !== 'PGRST116') {
            console.error('Conversations fetch error:', error);
        }

        const conversationsMap = new Map();

        // Process Direct Messages
        (messages || []).forEach(msg => {
            const partnerId = msg.sender_id === req.userId ? msg.receiver_id : msg.sender_id;
            const partner = msg.sender_id === req.userId ? msg.receiver : msg.sender;

            if (!conversationsMap.has(partnerId)) {
                conversationsMap.set(partnerId, {
                    id: partnerId,
                    type: 'direct',
                    user: partner,
                    lastMessage: msg.type === 'image' ? '📷 صورة' : msg.content,
                    lastMessageAt: msg.created_at,
                    unreadCount: 0
                });
            }

            if (msg.receiver_id === req.userId && !msg.read) {
                const conv = conversationsMap.get(partnerId);
                conv.unreadCount++;
            }
        });

        // 2. Get Course Groups (where user is enrolled or specialist)
        // A. Enrolled Courses
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select('course:courses(id, title, specialist_id)')
            .eq('user_id', req.userId);

        // B. Teaching Courses
        const { data: teaching } = await supabase
            .from('courses')
            .select('id, title, specialist_id')
            .eq('specialist_id', req.userId);

        const myCourses = [
            ...(enrollments || []).map(e => e.course),
            ...(teaching || [])
        ];

        // Fetch last message for each course
        const groupConversations = await Promise.all(myCourses.map(async (course) => {
            if (!course) return null;

            const { data: lastMsg } = await supabase
                .from('messages')
                .select('*')
                .eq('course_id', course.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            // Count unread (naive approach: count all unread since last read? 
            // For now, handling unread in groups is complex without a read_receipts table.
            // We'll skip unread count for groups for MVP or just show last message)

            return {
                id: course.id,
                type: 'group',
                user: {
                    id: course.id,
                    nickname: course.title, // Use course title as name
                    avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(course.title) + '&background=random',
                    isCourse: true
                },
                lastMessage: lastMsg ? (lastMsg.type === 'schedule' ? '📅 موعد جديد' : lastMsg.content) : 'مرحبًا بك في شات الكورس',
                lastMessageAt: lastMsg?.created_at || new Date().toISOString(),
                unreadCount: 0
            };
        }));

        const allConversations = [
            ...Array.from(conversationsMap.values()),
            ...groupConversations.filter(c => c !== null)
        ].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

        res.json({ conversations: allConversations });
    } catch (error) {
        console.error('Conversations error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/messages/unread-count
 * Get count of unread messages for current user
 * IMPORTANT: This route MUST be before /:id routes!
 */
router.get('/unread-count', authMiddleware, async (req, res) => {
    try {
        // Count unread direct messages
        const { count: directUnread } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', req.userId)
            .eq('read', false);

        res.json({ unreadCount: directUnread || 0 });
    } catch (error) {
        console.error('Unread count error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * POST /api/messages/support
 * Initiate chat with support (Owner)
 * IMPORTANT: This route MUST be before /:id routes!
 */
router.post('/support', authMiddleware, async (req, res) => {
    try {
        // Find the owner
        const { data: owner } = await supabase
            .from('users')
            .select('id, nickname, avatar')
            .eq('role', 'owner')
            .limit(1)
            .single();

        if (!owner) {
            return res.status(404).json({ error: 'خدمة الدعم غير متاحة حالياً' });
        }

        // Return owner details to frontend to start chat
        res.json({
            owner: {
                id: owner.id,
                nickname: 'الدعم الفني',
                avatar: owner.avatar
            }
        });
    } catch (error) {
        console.error('Support init error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * GET /api/messages/:id
 * Get messages with a specific user OR course group
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // 'direct' or 'group'

        let query = supabase
            .from('messages')
            .select(`
                id, content, sender_id, receiver_id, course_id, created_at, read, type, metadata, reply_to_id,
                sender:users!messages_sender_id_fkey(id, nickname, avatar)
            `)
            .order('created_at', { ascending: true });

        if (type === 'group') {
            // Fetch course messages
            query = query.eq('course_id', id);
        } else {
            // Fetch direct messages
            query = query.or(`and(sender_id.eq.${req.userId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${req.userId})`);
        }

        const { data: messages, error } = await query;

        if (error) {
            console.error('Messages fetch error:', error);
            return res.status(500).json({ error: 'فشل في جلب الرسائل' });
        }

        // Mark messages as read (if direct)
        if (type !== 'group') {
            await supabase
                .from('messages')
                .update({ read: true })
                .eq('sender_id', id)
                .eq('receiver_id', req.userId);
        }

        // Build a map for quick reply lookups
        const messageMap = new Map();
        (messages || []).forEach(m => messageMap.set(m.id, m));

        // Format for frontend
        const formattedMessages = (messages || []).map(m => {
            // Get replied message if exists
            let replyTo = null;
            if (m.reply_to_id && messageMap.has(m.reply_to_id)) {
                const repliedMsg = messageMap.get(m.reply_to_id);
                replyTo = {
                    id: repliedMsg.id,
                    content: repliedMsg.content,
                    senderName: repliedMsg.sender?.nickname
                };
            }

            return {
                id: m.id,
                content: m.content,
                senderId: m.sender_id,
                senderName: m.sender?.nickname,
                senderAvatar: m.sender?.avatar,
                createdAt: m.created_at,
                read: m.read,
                type: m.type,
                metadata: m.metadata || {},
                replyTo
            };
        });

        res.json({ messages: formattedMessages });
    } catch (error) {
        console.error('Messages error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * POST /api/messages/:id
 * Send a message to a specific user or course group
 */
router.post('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { content, type, replyToId, msgType } = req.body; // type: for routing (group/direct), msgType: for content (text/sticker)

        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'الرسالة فارغة' });
        }

        const messageData = {
            sender_id: req.userId,
            content: content.trim(),
            read: false,
            created_at: new Date().toISOString(),
            reply_to_id: replyToId || null
            // type is handled by DB default
        };

        if (type === 'group') {
            messageData.course_id = id;
            messageData.receiver_id = null; // Group message
        } else {
            messageData.receiver_id = id;
            messageData.course_id = null; // Direct message
        }

        const { data: message, error } = await supabase
            .from('messages')
            .insert(messageData)
            .select(`*, sender:users!messages_sender_id_fkey(id, nickname, avatar)`)
            .single();

        if (error) {
            console.error('Message insert error:', error);
            return res.status(500).json({ error: `فشل في إرسال الرسالة: ${error.message}`, details: error });
        }

        // Fetch replyTo data if exists
        let replyTo = null;
        if (replyToId) {
            const { data: repliedMsg } = await supabase
                .from('messages')
                .select(`id, content, sender:users!messages_sender_id_fkey(nickname)`)
                .eq('id', replyToId)
                .single();

            if (repliedMsg) {
                replyTo = {
                    id: repliedMsg.id,
                    content: repliedMsg.content,
                    senderName: repliedMsg.sender?.nickname
                };
            }
        }

        res.json({
            message: {
                id: message.id,
                content: message.content,
                senderId: message.sender_id,
                senderName: message.sender?.nickname,
                senderAvatar: message.sender?.avatar,
                createdAt: message.created_at,
                read: message.read,
                type: message.type || 'text',
                replyTo
            }
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * POST /api/messages/:id/image
 * Upload image message
 */
router.post('/:id/image', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'لم يتم اختيار صورة' });
        }

        // Upload to Supabase Storage
        // Check if bucket exists, if not create it
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.find(b => b.name === 'chat-images');

        if (!bucketExists) {
            const { error: createBucketError } = await supabase.storage.createBucket('chat-images', {
                public: true,
                fileSizeLimit: 5242880, // 5MB
                allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
            });

            if (createBucketError) {
                console.error('Failed to create bucket:', createBucketError);
                // Continue anyway, maybe it exists but listing failed
            }
        }

        // Filename: timestamp_random_cleanoriginal
        const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}_${file.originalname.replace(/[^a-zA-Z0-9.]/g, '')}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('chat-images')
            .upload(filename, file.buffer, {
                contentType: file.mimetype,
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase upload error:', uploadError);
            return res.status(500).json({ error: `فشل رفع الصورة: ${uploadError.message}` });
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('chat-images')
            .getPublicUrl(filename);

        // Prepare message data
        const messageData = {
            sender_id: req.userId,
            content: publicUrl,
            read: false,
            created_at: new Date().toISOString(),
            // type removed - let DB use default
            metadata: {
                fileName: file.originalname,
                size: file.size,
                mimetype: file.mimetype
            }
        };

        if (type === 'group') {
            messageData.course_id = id;
        } else {
            messageData.receiver_id = id;
        }

        const { data: message, error: dbError } = await supabase
            .from('messages')
            .insert(messageData)
            .select(`
                id, content, sender_id, receiver_id, course_id, created_at, read, type, metadata,
                sender:users!messages_sender_id_fkey(id, nickname, avatar)
            `)
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            return res.status(500).json({ error: 'فشل حفظ الرسالة' });
        }

        res.json({
            message: {
                id: message.id,
                content: message.content, // Image URL
                senderId: message.sender_id,
                senderName: message.sender?.nickname,
                senderAvatar: message.sender?.avatar,
                createdAt: message.created_at,
                read: message.read,
                type: message.type,
                metadata: message.metadata
            }
        });

    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء الرفع' });
    }
});

/**
 * POST /api/messages/:id/schedule
 * Schedule a session from chat (Specialist only)
 */
router.post('/:id/schedule', authMiddleware, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { date, time, title } = req.body;

        // Verify user is specialist of course OR is owner/admin
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('specialist_id')
            .eq('id', courseId)
            .single();

        // Owner and admin can schedule for any course
        const isOwnerOrAdmin = req.userRole === 'owner' || req.userRole === 'admin';
        const isSpecialist = course && course.specialist_id === req.userId;

        if (!course) {
            return res.status(404).json({ error: 'الكورس غير موجود' });
        }

        if (!isOwnerOrAdmin && !isSpecialist) {
            return res.status(403).json({ error: 'غير مصرح لك بجدولة جلسات لهذا الكورس' });
        }

        // Create Session
        const scheduledAt = new Date(`${date}T${time}`);
        const { data: session, error: sessionError } = await supabase
            .from('sessions')
            .insert({
                course_id: courseId,
                title: title || 'جلسة جديدة',
                scheduled_at: scheduledAt.toISOString(),
                status: 'scheduled',
                channel_name: 'session_' + Math.random().toString(36).substring(7)
            })
            .select()
            .single();

        if (sessionError) {
            console.error('Session create error:', sessionError);
            return res.status(500).json({ error: 'فشل في إنشاء الجلسة' });
        }

        // Send System Message to Group Chat
        const { data: message, error: msgError } = await supabase
            .from('messages')
            .insert({
                sender_id: req.userId,
                course_id: courseId,
                content: `تم تحديد موعد جلسة جديدة: ${title}`,
                type: 'schedule',
                is_system: true,
                metadata: {
                    session_id: session.id,
                    scheduled_at: session.scheduled_at
                }
            })
            .select(`*, sender:users!messages_sender_id_fkey(id, nickname, avatar)`)
            .single();

        res.json({
            message: 'تم جدولة الجلسة بنجاح',
            chatMessage: {
                id: message.id,
                content: message.content,
                senderId: message.sender_id,
                senderName: message.sender?.nickname,
                senderAvatar: message.sender?.avatar,
                createdAt: message.created_at,
                type: 'schedule',
                metadata: message.metadata
            }
        });

    } catch (error) {
        console.error('Schedule error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

module.exports = router;
