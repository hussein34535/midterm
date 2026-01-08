/**
 * Messages Routes
 * Handles messaging between users and specialists
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const sharp = require('sharp');

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
        // 1. Get Direct Messages (users)
        let orQuery = `sender_id.eq.${req.userId},receiver_id.eq.${req.userId}`;

        // If Owner, also fetch messages interacting with SYSTEM USER (Shared Inbox) or Legacy Guest
        if (req.userRole === 'owner') {
            const { data: systemUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', 'system@iwaa.com')
                .single();

            const legacyId = 'b1cb10e6-002e-4377-850e-2c3bcbdfb648';

            if (systemUser) {
                orQuery += `,sender_id.eq.${systemUser.id},receiver_id.eq.${systemUser.id}`;
            }
            // Add Legacy ID
            orQuery += `,sender_id.eq.${legacyId},receiver_id.eq.${legacyId}`;
        }

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
                sender:users!messages_sender_id_fkey (id, nickname, avatar, role),
                receiver:users!messages_receiver_id_fkey (id, nickname, avatar, role)
            `)
            .or(orQuery)
            .is('course_id', null) // Only direct messages
            .order('created_at', { ascending: false });

        if (error && error.code !== 'PGRST116') {
            console.error('Conversations fetch error:', error);
        }

        const conversationsMap = new Map();

        // Process Direct Messages
        // console.log(`Conversations for User ${req.userId}: found ${messages?.length} messages`);

        // Helper to check if ID is System
        const SYSTEM_EMAIL = 'system@iwaa.com';
        // (Optimally this ID should be fetched once and cached, but for now we rely on the query above having worked
        //  or we can deduce it from the message if one participant is System).
        // Actually, we need to know WHICH ID is System to map correctly. 
        // Let's assume the System User was found in the query block above if owner.

        let systemUserId = null;
        if (req.userRole === 'owner') {
            const { data: systemUser } = await supabase.from('users').select('id').eq('email', SYSTEM_EMAIL).single();
            systemUserId = systemUser?.id;
        }

        (messages || []).forEach(msg => {
            // Logic for Owner viewing Shared Inbox:
            // If msg is (System <-> User), the partner is User.
            // If msg is (Owner <-> User), the partner is User.
            // If msg is (Owner <-> Owner), standard logic.

            let partnerId, partner;

            // Check if this is a System Message (Shared Inbox)
            if (systemUserId && (msg.sender_id === systemUserId || msg.receiver_id === systemUserId)) {
                // Partner is the OTHER person (The User)
                partnerId = msg.sender_id === systemUserId ? msg.receiver_id : msg.sender_id;
                partner = msg.sender_id === systemUserId ? msg.receiver : msg.sender;
            } else {
                // Standard Direct Message
                partnerId = msg.sender_id === req.userId ? msg.receiver_id : msg.sender_id;
                partner = msg.sender_id === req.userId ? msg.receiver : msg.sender;
            }

            // Debug log for missing partner
            if (!partner) {
                console.log('Missing partner for msg:', msg.id, 'PartnerID:', partnerId);
                return; // Skip invalid messages
            }

            // BRANDING: If partner is Owner, mask as Support (only if I am NOT an owner)
            if (req.userRole !== 'owner' && partner && partner.role === 'owner') {
                partner = { ...partner, nickname: 'دعم إيواء', avatar: '/logo.png' };
            }
            // BRANDING: If partner is System, mask as Support
            if (partner && partner.email === SYSTEM_EMAIL) {
                partner = { ...partner, nickname: 'دعم إيواء', avatar: '/logo.png' };
            }

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

            // Check unread status
            let isUnreadToMe = false;

            if (msg.receiver_id === req.userId) {
                isUnreadToMe = !msg.read;
            } else if (req.userRole === 'owner') {
                // Owner also checks System and Legacy
                const legacyId = 'b1cb10e6-002e-4377-850e-2c3bcbdfb648';
                // System user check: if msg.receiver_id matches systemUserId (fetched above) or hardcoded known system ID?
                // We fetched systemUserId above inside the loop. Let's rely on that variable being available in scope.

                if (systemUserId && msg.receiver_id === systemUserId) isUnreadToMe = !msg.read;
                if (msg.receiver_id === legacyId) isUnreadToMe = !msg.read;
            }

            if (isUnreadToMe) {
                const conv = conversationsMap.get(partnerId);
                if (conv) conv.unreadCount++;
            }
        });

        // 2. Get Course Groups (where user is enrolled or specialist)
        // A. Enrolled Courses
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select(`
                group_id,
                course:courses(id, title, specialist_id),
                group:course_groups(name)
            `)
            .eq('user_id', req.userId);

        // B. Teaching Courses
        const { data: teaching } = await supabase
            .from('courses')
            .select('id, title, specialist_id')
            .eq('specialist_id', req.userId);

        // Combine but preserve group info for students
        const studentCourses = (enrollments || []).map(e => ({
            ...e.course,
            groupName: e.group?.name, // Use group name if assigned
            groupId: e.group_id,      // Use group ID to ensure correct member fetching
            isStudent: true
        }));

        const specialistCourses = (teaching || []).map(c => ({
            ...c,
            groupName: c.title, // Specialists see course title
            isStudent: false
        }));

        let ownerCourses = [];
        if (req.userRole === 'owner') {
            // Fetch ALL courses for owners
            const { data: allCourses } = await supabase
                .from('courses')
                .select('id, title, specialist_id');

            ownerCourses = (allCourses || []).map(c => ({
                ...c,
                groupName: c.title, // Owners see full course title (global view)
                isStudent: false
            }));
        }

        // Avoid duplicates if owner is also specialist
        // For simplicity, if owner, use ownerCourses (which is all).
        // If not owner, use teaching + student.
        let myCourses = [];
        if (req.userRole === 'owner') {
            myCourses = ownerCourses;
            // Add enrollments if they are enrolled in OTHER courses? 
            // Owners usually don't enroll, but if they do, merging might duplicate if they are also owners.
            // Simplest: Owner sees ALL courses.
        } else {
            myCourses = [...studentCourses, ...specialistCourses];
        }

        // Fetch last message for each course
        // Fetch last message for ALL courses in one query (Optimization)
        const courseIds = myCourses.map(c => c.id).filter(id => id);

        let latestMessagesMap = new Map();

        if (courseIds.length > 0) {
            // Fetch latest messages for these courses
            // Since we can't easily "group by" and get latest in one simple query without RPC,
            // we will fetch the recent messages for these courses and filter in JS.
            // Assumption: Not too many courses, or recent messages are enough.
            // Better strategy: Limit to decent number (e.g., 50 last messages total?) 
            // No, that might miss a course. 
            // We fetch messages for these courses, ordered by date desc.
            // To avoid fetching HUGE data, we can try to rely on the fact that we need just ONE per course.
            // But standard SQL 'distinct on' is needed. 
            // For now, we fetch a batch and process.

            const { data: batchMessages } = await supabase
                .from('messages')
                .select('id, content, created_at, type, course_id')
                .in('course_id', courseIds)
                .order('created_at', { ascending: false })
                .limit(500); // Fetch last 500 course messages total. Should cover most active courses.

            (batchMessages || []).forEach(msg => {
                if (!latestMessagesMap.has(msg.course_id)) {
                    latestMessagesMap.set(msg.course_id, msg);
                }
            });
        }

        const groupConversations = myCourses.map(course => {
            if (!course) return null;

            const lastMsg = latestMessagesMap.get(course.id);

            // Display Name: Group Name for students, Course Title for specialist
            const displayName = course.groupName || course.title;

            return {
                id: course.groupId || course.id, // Use Group ID for students so they see their group members
                type: 'group',
                user: {
                    id: course.groupId || course.id, // Use Group ID for avatar link too
                    nickname: displayName, // Use group name or course title
                    avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(displayName) + '&background=random',
                    isCourse: true
                },
                lastMessage: lastMsg ? (lastMsg.type === 'schedule' ? '📅 موعد جديد' : lastMsg.content) : 'مرحبًا بك في شات الكورس',
                lastMessageAt: lastMsg?.created_at || new Date().toISOString(),
                unreadCount: 0
            };
        });

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
        // For Owner: Include System and Legacy
        let receiverIds = [req.userId];

        if (req.userRole === 'owner') {
            const { data: systemUser } = await supabase.from('users').select('id').eq('email', 'system@iwaa.com').single();
            if (systemUser) receiverIds.push(systemUser.id);
            receiverIds.push('b1cb10e6-002e-4377-850e-2c3bcbdfb648');
        }

        const { count: directUnread } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .in('receiver_id', receiverIds)
            .eq('read', false);

        res.json({ unreadCount: directUnread || 0 });
    } catch (error) {
        console.error('Unread count error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * PUT /api/messages/mark-read/:id
 * Mark messages as read for a specific conversation
 * Supports owner impersonation (System/Legacy accounts)
 * IMPORTANT: This route MUST be before /:id routes!
 */
