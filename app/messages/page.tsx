"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Send, Loader2, User, Users, Calendar, Clock, ArrowRight, Phone, Video, MoreVertical, Check, CheckCheck, Smile, X, Reply, Image as ImageIcon, Plus, Search, Trash2, Link as LinkIcon } from "lucide-react";
import Header from "@/components/layout/Header";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { useNSFW } from "@/hooks/useNSFW";
import { containsProfanity } from "@/lib/profanity";
import { supabase } from "@/lib/supabaseClient";

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface User {
    id: string;
    nickname: string;
    avatar?: string;
    isCourse?: boolean;
    role?: string;
    email?: string;
}

interface Conversation {
    id: string;
    type: 'direct' | 'group';
    user: User;
    lastMessage?: string;
    lastMessageAt?: string;
    unreadCount: number;
    group_id?: string;
    course_id?: string;
}

interface Message {
    id: string;
    content: string;
    senderId?: string;
    sender_id?: string;
    sender?: {
        id: string;
        nickname: string;
        avatar?: string;
        role?: string;
        email?: string;
    };
    senderName?: string;
    senderAvatar?: string;
    type: 'text' | 'schedule' | 'alert' | 'image' | 'sticker';
    metadata?: any;
    createdAt: string;
    read: boolean;
    hidden?: boolean;
    replyTo?: {
        id: string;
        content: string;
        senderName?: string;
    } | null;
}

// Cached System ID
let CACHED_SYSTEM_ID: string | null = null;

export default function MessagesPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false);
    const [replyingTo, setReplyingTo] = useState<Message | null>(null);
    const [messagesReady, setMessagesReady] = useState(false);
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const { checkImage, loading: nsfwLoading } = useNSFW();
    const [showChatOptions, setShowChatOptions] = useState(false);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [searching, setSearching] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);


    // Initial Load - Get Current User
    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');
            if (!token || !userStr) {
                router.push('/login');
                return;
            }
            setCurrentUser(JSON.parse(userStr));

            // Prefetch System ID
            if (!CACHED_SYSTEM_ID) {
                const { data } = await supabase.from('users').select('id').eq('email', 'system@iwaa.com').single();
                if (data) CACHED_SYSTEM_ID = data.id;
            }
        };
        checkUser();
    }, [router]);

    // Initial Load - Fetch Conversations
    useEffect(() => {
        if (currentUser) {
            fetchConversations();
        }
    }, [currentUser]);

    // Realtime Subscription (Supabase)
    useEffect(() => {
        if (!currentUser) return;

        console.log('🔌 Setting up Realtime subscription for user:', currentUser.id);

        const channel = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    console.log('📨 Realtime message received:', payload);
                    const newMessage = payload.new as any;

                    // System/Legacy Check Helpers
                    const isSystem = (id: string, email?: string) => email === 'system@iwaa.com'; // We rely on email check or fetch
                    const legacyId = '87de5cca-9c37-465b-844f-4ef80ba95c7d';

                    // Debugging: Log IDs to see why mismatch happens
                    console.log(`🔍 Checking Relevance: Me=${currentUser.id}, Receiver=${newMessage.receiver_id}, Sender=${newMessage.sender_id}`);

                    // Use !! to ensure boolean, not null
                    let isRelevantToMe: boolean =
                        newMessage.receiver_id === currentUser.id ||
                        newMessage.sender_id === currentUser.id ||
                        !!newMessage.course_id ||
                        !!newMessage.group_id;

                    if (currentUser.role === 'owner') {
                        // Special Logic for Owners (Shared Inbox / Impersonation)
                        const involvesLegacy =
                            newMessage.receiver_id === legacyId ||
                            newMessage.sender_id === legacyId;

                        if (involvesLegacy) {
                            console.log('👑 Owner Realtime: Message involves System/Legacy ID -> RELEVANT');
                            isRelevantToMe = true;
                        }

                        // CRITICAL FIX: If owner is viewing a specific conversation, 
                        // and the message is to/from that user, it's relevant!
                        // This handles "replying as owner" scenario where sender_id != owner.id
                        // We check selectedConversation later, but for now, mark as possibly relevant
                        // to avoid early return.
                        // Actually, let's just let ALL messages through for owners and filter later.
                        // This is safe because owners have admin privileges.
                        isRelevantToMe = true; // Owners see all for now, filter at selectedConversation level
                    }

                    console.log('📨 isRelevantToMe Result:', isRelevantToMe);

                    if (!isRelevantToMe) return;

                    if (selectedConversation) {
                        // Debug: Log the selectedConversation user ID for comparison
                        console.log('📨 Selected Conversation User ID:', selectedConversation.user?.id, 'Type:', selectedConversation.type);

                        let isRelevantToSelected = false;

                        if (selectedConversation.type === 'direct') {
                            const targetUserId = selectedConversation.user?.id;

                            // Standard Check: Message between currentUser and target
                            const isStandardMatch =
                                (newMessage.sender_id === targetUserId && newMessage.receiver_id === currentUser.id) ||
                                (newMessage.sender_id === currentUser.id && newMessage.receiver_id === targetUserId);

                            // Owner Check: Message involves target user AND (legacy OR owner) on the other side
                            const isOwnerMatch = currentUser.role === 'owner' && (
                                // Legacy <-> Target
                                (newMessage.sender_id === targetUserId && newMessage.receiver_id === legacyId) ||
                                (newMessage.sender_id === legacyId && newMessage.receiver_id === targetUserId) ||
                                // Owner ID <-> Target (if owner sends as themselves, not legacy)
                                (newMessage.sender_id === targetUserId && newMessage.receiver_id === currentUser.id) ||
                                (newMessage.sender_id === currentUser.id && newMessage.receiver_id === targetUserId) ||
                                // Any message involving target user (owner can see all interactions with selected user)
                                newMessage.sender_id === targetUserId || newMessage.receiver_id === targetUserId
                            );

                            isRelevantToSelected = isStandardMatch || isOwnerMatch;
                        } else if (selectedConversation.type === 'group') {
                            isRelevantToSelected =
                                newMessage.group_id === selectedConversation.id ||
                                (newMessage.course_id === selectedConversation.id && !newMessage.group_id);
                        }

                        console.log('📨 isRelevantToSelected:', isRelevantToSelected, 'selectedConv:', selectedConversation.id);

                        if (isRelevantToSelected) {
                            setMessages(prev => {
                                if (prev.some(m => m.id === newMessage.id)) return prev;

                                let sender = newMessage.sender; // Usually null in payload
                                if (!sender && newMessage.sender_id === selectedConversation.user.id) {
                                    sender = selectedConversation.user;
                                }

                                // If sender is current user, use currentUser info
                                if (!sender && newMessage.sender_id === currentUser.id) {
                                    sender = { id: currentUser.id, nickname: currentUser.nickname, avatar: currentUser.avatar };
                                }

                                const msgObj: Message = {
                                    id: newMessage.id,
                                    content: newMessage.content,
                                    sender_id: newMessage.sender_id,
                                    sender: sender,
                                    type: newMessage.type,
                                    metadata: newMessage.metadata,
                                    createdAt: newMessage.created_at,
                                    read: newMessage.read,
                                    senderName: sender?.nickname,
                                    senderAvatar: sender?.avatar
                                };

                                console.log('📨 Adding message to state:', msgObj.id);
                                return [...prev, msgObj];
                            });
                        }
                    }

                    // Refresh conversations list
                    fetchConversationsQuiet();
                }
            )
            // Listen for UPDATE events (read status changes)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    const updatedMessage = payload.new as any;

                    // Update read status for messages in current view
                    setMessages(prev => prev.map(msg =>
                        msg.id === updatedMessage.id
                            ? { ...msg, read: updatedMessage.read }
                            : msg
                    ));
                }
            )
            .subscribe((status) => {
                console.log('🔌 Realtime subscription status:', status);
            });

        return () => {
            console.log('🔌 Removing Realtime channel');
            supabase.removeChannel(channel);
        };
    }, [currentUser, selectedConversation]);


    // Group Members Modal
    const [showGroupMembers, setShowGroupMembers] = useState(false);
    const [groupMembers, setGroupMembers] = useState<{ id: string, nickname: string, avatar?: string }[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const previousMessagesCount = useRef(0);
    const hadUnreadOnOpen = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const customStickerInputRef = useRef<HTMLInputElement>(null);

    const STICKERS = [
        "/stickers/sticker_heart_1767573383386.png",
        "/stickers/sticker_thumbsup_1767573396624.png",
        "/stickers/sticker_laughing_1767573408722.png",
        "/stickers/sticker_fire_1767573421106.png",
        "/stickers/sticker_star_1767573432800.png",
        "/stickers/sticker_flower_1767573445383.png"
    ];


    // Auto Scroll
    useLayoutEffect(() => {
        if (!messagesContainerRef.current || messages.length === 0) return;

        const container = messagesContainerRef.current;
        const isNewMessage = messages.length > previousMessagesCount.current;
        const isFromMe = messages[messages.length - 1]?.sender_id === currentUser?.id;

        if (isNewMessage) {
            container.scrollTop = container.scrollHeight;
            setMessagesReady(true);
        }
        previousMessagesCount.current = messages.length;
    }, [messages, showMobileChat]);


    // Fetch Conversations Logic
    const fetchConversationsQuiet = async () => {
        if (!currentUser) return;
        try {
            let myCourseIds: string[] = [];
            let courseMap = new Map<string, any>();

            // Fetch System User ID for shared inbox (if owner)
            let systemUserId: string | null = CACHED_SYSTEM_ID;
            if (currentUser.role === 'owner' && !systemUserId) {
                const { data: systemUser } = await supabase
                    .from('users')
                    .select('id')
                    .eq('email', 'system@iwaa.com')
                    .single();
                systemUserId = systemUser?.id || null;
                if (systemUserId) CACHED_SYSTEM_ID = systemUserId;
            }

            if (currentUser.role === 'owner') {
                const { data: courses } = await supabase.from('courses').select('id, title');
                if (courses) {
                    courses.forEach(c => {
                        myCourseIds.push(c.id);
                        courseMap.set(c.id, { id: c.id, name: c.title, isCourse: true });
                    });
                }
            } else {
                const { data: enrolls } = await supabase
                    .from('enrollments')
                    .select('group_id, course_id, course:courses(title), group:course_groups(name)')
                    .eq('user_id', currentUser.id);

                if (enrolls) {
                    enrolls.forEach((e: any) => {
                        const targetId = e.group_id || e.course_id;
                        const name = e.course?.title || e.group?.name;

                        if (targetId) {
                            myCourseIds.push(targetId);
                            courseMap.set(targetId, { id: targetId, name: name || 'Group Chat', isCourse: true });
                        }
                    });
                }
                const { data: teaching } = await supabase
                    .from('courses')
                    .select('id, title, groups:course_groups(id, name)')
                    .eq('specialist_id', currentUser.id);
                if (teaching) {
                    teaching.forEach((c: any) => {
                        myCourseIds.push(c.id);
                        courseMap.set(c.id, { id: c.id, name: c.title, isCourse: true });

                        // Also add all groups for this course
                        if (c.groups) {
                            c.groups.forEach((g: any) => {
                                myCourseIds.push(g.id);
                                courseMap.set(g.id, { id: g.id, name: g.name || `${c.title} - Group`, isCourse: false });
                            });
                        }
                    });
                }
            }

            let query = supabase
                .from('messages')
                .select(`
                    id, content, created_at, read, type, sender_id, receiver_id, course_id, group_id,
                    sender:sender_id (id, nickname, avatar, role, email),
                    receiver:receiver_id (id, nickname, avatar, role, email)
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            const { data: rawMessages } = await query;
            const fetchedMessages = rawMessages || [];

            const convMap = new Map<string, Conversation>();

            fetchedMessages.forEach((msg: any) => {
                let convId = '';
                let type: 'direct' | 'group' = 'direct';
                let otherUser: User | undefined;

                // Helpers
                const legacyId = 'b1cb10e6-002e-4377-850e-2c3bcbdfb648';
                const isSystem = (u: any) => u?.email === 'system@iwaa.com';
                const isLegacy = (id: string) => id === legacyId;

                if (msg.course_id || msg.group_id) {
                    type = 'group';
                    const cId = msg.group_id || msg.course_id;
                    if (!myCourseIds.includes(cId) && currentUser.role !== 'owner') return;

                    convId = cId;
                    const info = courseMap.get(convId) || { name: 'Conversation', id: convId };
                    otherUser = {
                        id: convId,
                        nickname: info.name || (msg.course_id ? 'Course Chat' : 'Group Chat'),
                        avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(info.name || 'G') + '&background=random',
                        isCourse: true
                    };
                } else {
                    type = 'direct';

                    const ownerManagedIds = [currentUser.id, legacyId];
                    if (systemUserId) ownerManagedIds.push(systemUserId);

                    // For owner: check if this is a message involving system/legacy (shared inbox)
                    let partnerId: string;
                    let partner: any;

                    if (currentUser.role === 'owner') {
                        // Robust owner partner logic
                        // If I am sender OR System is sender OR Legacy is sender -> Partner is Receiver
                        const senderIsMe = msg.sender_id === currentUser.id;
                        const senderIsSystem = isSystem(msg.sender);
                        const senderIsLegacy = isLegacy(msg.sender_id);

                        const receiverIsMe = msg.receiver_id === currentUser.id;
                        const receiverIsSystem = isSystem(msg.receiver);
                        const receiverIsLegacy = isLegacy(msg.receiver_id);

                        if (senderIsMe || senderIsSystem || senderIsLegacy) {
                            partnerId = msg.receiver_id;
                            partner = msg.receiver;
                        } else if (receiverIsMe || receiverIsSystem || receiverIsLegacy) {
                            partnerId = msg.sender_id;
                            partner = msg.sender;
                        } else {
                            // Fallback
                            partnerId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
                            partner = msg.sender_id === currentUser.id ? msg.receiver : msg.sender;
                        }
                    } else {
                        // Non-owner: standard logic
                        if (msg.sender_id !== currentUser.id && msg.receiver_id !== currentUser.id) return;
                        partnerId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
                        partner = msg.sender_id === currentUser.id ? msg.receiver : msg.sender;
                    }

                    if (!partner) return;

                    convId = partnerId;
                    otherUser = {
                        id: partner.id,
                        nickname: partner.nickname,
                        avatar: partner.avatar,
                        role: partner.role,
                        email: partner.email
                    };

                    // Only mask owner name for non-owners
                    if (partner.role === 'owner' && currentUser.role !== 'owner') {
                        otherUser.nickname = 'دعم إيواء';
                        otherUser.avatar = '/logo.png';
                    }
                }

                if (!otherUser) return;

                if (!convMap.has(convId)) {
                    convMap.set(convId, {
                        id: convId,
                        type,
                        user: otherUser,
                        lastMessage: msg.type === 'image' ? '📷 صورة' : msg.content,
                        lastMessageAt: msg.created_at,
                        unreadCount: 0,
                        group_id: msg.group_id,
                        course_id: msg.course_id
                    });
                }
                // Unread Count Logic: Messages received (not sent by me/system/legacy) that are unread
                let isSentByMe = msg.sender_id === currentUser.id;
                if (currentUser.role === 'owner') {
                    // Check if sender is System or Legacy (managed by me)
                    const senderIsSystem = msg.sender?.email === 'system@iwaa.com';
                    const senderIsLegacy = msg.sender_id === legacyId;

                    isSentByMe = isSentByMe || senderIsSystem || senderIsLegacy;
                }

                if (!isSentByMe && !msg.read) {
                    const c = convMap.get(convId)!;
                    c.unreadCount++;
                }
            });

            // Add Empty Courses
            courseMap.forEach((info, id) => {
                if (!convMap.has(id)) {
                    convMap.set(id, {
                        id: id,
                        type: 'group',
                        user: {
                            id: id,
                            nickname: info.name,
                            avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(info.name) + '&background=random',
                            isCourse: true
                        },
                        lastMessage: 'ابدأ المحادثة',
                        lastMessageAt: new Date().toISOString(),
                        unreadCount: 0,
                        course_id: id, // Assumption: using ID as course_id for map
                        group_id: undefined
                    });
                }
            });

            const newConvs = Array.from(convMap.values());

            setConversations(prev => {
                return newConvs.map(c => {
                    if (selectedConversation && c.id === selectedConversation.id) {
                        return { ...c, unreadCount: 0 };
                    }
                    return c;
                });
            });

        } catch (err) {
            console.error('Fetch conversations error:', err);
        }
    };

    const fetchConversations = async () => {
        try {
            await fetchConversationsQuiet();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (id: string, type: 'direct' | 'group') => {
        if (!currentUser) return;
        try {
            let query = supabase
                .from('messages')
                .select(`
                    id, content, created_at, read, type, sender_id, receiver_id, course_id, group_id, metadata, replyTo:reply_to_id(id, content, sender:sender_id(nickname)),
                    sender:sender_id (id, nickname, avatar, role)
                `)
                .order('created_at', { ascending: true });

            if (type === 'direct') {
                if (currentUser.role === 'owner') {
                    // Clean Owner Logic: Fetch all messages involving ME, SYSTEM, or LEGACY <-> TARGET USER

                    // IDs helper
                    const legacyId = '87de5cca-9c37-465b-844f-4ef80ba95c7d'; // 'إدارة منصة إيواء' (system@iwaa.com)
                    const realSystemId = '87de5cca-9c37-465b-844f-4ef80ba95c7d'; // Same as legacy for now

                    const targetId = id;
                    const myId = currentUser.id;

                    const conditions = [
                        `and(sender_id.eq.${targetId},receiver_id.eq.${myId})`,
                        `and(sender_id.eq.${myId},receiver_id.eq.${targetId})`,
                        // Also include messages involving the System ID 
                        `and(sender_id.eq.${targetId},receiver_id.eq.${legacyId})`,
                        `and(sender_id.eq.${legacyId},receiver_id.eq.${targetId})`
                    ];

                    query = query.or(conditions.join(','));
                } else {
                    // Normal logic
                    query = query
                        .or(`sender_id.eq.${currentUser.id},sender_id.eq.${id}`)
                        .or(`receiver_id.eq.${currentUser.id},receiver_id.eq.${id}`);
                }
            } else {
                query = query.or(`group_id.eq.${id},course_id.eq.${id}`);
            }

            const { data, error } = await query;
            if (error) throw error;

            const mappedMessages: Message[] = (data || []).map((m: any) => ({
                id: m.id,
                content: m.content,
                sender_id: m.sender_id,
                sender: m.sender,
                senderName: m.sender?.nickname,
                senderAvatar: m.sender?.avatar,
                type: m.type,
                metadata: m.metadata,
                createdAt: m.created_at,
                read: m.read,
                replyTo: m.replyTo ? {
                    id: m.replyTo.id,
                    content: m.replyTo.content,
                    senderName: m.replyTo.sender?.nickname
                } : null
            }));

            setMessages(mappedMessages);

        } catch (err) {
            console.error('Failed to fetch messages:', err);
        }
    };

    const handleSelectConversation = (conv: Conversation) => {
        hadUnreadOnOpen.current = conv.unreadCount > 0;
        previousMessagesCount.current = 0;
        setMessagesReady(false);

        const currentTotalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        const newTotalUnread = Math.max(0, currentTotalUnread - (conv.unreadCount || 0));
        window.dispatchEvent(new CustomEvent('unreadCountUpdated', { detail: { count: newTotalUnread } }));

        setConversations(prev => prev.map(c =>
            c.id === conv.id ? { ...c, unreadCount: 0 } : c
        ));
        setSelectedConversation({ ...conv, unreadCount: 0 });
        fetchMessages(conv.id, conv.type);
        setShowMobileChat(true);
        window.dispatchEvent(new Event('chatOpened'));

        // Mark as Read in Backend (uses Service Role Key for proper permissions)
        const markAsRead = async () => {
            if (!currentUser) return;

            console.log('📖 markAsRead called:', { convType: conv.type, convId: conv.id });

            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/messages/mark-read/${conv.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ type: conv.type })
                });

                const data = await response.json();
                console.log('📖 markAsRead result:', data);
            } catch (error) {
                console.error('markAsRead error:', error);
            }
        };
        markAsRead();
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (containsProfanity(newMessage)) {
            toast.error('عفواً، لا يمكن إرسال هذه الرسالة لاحتوائها على كلمات غير لائقة.');
            return;
        }
        if (!newMessage.trim() || !selectedConversation || sending) return;

        setSending(true);
        try {
            // Use backend API for sending messages (handles RLS/FK properly)
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/messages/${selectedConversation.user.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: newMessage,
                    type: selectedConversation.type,
                    replyToId: replyingTo?.id || null
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'فشل الإرسال');
            }

            // Optimistic Update
            const newMsgObj: Message = {
                id: 'optimistic_' + Date.now(),
                content: newMessage,
                sender_id: currentUser.id, // Ensure sender is me
                receiver_id: selectedConversation.user.id,
                created_at: new Date().toISOString(),
                read: false,
                type: 'text',
                sender: currentUser,
                replyTo: replyingTo ? {
                    id: replyingTo.id,
                    content: replyingTo.content,
                    senderName: replyingTo.senderName || replyingTo.sender?.nickname || 'مستخدم'
                } : undefined
            };
            setMessages(prev => [newMsgObj, ...prev]);

            setNewMessage("");
            setReplyingTo(null);
            setShowStickerPicker(false);
            // new message will arrive via Realtime
        } catch (err: any) {
            console.error('Failed to send message:', err);
            toast.error(err.message || 'فشل الإرسال');
        } finally {
            setSending(false);
        }
    };

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('حجم الصورة كبير جداً (الحد الأقصى 5MB)');
                return;
            }
            const toastId = toast.loading('جاري فحص الصورة...');
            const { isSafe, reason } = await checkImage(file);
            toast.dismiss(toastId);

            if (!isSafe) {
                toast.error(reason || 'عذراً، هذه الصورة تحتوي على محتوى غير لائق وتم حظرها.');
                e.target.value = '';
                return;
            }
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const cancelImageSelection = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // User Stickers State
    interface UserSticker {
        id: string;
        url: string;
    }
    const [userStickers, setUserStickers] = useState<UserSticker[]>([]);

    const fetchUserStickers = async () => {
        // Try getting user from session first, then localStorage
        const { data: { session } } = await supabase.auth.getSession();
        let userId = session?.user?.id;

        if (!userId) {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    userId = user.id;
                }
            } catch (e) {
                console.error('Error parsing user from local storage:', e);
            }
        }

        if (!userId) return;

        const { data, error } = await supabase
            .from('user_stickers')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching stickers:', error);
        } else {
            setUserStickers(data || []);
        }
    };

    useEffect(() => {
        fetchUserStickers();
    }, []);

    const handleDeleteSticker = async (stickerId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('هل أنت متأكد من حذف هذا الاستيكر؟')) return;

        const { error } = await supabase
            .from('user_stickers')
            .delete()
            .eq('id', stickerId);

        if (error) {
            toast.error('فشل حذف الاستيكر');
        } else {
            toast.success('تم حذف الاستيكر');
            setUserStickers(prev => prev.filter(s => s.id !== stickerId));
        }
    };

    // ... existing code ...

    const handleCustomStickerSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedConversation) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('حجم الاستيكر يجب أن لا يتعدى 2MB');
            return;
        }

        const toastId = toast.loading('جاري إرسال الاستيكر...');
        try {
            // Debug: Check session
            const { data: { session } } = await supabase.auth.getSession();
            console.log('🔍 Upload Session Check:', session?.user?.id ? 'Authenticated' : 'No Session', session?.user?.id);

            // Upload sticker image
            const fileName = `custom_sticker_${Date.now()}_${file.name.replace(/\s+/g, '-')}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('chat-images')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(fileName);

            // Save to user_stickers table
            // Get User ID from session or localStorage
            let userId = session?.user?.id;
            if (!userId) {
                try {
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        userId = user.id;
                    }
                } catch (e) { console.error(e); }
            }

            if (userId) {
                const { data: savedSticker, error: dbError } = await supabase
                    .from('user_stickers')
                    .insert({ user_id: userId, url: publicUrl })
                    .select()
                    .single();

                if (dbError) {
                    console.error('Failed to save sticker to DB:', dbError);
                } else if (savedSticker) {
                    setUserStickers(prev => [savedSticker, ...prev]);
                }
            } else {
                console.warn('⚠️ No User ID found to save sticker');
            }

            // Send as message with metadata
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/messages/${selectedConversation.user.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: publicUrl,
                    type: selectedConversation.type,
                    replyToId: replyingTo?.id || null,
                    metadata: { isSticker: true } // Mark as sticker
                })
            });

            if (!response.ok) throw new Error('فشل إرسال الاستيكر');

            toast.success('تم إرسال الاستيكر!', { id: toastId });
            setShowStickerPicker(false);
        } catch (error: any) {
            console.error('Sticker upload error:', error);
            toast.error(error.message || 'فشل إرسال الاستيكر', { id: toastId });
        } finally {
            if (customStickerInputRef.current) customStickerInputRef.current.value = '';
        }
    };

    // ... existing code ...

    {/* Stickers Grid */ }
    <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-60 p-1">
        {/* Custom Upload Button */}
        <button
            onClick={() => customStickerInputRef.current?.click()}
            className="aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors gap-1 group"
        >
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
            </div>
            <span className="text-[10px] font-medium text-gray-500 group-hover:text-blue-600">جديد</span>
        </button>

        {/* User Saved Stickers */}
        {userStickers.map((sticker) => (
            <div key={sticker.id} className="relative group aspect-square">
                <button
                    onClick={() => handleSendSticker(sticker.url)}
                    className="w-full h-full p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                    <img
                        src={sticker.url}
                        alt="Sticker"
                        className="w-full h-full object-contain drop-shadow-sm hover:scale-110 transition-transform duration-200"
                        loading="lazy"
                    />
                </button>
                {/* Delete Button */}
                <button
                    onClick={(e) => handleDeleteSticker(sticker.id, e)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110"
                    title="حذف"
                >
                    <X className="w-3 h-3" />
                </button>
            </div>
        ))}

        {/* Default Stickers */}
        {STICKERS.map((sticker, index) => (
            <button
                key={index}
                onClick={() => handleSendSticker(sticker)}
                className="aspect-square p-2 hover:bg-gray-100 rounded-xl transition-colors group"
            >
                <img
                    src={sticker}
                    alt={`Sticker ${index + 1}`}
                    className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-200"
                    loading="lazy"
                />
            </button>
        ))}
    </div>

    const handleSendImage = async () => {
        if (!selectedImage || !selectedConversation || uploadingImage) return;

        setUploadingImage(true);
        try {
            const fileName = `${Date.now()}_${selectedImage.name.replace(/\s+/g, '-')}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('chat-images')
                .upload(fileName, selectedImage);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(fileName);

            // Use backend API for sending image message (handles RLS/FK properly)
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/messages/${selectedConversation.user.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: publicUrl,
                    type: selectedConversation.type,
                    msgType: 'image'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'فشل إرسال الصورة');
            }

            cancelImageSelection();
            toast.success('تم إرسال الصورة');
        } catch (err: any) {
            console.error('Failed to send image:', err);
            toast.error(err.message || 'فشل إرسال الصورة');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleSendSticker = async (stickerUrl: string) => {
        if (!selectedConversation || uploadingImage) return;
        setUploadingImage(true);
        setShowStickerPicker(false);
        try {
            // Use backend API for sending stickers (handles RLS/FK properly)
            const token = localStorage.getItem('token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/messages/${selectedConversation.user.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: stickerUrl,
                    type: selectedConversation.type,
                    msgType: 'sticker',
                    replyToId: replyingTo?.id || null,
                    metadata: { isSticker: true } // Mark as sticker for frontend rendering
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'فشل إرسال الملصق');
            }
            toast.success('تم إرسال الملصق');
        } catch (err: any) {
            toast.error(err.message || 'فشل إرسال الملصق');
        } finally {
            setUploadingImage(false);
        }
    };



    const handleContactSupport = async () => {
        try {
            // Find admin/support user (Role owner or email system)
            // Simplified: just search by email
            const { data: supportUser } = await supabase.from('users').select('*').eq('email', 'system@iwaa.com').single();
            if (!supportUser) {
                toast.error('خدمة الدعم غير متاحة حالياً');
                return;
            }

            const existingComp = conversations.find(c => c.user.id === supportUser.id);
            if (existingComp) {
                handleSelectConversation(existingComp);
            } else {
                const newConv: Conversation = {
                    id: supportUser.id,
                    type: 'direct',
                    user: supportUser,
                    unreadCount: 0,
                    lastMessage: 'بدء محادثة الدعم'
                };
                setConversations([newConv, ...conversations]);
                handleSelectConversation(newConv);
            }
        } catch (err) {
            toast.error('حدث خطأ');
        }
    };

    const handleDeleteConversation = async () => {
        if (!selectedConversation) return;
        if (!confirm('هل أنت متأكد من حذف هذه المحادثة؟ سيتم حذف جميع الرسائل من الطرفين.')) return;
        try {
            if (selectedConversation.type === 'direct') {
                // Delete where sender=me & receiver=them OR sender=them & receiver=me
                await supabase.from('messages').delete().or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedConversation.id}),and(sender_id.eq.${selectedConversation.id},receiver_id.eq.${currentUser.id})`);
            } else {
                // Group/Course - Only owner can delete?
                if (currentUser.role !== 'owner') {
                    toast.error('لا تملك صلاحية حذف محادثة المجموعة');
                    return;
                }
                await supabase.from('messages').delete().or(`group_id.eq.${selectedConversation.id},course_id.eq.${selectedConversation.id}`);
            }
            toast.success('تم حذف المحادثة');
            setConversations(conversations.filter(c => c.id !== selectedConversation.id));
            setSelectedConversation(null);
            setShowMobileChat(false);
            setShowChatOptions(false);
        } catch (err) {
            toast.error('حدث خطأ');
        }
    };

    const handleHideMessage = async (messageId: string) => {
        if (!confirm('هل أنت متأكد من إخفاء هذه الرسالة؟ لن تظهر للمستخدمين الآخرين.')) return;
        try {
            const { error } = await supabase.from('messages').update({ hidden: true }).eq('id', messageId);
            if (error) throw error;
            toast.success('تم إخفاء الرسالة');
            setMessages(messages.map(m => m.id === messageId ? { ...m, hidden: true } : m));
        } catch (err) {
            toast.error('حدث خطأ');
        }
    };
    const handleSearchUsers = async (query: string, pageNum: number = 1) => {
        setSearchQuery(query);
        if (pageNum === 1) {
            setPage(1);
            setHasMore(true);
            setSearchResults([]);
        }
        setSearching(true);
        try {
            let q = supabase.from('users').select('*', { count: 'exact' });
            if (query) {
                q = q.ilike('nickname', `%${query}%`);
            }
            const pageSize = 20;
            const from = (pageNum - 1) * pageSize;
            const to = from + pageSize - 1;

            const { data, count } = await q.range(from, to);

            const newUsers = data || [];
            if (pageNum === 1) {
                setSearchResults(newUsers);
            } else {
                setSearchResults(prev => [...prev, ...newUsers]);
            }

            if (count !== null) {
                setHasMore(to < count);
            } else {
                setHasMore(newUsers.length > 0);
            }
            setPage(pageNum);

        } catch (error) {
            console.error(error);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        if (showUserSearch) {
            handleSearchUsers('', 1);
        }
    }, [showUserSearch]);

    const handleUserListScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50 && !searching && hasMore) {
            handleSearchUsers(searchQuery, page + 1);
        }
    };

    const startConversationWithUser = (user: User) => {
        const existing = conversations.find(c => c.user.id === user.id);
        if (existing) {
            handleSelectConversation(existing);
        } else {
            const newConv: Conversation = {
                id: user.id,
                type: 'direct',
                user: user,
                unreadCount: 0,
                lastMessage: ''
            };
            setConversations([newConv, ...conversations]);
            handleSelectConversation(newConv);
        }
        setShowUserSearch(false);
        setSearchQuery('');
        setSearchResults([]);
    };

    // Scroll to bottom when messages change
    useEffect(() => {
        // Use setTimeout to ensure DOM is ready and layout is calculated
        const timeoutId = setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
        }, 100);
        return () => clearTimeout(timeoutId);
    }, [messages, selectedConversation]);

    const directMessages = conversations.filter(c => c.type === 'direct');
    const groupMessages = conversations.filter(c => c.type === 'group');

    return (
        <div className="bg-gray-100 min-h-screen" dir="rtl" suppressHydrationWarning>
            <div className={`${showMobileChat ? 'hidden md:block' : ''}`}>
                <Header />
            </div>

            <main className={`${showMobileChat ? '' : 'pt-20'} md:pt-20`}>
                <div className="md:container md:mx-auto md:px-4 md:py-4 h-[100dvh] md:h-[calc(100vh-100px)]">
                    <div className="bg-white md:rounded-2xl h-full overflow-hidden flex md:shadow-xl md:border border-gray-200">

                        <div className={`w-full md:w-96 border-l border-gray-200 flex flex-col bg-white ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                            <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h1 className="text-2xl font-bold text-gray-900">الرسائل</h1>
                                    {(currentUser?.role === 'owner' || currentUser?.role === 'specialist') && (
                                        <button
                                            onClick={() => setShowUserSearch(true)}
                                            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white hover:bg-primary/90 transition-colors shadow-md"
                                            title="رسالة جديدة"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                                {loading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                    </div>
                                ) : (
                                    <>
                                        {groupMessages.length > 0 && (
                                            <div>
                                                <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase bg-gray-50">المجموعات</p>
                                                {groupMessages.map(conv => (
                                                    <ChatItem
                                                        key={conv.id}
                                                        conv={conv}
                                                        selected={selectedConversation?.id === conv.id}
                                                        onSelect={() => handleSelectConversation(conv)}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        <div>
                                            <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase bg-gray-50">الرسائل المباشرة</p>
                                            {directMessages.length === 0 ? (
                                                <p className="text-center text-gray-400 py-8 text-sm">لا توجد محادثات</p>
                                            ) : (
                                                directMessages.map(conv => (
                                                    <ChatItem
                                                        key={conv.id}
                                                        conv={conv}
                                                        selected={selectedConversation?.id === conv.id}
                                                        onSelect={() => handleSelectConversation(conv)}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className={`flex-1 flex flex-col bg-[#F3F4F6] ${!showMobileChat ? 'hidden md:flex' : 'fixed top-0 left-0 right-0 bottom-0 z-[10000] flex md:relative md:inset-auto md:z-auto md:bottom-auto'}`}>
                            {selectedConversation ? (
                                <>
                                    <div className="px-3 py-2.5 bg-primary/10 border-b border-primary/20 flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setShowMobileChat(false);
                                                window.dispatchEvent(new Event('chatClosed'));
                                            }}
                                            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                                        >
                                            <ArrowRight className="w-5 h-5 text-gray-600" />
                                        </button>

                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${selectedConversation.user.avatar === '/logo.png' ? 'bg-transparent' : 'bg-gradient-to-br from-primary to-purple-600'}`}>
                                            {selectedConversation.user.avatar && !selectedConversation.user.avatar.includes('ui-avatars') ? (
                                                <img
                                                    src={selectedConversation.user.avatar}
                                                    alt=""
                                                    className={`w-full h-full ${selectedConversation.user.avatar === '/logo.png' ? 'object-contain p-1' : 'object-cover'}`}
                                                />
                                            ) : selectedConversation.type === 'group' ? (
                                                <Users className="w-5 h-5 text-white" />
                                            ) : (
                                                <span className="text-white font-bold">
                                                    {selectedConversation.user.nickname.charAt(0)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900">
                                                {selectedConversation.user.nickname}
                                            </p>
                                            {(currentUser?.role === 'owner' || currentUser?.role === 'specialist') && (
                                                <p className="text-[10px] text-gray-400 font-mono select-all cursor-pointer hover:text-primary" onClick={() => { navigator.clipboard.writeText(selectedConversation.user.id); toast.success('تم نسخ ID'); }}>
                                                    ID: {selectedConversation.user.id}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {selectedConversation.type === 'group' && (
                                                <button
                                                    onClick={async () => {
                                                        setShowGroupMembers(true);
                                                        setLoadingMembers(true);
                                                        try {
                                                            // TODO: Implement loading members via Supabase?
                                                            // We can assume user is enrolled.
                                                            // Or fetch enrollments joined with users for this group.
                                                            // supabase.from('enrollments').select('user:users(id, nickname, avatar)')...
                                                            const isGroup = !!selectedConversation.group_id;
                                                            const query = supabase.from('enrollments')
                                                                .select('user:users(id, nickname, avatar)')
                                                                .eq(isGroup ? 'group_id' : 'course_id', selectedConversation.id);

                                                            const { data } = await query;
                                                            // Also fetch Specialist?
                                                            setGroupMembers(data?.map((d: any) => d.user).filter((u: any) => u) || []);
                                                        } catch (e) {
                                                            console.error(e);
                                                        } finally {
                                                            setLoadingMembers(false);
                                                        }
                                                    }}
                                                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                                                    title="عرض الأعضاء"
                                                >
                                                    <Users className="w-5 h-5 text-gray-600" />
                                                </button>
                                            )}
                                            {selectedConversation.type === 'group' && (currentUser.role === 'specialist' || currentUser.role === 'owner') && (
                                                <Link
                                                    href={`/specialist/schedule?groupId=${selectedConversation.id}`}
                                                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                                                    title="جدولة جلسة للمجموعة"
                                                >
                                                    <Calendar className="w-5 h-5 text-gray-600" />
                                                </Link>
                                            )}
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowChatOptions(!showChatOptions)}
                                                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                                                >
                                                    <MoreVertical className="w-5 h-5 text-gray-600" />
                                                </button>
                                                {showChatOptions && (
                                                    <div className="absolute top-12 left-0 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                                                        <button
                                                            onClick={handleDeleteConversation}
                                                            className="w-full text-right px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            حذف المحادثة
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div ref={messagesContainerRef} className={`flex-1 overflow-y-auto p-4 space-y-2 transition-opacity duration-100 overflow-x-hidden ${messagesReady || messages.length === 0 ? 'opacity-100' : 'opacity-0'}`} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
                                        {messages.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                                                    <MessageCircle className="w-10 h-10" />
                                                </div>
                                                <p className="text-lg font-medium">ابدأ المحادثة</p>
                                                <p className="text-sm">أرسل رسالتك الأولى</p>
                                            </div>
                                        ) : (
                                            messages.map((msg) => {
                                                const senderId = msg.sender_id || msg.senderId;
                                                const SYSTEM_ID = '87de5cca-9c37-465b-844f-4ef80ba95c7d';

                                                const isSystem = msg.sender?.role === 'admin' || msg.sender?.email === 'system@iwaa.com';
                                                const isOwner = currentUser?.role === 'owner';

                                                // Owner Impersonation Check - Both old/new system IDs might appear in DB
                                                const isLegacySender = senderId === SYSTEM_ID || senderId === 'b1cb10e6-002e-4377-850e-2c3bcbdfb648'; // Keep old for backward compat

                                                const isMe = senderId === currentUser.id || (isOwner && (isSystem || isLegacySender));

                                                return (
                                                    <ChatBubble
                                                        key={msg.id}
                                                        msg={msg}
                                                        isMe={isMe}
                                                        isGroup={selectedConversation.type === 'group'}
                                                        onReply={() => setReplyingTo(msg)}
                                                        onHide={() => handleHideMessage(msg.id)}
                                                        canHide={['owner', 'specialist'].includes(currentUser?.role)}
                                                    />
                                                );
                                            })
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {replyingTo && (
                                        <div className="px-3 py-2 bg-gray-100 border-t border-gray-200 flex items-center gap-2">
                                            <div className="flex-1 w-0 bg-white rounded-lg p-2 border-r-4 border-primary overflow-hidden flex items-center gap-2">
                                                {(replyingTo.content?.startsWith('http') &&
                                                    (replyingTo.content.length > 50 ||
                                                        /\.(gif|jpg|jpeg|png|webp|svg)/i.test(replyingTo.content))) && (
                                                        <img
                                                            src={replyingTo.content}
                                                            alt="صورة"
                                                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                                                        />
                                                    )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-primary font-bold truncate">{replyingTo.senderName || 'أنت'}</p>
                                                    <p className="text-xs text-gray-600 truncate">
                                                        {(replyingTo.content?.startsWith('http') &&
                                                            (replyingTo.content.length > 50 ||
                                                                /\.(gif|jpg|jpeg|png|webp|svg)/i.test(replyingTo.content)))
                                                            ? '📷 صورة'
                                                            : replyingTo.content}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setReplyingTo(null)}
                                                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center flex-shrink-0"
                                            >
                                                <X className="w-4 h-4 text-gray-500" />
                                            </button>
                                        </div>
                                    )}

                                    {imagePreview && (
                                        <div className="px-3 py-2 bg-gray-100 border-t border-gray-200 flex items-center gap-2">
                                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-300">
                                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-700">صورة مختارة</p>
                                                <p className="text-xs text-gray-500">{(selectedImage?.size || 0) / 1024 > 1024 ? `${((selectedImage?.size || 0) / 1024 / 1024).toFixed(2)} MB` : `${((selectedImage?.size || 0) / 1024).toFixed(2)} KB`}</p>
                                            </div>
                                            <button
                                                onClick={cancelImageSelection}
                                                className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center"
                                            >
                                                <X className="w-4 h-4 text-gray-500" />
                                            </button>
                                        </div>
                                    )}

                                    {showStickerPicker && (
                                        <div className="absolute bottom-20 right-4 z-50 shadow-xl rounded-xl bg-white border border-gray-200 p-2 w-72 max-h-80 overflow-y-auto custom-scrollbar">
                                            <div className="grid grid-cols-4 gap-2">
                                                {/* Custom Sticker Upload Button */}
                                                <button
                                                    onClick={() => customStickerInputRef.current?.click()}
                                                    className="aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors gap-1 group bg-gray-50"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                                        <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-500" />
                                                    </div>
                                                    <span className="text-[10px] font-medium text-gray-500 group-hover:text-blue-600">جديد</span>
                                                </button>

                                                {/* User Saved Stickers */}
                                                {userStickers.map((sticker) => (
                                                    <div key={sticker.id} className="relative group aspect-square">
                                                        <button
                                                            onClick={() => handleSendSticker(sticker.url)}
                                                            className="w-full h-full p-2 hover:bg-gray-100 rounded-xl transition-colors border border-transparent hover:border-gray-200"
                                                        >
                                                            <img
                                                                src={sticker.url}
                                                                alt="Sticker"
                                                                className="w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-200"
                                                                loading="lazy"
                                                            />
                                                        </button>
                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={(e) => handleDeleteSticker(sticker.id, e)}
                                                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110 z-10"
                                                            title="حذف"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* Default Stickers */}
                                                {STICKERS.map((sticker, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleSendSticker(sticker)}
                                                        className="aspect-square p-2 hover:bg-gray-100 rounded-xl transition-colors group border border-transparent hover:border-gray-200"
                                                    >

                                                        <img src={sticker} alt="Sticker" className="w-full h-auto object-contain" />
                                                    </button>
                                                ))}
                                            </div>
                                            <input
                                                type="file"
                                                ref={customStickerInputRef}
                                                className="hidden"
                                                accept="image/png,image/jpeg,image/webp,image/gif"
                                                onChange={handleCustomStickerSelect}
                                            />
                                        </div>
                                    )}

                                    <div className="p-3 pb-2 bg-white border-t border-gray-200 relative shrink-0 safe-area-bottom">
                                        <form onSubmit={selectedImage ? (e) => { e.preventDefault(); handleSendImage(); } : handleSendMessage} className="flex items-center gap-2 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setShowStickerPicker(!showStickerPicker)}
                                                className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-colors ${showStickerPicker ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                                            >
                                                <Smile className="w-6 h-6 text-gray-500" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                                            >
                                                <ImageIcon className="w-6 h-6 text-gray-500" />
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageSelect}
                                            />

                                            <input
                                                type="text"
                                                value={newMessage}
                                                onChange={(e) => setNewMessage(e.target.value)}
                                                placeholder={replyingTo ? "اكتب ردك..." : "اكتب رسالة..."}
                                                className="flex-1 min-w-0 px-4 py-3 rounded-full bg-gray-100 border-0 outline-none text-base"
                                                disabled={!!selectedImage}
                                            />
                                            <button
                                                type="submit"
                                                disabled={(!newMessage.trim() && !selectedImage) || sending || uploadingImage}
                                                className="w-10 h-10 flex-shrink-0 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 transition-all hover:bg-primary/90"
                                            >
                                                {sending || uploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                            </button>
                                        </form>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center bg-[#f0f2f5]">
                                    <div className="text-center">
                                        <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gray-200 flex items-center justify-center">
                                            <MessageCircle className="w-16 h-16 text-gray-400" />
                                        </div>
                                        <h3 className="text-2xl font-semibold text-gray-700 mb-2">رسائلك</h3>
                                        <p className="text-gray-500">اختر محادثة للبدء</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main >

            {showUserSearch && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden max-h-[80vh] flex flex-col">
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg">رسالة جديدة</h3>
                                <button onClick={() => setShowUserSearch(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="بحث بالاسم أو ID..."
                                    className="w-full pr-10 pl-4 py-2 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={searchQuery}
                                    onChange={(e) => handleSearchUsers(e.target.value, 1)}
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div
                            className="flex-1 overflow-y-auto p-2"
                            onScroll={handleUserListScroll}
                        >
                            {searchResults.length === 0 && !searching ? (
                                <div className="text-center py-8 text-gray-500">
                                    {searchQuery ? 'لا توجد نتائج' : 'ابدأ البحث للعثور على مستخدمين'}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {searchResults.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => startConversationWithUser(user)}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-right"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                                {user.avatar ? (
                                                    <img
                                                        src={user.avatar}
                                                        alt=""
                                                        className={`w-full h-full ${user.avatar === '/logo.png' ? 'object-contain p-1' : 'object-cover'}`}
                                                    />
                                                ) : (
                                                    <User className="w-5 h-5 text-gray-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm text-gray-900 truncate">{user.nickname}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.role === 'specialist' ? 'أخصائي' : user.role === 'owner' ? 'مالك' : 'مستخدم'}</p>
                                            </div>
                                        </button>
                                    ))}
                                    {searching && (
                                        <div className="py-4 flex justify-center">
                                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showGroupMembers && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowGroupMembers(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">أعضاء المجموعة</h3>
                            <button onClick={() => setShowGroupMembers(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {loadingMembers ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : groupMembers.length > 0 ? (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                {groupMembers.map(member => (
                                    <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                                            {member.avatar ? (
                                                <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-primary font-bold">{member.nickname?.charAt(0)}</span>
                                            )}
                                        </div>
                                        <p className="font-medium text-gray-800">{member.nickname}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-400 py-8">لا يوجد أعضاء</p>
                        )}
                    </div>
                </div>
            )}
        </div >
    );
}

function ChatItem({ conv, selected, onSelect }: { conv: Conversation, selected: boolean, onSelect: () => void }) {
    const timeAgo = conv.lastMessageAt ? formatTimeAgo(conv.lastMessageAt) : '';

    return (
        <button
            onClick={onSelect}
            className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors ${selected ? 'bg-gray-100' : ''}`}
        >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${conv.user.avatar === '/logo.png' ? 'bg-transparent' : conv.type === 'group' ? 'bg-green-500' : 'bg-gradient-to-br from-primary to-purple-600'}`}>
                {conv.user.avatar && !conv.user.avatar.includes('ui-avatars') ? (
                    <img
                        src={conv.user.avatar}
                        alt=""
                        className={`w-full h-full ${conv.user.avatar === '/logo.png' ? 'object-contain p-1' : 'object-cover'}`}
                    />
                ) : conv.type === 'group' ? (
                    <Users className="w-6 h-6 text-white" />
                ) : (
                    <span className="text-white font-bold text-lg">
                        {conv.user.nickname.charAt(0)}
                    </span>
                )}
            </div>

            <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                        {conv.user.nickname}
                    </p>
                    <span className="text-xs text-gray-400">{timeAgo}</span>
                </div>
                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 truncate">{conv.lastMessage || 'ابدأ المحادثة'}</p>
                    {conv.unreadCount > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 bg-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                            {conv.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}

function ChatBubble({ msg, isMe, isGroup, onReply, onHide, canHide }: { msg: Message, isMe: boolean, isGroup: boolean, onReply?: (msg: Message) => void, onHide?: (id: string) => void, canHide?: boolean }) {
    const [swipeX, setSwipeX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const touchStartX = useRef(0);
    const swipeThreshold = 60;

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        setIsSwiping(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartX.current;
        let clampedDiff = 0;
        if (isMe) {
            clampedDiff = Math.max(-80, Math.min(0, diff));
        } else {
            clampedDiff = Math.max(0, Math.min(80, diff));
        }
        setSwipeX(clampedDiff);
    };

    const handleTouchEnd = () => {
        if (Math.abs(swipeX) >= swipeThreshold && onReply) {
            onReply(msg);
            if (navigator.vibrate) navigator.vibrate(50);
        }
        setSwipeX(0);
        setIsSwiping(false);
    };

    if (msg.type === 'schedule') {
        const scheduledDate = msg.metadata?.scheduled_at ? new Date(msg.metadata.scheduled_at) : null;
        return (
            <div className="flex justify-center my-4">
                <div className="bg-white rounded-xl p-4 shadow-sm max-w-xs text-center">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{msg.content}</p>
                    {scheduledDate && (
                        <div className="mt-2 text-xs text-gray-500 flex items-center justify-center gap-2">
                            <span>{scheduledDate.toLocaleDateString('ar-EG')}</span>
                            <span>•</span>
                            <span>{scheduledDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const getNameColor = (senderId?: string | null) => {
        if (!senderId) return 'text-gray-600';
        const colors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600', 'text-pink-600', 'text-teal-600'];
        let hash = 0;
        for (let i = 0; i < senderId.length; i++) {
            hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div
            className={`flex w-full group relative mb-2 ${isMe ? 'justify-start' : 'justify-end'}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Swipe Reply Indicator */}
            {Math.abs(swipeX) > 10 && (
                <div
                    className={`absolute ${swipeX > 0 ? 'right-auto -left-12' : 'left-auto -right-12'} top-1/2 -translate-y-1/2 flex items-center justify-center transition-all z-10`}
                    style={{
                        opacity: Math.min(Math.abs(swipeX) / swipeThreshold, 1),
                        transform: `translateY(-50%) scale(${0.5 + (Math.abs(swipeX) / swipeThreshold) * 0.5})`
                    }}
                >
                    <div className={`w-10 h-10 rounded-full ${Math.abs(swipeX) >= swipeThreshold ? 'bg-[#25D366]' : 'bg-gray-200'} flex items-center justify-center transition-colors shadow-md`}>
                        <Reply className={`w-5 h-5 ${Math.abs(swipeX) >= swipeThreshold ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                </div>
            )}

            <div className="flex flex-col max-w-[70%] md:max-w-[55%]">
                {/* Sender name in groups */}
                {isGroup && !isMe && (
                    <div className="flex items-center gap-2 mb-1 flex-row-reverse px-3">
                        <span className={`text-[13px] font-semibold ${getNameColor(msg.senderId)}`}>
                            {msg.senderName || 'مستخدم'}
                        </span>
                    </div>
                )}

                <div
                    className="flex items-end gap-1 transition-transform duration-100 relative group/bubble"
                    style={{ transform: `translateX(${swipeX}px)` }}
                >
                    {/* Desktop Reply Button - appears on hover */}
                    <button
                        onClick={() => onReply?.(msg)}
                        className={`hidden md:flex absolute ${isMe ? '-left-10' : '-right-10'} top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-gray-100 hover:bg-[#3478F6] items-center justify-center opacity-0 group-hover/bubble:opacity-100 transition-all shadow-sm hover:shadow-md`}
                        title="رد"
                    >
                        <Reply className="w-4 h-4 text-gray-500 hover:text-white" />
                    </button>
                    {/* Check if sticker - render without bubble */}
                    {(msg.metadata?.isSticker || msg.content.includes('/stickers/')) ? (
                        <div className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}>
                            <img
                                src={msg.content.trim()}
                                alt="sticker"
                                className="w-24 h-24 object-contain cursor-pointer hover:scale-105 transition-transform"
                                onClick={() => window.open(msg.content.trim(), '_blank')}
                            />
                            <div className="flex items-center gap-1 mt-1 px-1">
                                <span className="text-[11px] text-gray-500">
                                    {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMe && (
                                    msg.read
                                        ? <CheckCheck className="w-4 h-4 text-[#53BDEB]" />
                                        : <CheckCheck className="w-4 h-4 text-gray-400" />
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Professional Chat Bubble Design - Compact */
                        <div className={`rounded-[18px] ${isMe
                            ? 'bg-[#3478F6] shadow-sm shadow-blue-500/15'
                            : 'bg-white shadow-sm shadow-gray-200/40 border border-gray-100'
                            }`}
                        >
                            {/* Link Preview (for URLs) */}
                            {msg.content.startsWith('http') && !(/\.(gif|jpg|jpeg|png|webp)/i.test(msg.content.trim())) && (
                                <div className={`p-3 border-b ${isMe ? 'border-white/10' : 'border-gray-100'}`}>
                                    <div className={`flex items-center gap-3 ${isMe ? 'text-white' : 'text-gray-800'}`}>
                                        <div className={`w-12 h-12 rounded-xl ${isMe ? 'bg-white/20' : 'bg-gray-100'} flex items-center justify-center shrink-0`}>
                                            <LinkIcon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[13px] font-semibold truncate ${isMe ? 'text-white' : 'text-gray-900'}`}>
                                                رابط خارجي
                                            </p>
                                            <p className={`text-[11px] truncate ${isMe ? 'text-white/60' : 'text-gray-500'}`}>
                                                {msg.content.substring(0, 40)}...
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Image Message */}
                            {(msg.type === 'image' ||
                                /\.(gif|jpg|jpeg|png|webp)/i.test(msg.content.trim()) ||
                                msg.content.includes('supabase.co/storage')) && (
                                    <div className="p-1">
                                        <div className="rounded-[18px] overflow-hidden cursor-pointer" onClick={() => window.open(msg.content.trim(), '_blank')}>
                                            <img
                                                src={msg.content.trim()}
                                                alt="img"
                                                className="w-full max-h-[280px] object-cover"
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className={`flex items-center justify-end gap-1 px-2 py-1`}>
                                            <span className={`text-[11px] ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMe && (
                                                msg.read
                                                    ? <CheckCheck className="w-4 h-4 text-white" />
                                                    : <CheckCheck className="w-4 h-4 text-white/50" />
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Text Message */}
                            {!(msg.type === 'image' ||
                                /\.(gif|jpg|jpeg|png|webp)/i.test(msg.content.trim()) ||
                                msg.content.includes('supabase.co/storage')) && (
                                    <div className="px-3 py-1.5">
                                        {/* Reply Section - Compact Professional */}
                                        {msg.replyTo && (
                                            <div className={`mb-1 p-1.5 rounded-lg ${isMe ? 'bg-white/10' : 'bg-gray-50'} border-r-[2.5px] ${isMe ? 'border-white/40' : 'border-[#3478F6]'}`}>
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-6 h-6 rounded-md ${isMe ? 'bg-white/20' : 'bg-[#3478F6]/10'} flex items-center justify-center shrink-0`}>
                                                        <Reply className={`w-3 h-3 ${isMe ? 'text-white/70' : 'text-[#3478F6]'}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-semibold text-[11px] ${isMe ? 'text-white/90' : 'text-[#3478F6]'}`}>
                                                            {msg.replyTo.senderName || 'مستخدم'}
                                                        </p>
                                                        <p className={`text-[11px] truncate ${isMe ? 'text-white/50' : 'text-gray-500'}`}>
                                                            {(msg.replyTo.content?.startsWith('http') &&
                                                                (msg.replyTo.content.length > 50 ||
                                                                    /\.(gif|jpg|jpeg|png|webp|svg)/i.test(msg.replyTo.content)))
                                                                ? '📷 صورة'
                                                                : msg.replyTo.content?.substring(0, 30)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Message Text */}
                                        <p className={`text-[13.5px] leading-snug break-words whitespace-pre-wrap ${isMe ? 'text-white' : 'text-gray-800'}`}>
                                            {msg.content}
                                        </p>

                                        {/* Time and Status - Inline Compact */}
                                        <div className="flex items-center justify-end gap-1 mt-0.5">
                                            <span className={`text-[10px] font-medium ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            {isMe && (
                                                msg.read
                                                    ? <CheckCheck className="w-3.5 h-3.5 text-white" />
                                                    : <CheckCheck className="w-3.5 h-3.5 text-white/50" />
                                            )}
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function formatTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays === 0) {
        return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays < 7) return `${diffDays}ي`;
    return date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
}