router.put('/mark-read/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.body; // 'direct' or 'group'

        console.log(`📖 markAsRead API called: userId=${req.userId}, partnerId=${id}, type=${type}, role=${req.userRole}`);

        if (type === 'direct') {
            // For Owner: Also mark messages sent to System/Legacy as read
            if (req.userRole === 'owner') {
                // Get System User ID
                const { data: systemUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', 'system@iwaa.com')
                    .single();

                // Legacy Guest ID (hardcoded for now)
                const legacyId = 'b1cb10e6-002e-4377-850e-2c3bcbdfb648';

                const receiverIds = [req.userId];
                if (systemUser) receiverIds.push(systemUser.id);
                receiverIds.push(legacyId);

                // For Owner: Mark ALL unread messages SENT BY the partner as read
                // (Owner sees all conversations, so we mark all messages from this partner)
                // Filter by receiver to be safe (me, system, or legacy)
                const { data, error } = await supabase
                    .from('messages')
                    .update({ read: true })
                    .eq('sender_id', id)
                    .in('receiver_id', receiverIds) // Strict: only mark if received by one of my managed accounts
                    .eq('read', false)
                    .select('id');

                if (error) {
                    console.error('markAsRead owner error:', error);
                    return res.status(500).json({ error: 'فشل في تحديث حالة القراءة' });
                }

                console.log(`📖 markAsRead owner result: ${data?.length || 0} messages updated`);
                res.json({ success: true, updated: data?.length || 0 });
            } else {
                // Normal user: Only mark messages sent by partner to me
                const { data, error } = await supabase
                    .from('messages')
                    .update({ read: true })
                    .eq('sender_id', id)
                    .eq('receiver_id', req.userId)
                    .eq('read', false)
                    .select('id');

                if (error) {
                    console.error('markAsRead user error:', error);
                    return res.status(500).json({ error: 'فشل في تحديث حالة القراءة' });
                }

                console.log(`📖 markAsRead user result: ${data?.length || 0} messages updated`);
                res.json({ success: true, updated: data?.length || 0 });
            }
        } else {
            // Group/Course messages
            // First, check if 'id' is a group_id or course_id
            // If it's a group_id, resolve to course_id

            let targetCourseId = id;

            // Check if this is a course
            const { data: course } = await supabase
                .from('courses')
                .select('id')
                .eq('id', id)
                .single();

            if (!course) {
                // Not a course, might be a group_id
                const { data: group } = await supabase
                    .from('course_groups')
                    .select('course_id')
                    .eq('id', id)
                    .single();

                if (group) {
                    targetCourseId = group.course_id;
                    console.log(`📖 markAsRead: Resolved group_id ${id} to course_id ${targetCourseId}`);
                }
            }

            // Mark all unread messages in this course as read (excluding my own)
            const excludeSenderIds = [req.userId];

            if (req.userRole === 'owner') {
                // Also exclude System and Legacy from count (they are "me")
                const { data: systemUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', 'system@iwaa.com')
                    .single();

                if (systemUser) excludeSenderIds.push(systemUser.id);
                excludeSenderIds.push('b1cb10e6-002e-4377-850e-2c3bcbdfb648');
            }

            const { data, error } = await supabase
                .from('messages')
                .update({ read: true })
                .eq('course_id', targetCourseId)
                .eq('read', false)
                .not('sender_id', 'in', `(${excludeSenderIds.join(',')})`)
                .select('id');

            if (error) {
                console.error('markAsRead group error:', error);
                return res.status(500).json({ error: 'فشل في تحديث حالة القراءة' });
            }

            console.log(`📖 markAsRead group result: ${data?.length || 0} messages updated (targetCourseId: ${targetCourseId})`);
            res.json({ success: true, updated: data?.length || 0 });
        }
    } catch (error) {
        console.error('markAsRead error:', error);
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

        // Check current user's role for hidden message filtering
        const { data: currentUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', req.userId)
            .single();
        const canSeeHidden = ['owner', 'specialist', 'admin'].includes(currentUser?.role);

        let query = supabase
            .from('messages')
            .select(`
                id, content, sender_id, receiver_id, course_id, created_at, read, type, metadata, reply_to_id, hidden,
                sender:users!messages_sender_id_fkey(id, nickname, avatar, role, email)
            `)
            .order('created_at', { ascending: true });

        // Filter hidden messages for regular users
        if (!canSeeHidden) {
            query = query.or('hidden.is.null,hidden.eq.false');
        }

        if (type === 'group') {
            // Check if ID is a Course ID or Group ID
            // 1. Check if course exists with this ID
            const { data: course } = await supabase
                .from('courses')
                .select('id')
                .eq('id', id)
                .single();

            let targetCourseId = id;
            let explicitGroupId = null;

            if (!course) {
                // Not a course ID, maybe a Group ID?
                const { data: group } = await supabase
                    .from('course_groups')
                    .select('course_id, id')
                    .eq('id', id)
                    .single();

                if (group) {
                    targetCourseId = group.course_id;
                    explicitGroupId = group.id;
                }
            }

            // Fetch course messages
            // Check if user is enrolled to filter by group
            const { data: enrollment } = await supabase
                .from('enrollments')
                .select('group_id')
                .eq('course_id', targetCourseId)
                .eq('user_id', req.userId)
                .single();

            if (enrollment) {
                if (enrollment.group_id) {
                    // If student in a group, show messages for that group OR global messages (null)
                    // If explicitGroupId is provided (e.g. browsing a specific group), ensure it matches enrollment?
                    // Ideally, user should only see THEIR group. 

                    query = query
                        .eq('course_id', targetCourseId)
                        .or(`group_id.eq.${enrollment.group_id},group_id.is.null`);
                } else {
                    // Student enrolled but NO group (pending assignment)
                    // Should see ONLY global messages (group_id is null)
                    query = query
                        .eq('course_id', targetCourseId)
                        .is('group_id', null);
                }
            } else {
                // Specialist or Owner (sees all) 
                // If explicitGroupId provided, filter by it? 
                // For now, show all for course (or we could implement specialist filtering later)
                query = query.eq('course_id', targetCourseId);

                if (explicitGroupId) {
                    // Optionally filter if specialist specifically selected a group
                    // But UI usually requests by Course ID for specialist
                }
            }
        } else {
            // Fetch direct messages
            let orQuery = `and(sender_id.eq.${req.userId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${req.userId})`;

            // SHARED INBOX LOGIC:
            // If Owner, also fetch messages between System and the Partner (id)
            if (currentUser?.role === 'owner') {
                // Get System User ID (Optimized: hardcoded or fetched. Let's fetch to be safe/clean)
                const { data: systemUser } = await supabase.from('users').select('id').eq('email', 'system@iwaa.com').single();
                if (systemUser) {
                    orQuery += `,and(sender_id.eq.${systemUser.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${systemUser.id})`;
                }
            }

            query = query.or(orQuery);

            // OWNER FIX: Explicitly include Legacy ID messages manually if not covered by orQuery logic or if logic is complex
            // Simpler approach: If Owner, just construct the full OR query with all IDs
            if (currentUser?.role === 'owner') {
                const legacyId = 'b1cb10e6-002e-4377-850e-2c3bcbdfb648';
                let ownerOrQuery = `and(sender_id.eq.${req.userId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${req.userId})`;

                // Add System
                const { data: systemUser } = await supabase.from('users').select('id').eq('email', 'system@iwaa.com').single();
                if (systemUser) {
                    ownerOrQuery += `,and(sender_id.eq.${systemUser.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${systemUser.id})`;
                }

                // Add Legacy
                ownerOrQuery += `,and(sender_id.eq.${legacyId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${legacyId})`;

                // Replace query with new comprehensive OR
                query = supabase
                    .from('messages')
                    .select(`
                        id, content, sender_id, receiver_id, course_id, created_at, read, type, metadata, reply_to_id, hidden,
                        sender:users!messages_sender_id_fkey(id, nickname, avatar, role, email)
                    `)
                    .order('created_at', { ascending: true })
                    .or(ownerOrQuery);
            }
        }

        const { data: messages, error } = await query;

        if (error) {
            console.error('Messages fetch error:', error);
            return res.status(500).json({ error: 'فشل في جلب الرسائل' });
        }

        // Mark messages as read (if direct)
        if (type !== 'group') {
            let receiverIds = [req.userId];
            if (currentUser?.role === 'owner') {
                const { data: systemUser } = await supabase.from('users').select('id').eq('email', 'system@iwaa.com').single();
                if (systemUser) receiverIds.push(systemUser.id);
                receiverIds.push('b1cb10e6-002e-4377-850e-2c3bcbdfb648');
            }

            await supabase
                .from('messages')
                .update({ read: true })
                .eq('sender_id', id)
                .in('receiver_id', receiverIds);
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

            let senderName = m.sender?.nickname;
            let senderAvatar = m.sender?.avatar;

            // BRANDING: If sender is Owner, mask as Support
            if (m.sender?.role === 'owner') {
                senderName = 'دعم إيواء';
                senderAvatar = '/logo.png';
            }

            return {
                id: m.id,
                content: m.content,
                senderId: m.sender_id,
                senderName: senderName,
                senderAvatar: senderAvatar,
                createdAt: m.created_at,
                read: m.read,
                type: m.type,
                metadata: m.metadata || {},
                replyTo,
                hidden: m.hidden,
                sender: m.sender || false
            };
        });

        res.json({ messages: formattedMessages });
    } catch (error) {
        console.error('Messages error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

// Helper to emit real-time message
const emitRealtimeMessage = (req, message) => {
    const io = req.app.get('io');
    if (!io) return;

    // Emit to Sender (for sync across devices)
    io.to(`user_${message.sender_id}`).emit('receive_message', message);

    // Emit to Receiver (Direct Message)
    if (message.receiver_id) {
        io.to(`user_${message.receiver_id}`).emit('receive_message', message);
        // Also emit to 'system' if message is to system (Shared Inbox case)
        // (Not needed if we impersonate system, as receiver is the user)
    }

    // Emit to Group/Course (Group Message)
    if (message.type === 'group') {
        // Emit to specific group room if exists, else course room
        const room = message.group_id ? `group_${message.group_id}` : `course_${message.course_id}`;
        io.to(room).emit('receive_message', message);

        // Also emit to course room generally (optional, for broad listeners)
        if (message.course_id && message.group_id) {
            io.to(`course_${message.course_id}`).emit('receive_message', message);
        }
    }
};

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

            // Determine group_id
            // 1. Check if user is student (enrolled)
            const { data: enrollment } = await supabase
                .from('enrollments')
                .select('group_id')
                .eq('course_id', id)
                .eq('user_id', req.userId)
                .single();

            if (enrollment && enrollment.group_id) {
                messageData.group_id = enrollment.group_id;
            } else {
                // User is Specialist/Owner (or not enrolled in group)
                // If replying, try to inherit group_id from original message
                if (replyToId) {
                    const { data: originalMsg } = await supabase
                        .from('messages')
                        .select('group_id')
                        .eq('id', replyToId)
                        .single();

                    if (originalMsg) {
                        messageData.group_id = originalMsg.group_id;
                    }
                }
                // If not replying, group_id remains null (Global/Broadcast)
            }
        } else {
            messageData.receiver_id = id;
            messageData.course_id = null; // Direct message

            // SHARED INBOX LOGIC:
            // If sender is Owner, and they are replying to a User who has a thread with System...
            // Check if this thread should be from System.
            // Simplified Rule: If Owner sends to a Regular User, it goes as "System" (Shared Inbox).
            // Unless it's an internal owner-owner chat.

            // Note: We need to know receiver role.
            if (req.userRole === 'owner') {
                // Check receiver role
                const { data: receiverUser } = await supabase.from('users').select('role').eq('id', id).single();
                if (receiverUser && receiverUser.role === 'user') {
                    // Get System User ID
                    const { data: systemUser } = await supabase.from('users').select('id').eq('email', 'system@iwaa.com').single();
                    if (systemUser) {
                        messageData.sender_id = systemUser.id; // Impersonate System
                    }
                }
            }
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

        // Emit Real-time event
        emitRealtimeMessage(req, {
            ...message,
            sender: message.sender, // Ensure sender info is passed
            replyTo // Include reply info
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

        // Optimize with Sharp
        // Resize to max 1280px width, convert to WebP, quality 80
        const optimizedBuffer = await sharp(file.buffer)
            .resize(1280, 1280, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

        // Filename: timestamp_random.webp
        const filename = `${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('chat-images')
            .upload(filename, optimizedBuffer, {
                contentType: 'image/webp',
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
                fileName: file.originalname, // Keep original name for reference
                size: optimizedBuffer.length, // use optimized size
                mimetype: 'image/webp' // use optimized type
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

        // Emit Real-time event
        emitRealtimeMessage(req, {
            ...message,
            sender: message.sender // Ensure sender info is passed
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

/**
 * DELETE /api/messages/conversations/:id
 * Delete a conversation (Direct only for now)
 */
router.delete('/conversations/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { type } = req.query; // 'direct' or 'group'

        if (type === 'group') {
            // For groups, usually "Leave Group" or "Clear Chat"
            // For now, let's just allow clearing if implemented, currently restricted
            return res.status(400).json({ error: 'لا يمكن حذف مجموعات الكورس من هنا' });
        }

        // Delete all messages between these two users
        // (sender is ME and receiver is THEM) OR (sender is THEM and receiver is ME)
        const { error } = await supabase
            .from('messages')
            .delete()
            .or(`and(sender_id.eq.${req.userId},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${req.userId})`);

        if (error) {
            console.error('Delete conversation error:', error);
            return res.status(500).json({ error: 'فشل في حذف المحادثة' });
        }

        res.json({ message: 'تم حذف المحادثة بنجاح' });
    } catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

/**
 * PUT /api/messages/:id/hide
 * Hide a message (soft delete) - only for owners and specialists
 * Message will be hidden from regular users but still visible to admins
 */
router.put('/:id/hide', authMiddleware, async (req, res) => {
    try {
        // 1. Check if user is owner or specialist
        const { data: currentUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', req.userId)
            .single();

        if (!currentUser || !['owner', 'specialist'].includes(currentUser.role)) {
            return res.status(403).json({ error: 'غير مصرح لك بهذا الإجراء' });
        }

        const { id } = req.params;
        const { hidden = true } = req.body; // Default to hiding

        // 2. Update message hidden status
        const { error } = await supabase
            .from('messages')
            .update({ hidden })
            .eq('id', id);

        if (error) {
            console.error('Hide message error:', error);
            return res.status(500).json({ error: 'فشل في إخفاء الرسالة' });
        }

        res.json({ message: hidden ? 'تم إخفاء الرسالة' : 'تم إظهار الرسالة' });
    } catch (error) {
        console.error('Hide message error:', error);
        res.status(500).json({ error: 'حدث خطأ' });
    }
});

module.exports = router;
