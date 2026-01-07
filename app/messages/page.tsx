"use client";

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, Loader2, User, Users, Calendar, Clock, ArrowRight, Phone, Video, MoreVertical, Check, CheckCheck, Smile, X, Reply, Image as ImageIcon, Plus, Search, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { useNSFW } from "@/hooks/useNSFW";
import { containsProfanity } from "@/lib/profanity";

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
}

interface Message {
    id: string;
    content: string;
    senderId?: string; // Optional (legacy)
    sender_id?: string; // Backend format
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
    const [messagesReady, setMessagesReady] = useState(false); // Hide until scroll complete
    const [showStickerPicker, setShowStickerPicker] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const { checkImage, loading: nsfwLoading } = useNSFW();
    const [showChatOptions, setShowChatOptions] = useState(false); // For Delete Menu

    // User Search (Owner/Specialist)
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [searching, setSearching] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Scheduling State
    const [showSchedule, setShowSchedule] = useState(false);
    const [scheduleData, setScheduleData] = useState({ date: '', time: '', title: '' });
    const [scheduling, setScheduling] = useState(false);

    // Group Members Modal
    const [showGroupMembers, setShowGroupMembers] = useState(false);
    const [groupMembers, setGroupMembers] = useState<{ id: string, nickname: string, avatar?: string }[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const previousMessagesCount = useRef(0);
    const hadUnreadOnOpen = useRef(false); // Track if there were unread messages when opening
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Stickers (Modern Fluent Emoji 3D + Animated)
    const STICKERS = [
        // Microsoft Fluent Emoji 3D (Modern Look)
        "https://em-content.zobj.net/source/microsoft-teams/363/red-heart_2764-fe0f.png", // ❤️ Heart
        "https://em-content.zobj.net/source/microsoft-teams/363/thumbs-up_1f44d.png", // 👍 Thumbs up
        "https://em-content.zobj.net/source/microsoft-teams/363/face-with-tears-of-joy_1f602.png", // 😂 Laughing
        "https://em-content.zobj.net/source/microsoft-teams/363/fire_1f525.png", // 🔥 Fire
        "https://em-content.zobj.net/source/microsoft-teams/363/star_2b50.png", // ⭐ Star
        "https://em-content.zobj.net/source/microsoft-teams/363/clapping-hands_1f44f.png", // 👏 Clapping
        "https://em-content.zobj.net/source/microsoft-teams/363/smiling-face-with-heart-eyes_1f60d.png", // 😍 Heart eyes
        "https://em-content.zobj.net/source/microsoft-teams/363/folded-hands_1f64f.png", // 🙏 Praying
        "https://em-content.zobj.net/source/microsoft-teams/363/party-popper_1f389.png", // 🎉 Party
        "https://em-content.zobj.net/source/microsoft-teams/363/hundred-points_1f4af.png", // 💯 100
        "https://em-content.zobj.net/source/microsoft-teams/363/face-blowing-a-kiss_1f618.png", // 😘 Kiss
        "https://em-content.zobj.net/source/microsoft-teams/363/sparkles_2728.png", // ✨ Sparkles
    ];

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login?redirect=/messages');
            return;
        }
        setCurrentUser(JSON.parse(storedUser));
        fetchConversations();
    }, [router]);

    // ... (rest of scroll logic)

    // Scroll to bottom on first load (instantly) and when new messages arrive (smooth)
    useLayoutEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        // First load: instantly scroll to bottom (before paint, no visible movement)
        if (messages.length > 0 && previousMessagesCount.current === 0) {
            container.scrollTop = container.scrollHeight;
            // Now show the messages
            setMessagesReady(true);
        }
        // New messages arrived while viewing: scroll smoothly
        else if (messages.length > previousMessagesCount.current && previousMessagesCount.current > 0) {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
        previousMessagesCount.current = messages.length;
    }, [messages]);

    // Polling for new messages every 1.5 seconds (faster updates)
    useEffect(() => {
        if (!selectedConversation) return;

        const interval = setInterval(() => {
            fetchMessages(selectedConversation.id, selectedConversation.type);
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedConversation]);

    // Polling for conversation list updates every 2 seconds (for unread counts & last message)
    useEffect(() => {
        if (!currentUser) return;

        const interval = setInterval(() => {
            fetchConversationsQuiet();
        }, 15000);

        return () => clearInterval(interval);
    }, [currentUser]);

    // Quiet fetch that doesn't affect loading state
    const fetchConversationsQuiet = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/messages/conversations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                // Preserve unreadCount=0 for currently selected conversation
                setConversations(prev => {
                    const newConvs = data.conversations || [];
                    return newConvs.map((c: Conversation) => {
                        if (selectedConversation && c.id === selectedConversation.id) {
                            return { ...c, unreadCount: 0 };
                        }
                        return c;
                    });
                });
            }
        } catch (err) {
            // Silent fail
        }
    };

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/messages/conversations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);
            }
        } catch (err) {
            console.error('Failed to fetch conversations:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (id: string, type: 'direct' | 'group') => {
        try {
            const token = localStorage.getItem('token');
            const url = `${API_URL}/api/messages/${id}?type=${type}`;
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (err) {
            // Ignore network errors during polling (common when server restarts)
            if (err instanceof TypeError && err.message === 'Failed to fetch') {
                return;
            }
            console.error('Failed to fetch messages:', err);
        }
    };

    const handleSelectConversation = (conv: Conversation) => {
        // Track if this conversation had unread messages
        hadUnreadOnOpen.current = conv.unreadCount > 0;
        previousMessagesCount.current = 0; // Reset for first load detection
        setMessagesReady(false); // Hide until scroll complete

        // Calculate new total to update nav badge immediately (outside of state setter to avoid React error)
        const currentTotalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        const newTotalUnread = Math.max(0, currentTotalUnread - (conv.unreadCount || 0));
        window.dispatchEvent(new CustomEvent('unreadCountUpdated', { detail: { count: newTotalUnread } }));

        // Clear unread count for this conversation
        setConversations(prev => prev.map(c =>
            c.id === conv.id ? { ...c, unreadCount: 0 } : c
        ));
        setSelectedConversation({ ...conv, unreadCount: 0 });
        fetchMessages(conv.id, conv.type);
        setShowMobileChat(true);
        // Dispatch event to hide bottom nav
        window.dispatchEvent(new Event('chatOpened'));
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();

        // Profanity Check
        if (containsProfanity(newMessage)) {
            toast.error('عفواً، لا يمكن إرسال هذه الرسالة لاحتوائها على كلمات غير لائقة.');
            return;
        }

        if (!newMessage.trim() || !selectedConversation || sending) return;

        setSending(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/messages/${selectedConversation.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: newMessage,
                    type: selectedConversation.type,
                    replyToId: replyingTo?.id || null
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages([...messages, data.message]);
                setNewMessage("");
                setReplyingTo(null); // Clear reply
                setShowStickerPicker(false);
            }
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSending(false);
        }
    };

    // Handle image selection
    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error('حجم الصورة كبير جداً (الحد الأقصى 5MB)');
                return;
            }

            // NSFW Check
            const toastId = toast.loading('جاري فحص الصورة...');
            const { isSafe, reason } = await checkImage(file);
            toast.dismiss(toastId);

            if (!isSafe) {
                toast.error(reason || 'عذراً، هذه الصورة تحتوي على محتوى غير لائق وتم حظرها.');
                e.target.value = ''; // Clear input
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

    // Cancel image selection
    const cancelImageSelection = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Send image message
    const handleSendImage = async () => {
        if (!selectedImage || !selectedConversation || uploadingImage) return;

        setUploadingImage(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('image', selectedImage);
            formData.append('type', selectedConversation.type);

            const res = await fetch(`${API_URL}/api/messages/${selectedConversation.id}/image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setMessages([...messages, data.message]);
                cancelImageSelection();
                toast.success('تم إرسال الصورة');
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'فشل إرسال الصورة');
            }
        } catch (err) {
            console.error('Failed to send image:', err);
            toast.error('حدث خطأ أثناء الاتصال');
        } finally {
            setUploadingImage(false);
        }
    };

    // Send sticker (as image)
    const handleSendSticker = async (stickerUrl: string) => {
        if (!selectedConversation || uploadingImage) return;

        setUploadingImage(true);
        setShowStickerPicker(false);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/messages/${selectedConversation.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: stickerUrl,
                    type: selectedConversation.type, // For Routing (group/direct)
                    msgType: 'image', // Stickers are stored as images
                    replyToId: replyingTo?.id || null
                })
            });

            if (res.ok) {
                const data = await res.json();
                setMessages([...messages, data.message]);
                toast.success('تم إرسال الملصق');
            } else {
                const errorData = await res.json();
                toast.error(errorData.error || 'فشل إرسال الملصق');
            }
        } catch (err) {
            console.error('Failed to send sticker:', err);
            toast.error('حدث خطأ');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleScheduleSession = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedConversation || !scheduleData.date || !scheduleData.time || scheduling) return;

        setScheduling(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/messages/${selectedConversation.id}/schedule`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(scheduleData)
            });

            if (res.ok) {
                const data = await res.json();
                setMessages([...messages, data.chatMessage]);
                setShowSchedule(false);
                setScheduleData({ date: '', time: '', title: '' });
                toast.success('تم جدولة الجلسة بنجاح');
            } else {
                const err = await res.json();
                toast.error(err.error || 'فشل في الجدولة');
            }
        } catch (err) {
            toast.error('حدث خطأ');
        } finally {
            setScheduling(false);
        }
    };

    const handleContactSupport = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/messages/support`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                const supportUser = data.supportUser;

                const existingComp = conversations.find(c => c.user.id === supportUser.id);
                if (existingComp) {
                    handleSelectConversation(existingComp);
                } else {
                    const newConv: Conversation = {
                        id: supportUser.id,
                        type: 'direct',
                        user: { ...supportUser },
                        unreadCount: 0,
                        lastMessage: 'بدء محادثة الدعم'
                    };
                    setConversations([newConv, ...conversations]);
                    handleSelectConversation(newConv);
                }
            } else {
                toast.error('خدمة الدعم غير متاحة حالياً');
            }
        } catch (err) {
            toast.error('حدث خطأ');
        }

    };

    const handleDeleteConversation = async () => {
        if (!selectedConversation) return;
        if (!confirm('هل أنت متأكد من حذف هذه المحادثة؟ سيتم حذف جميع الرسائل من الطرفين.')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/messages/conversations/${selectedConversation.id}?type=${selectedConversation.type}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('تم حذف المحادثة');
                setConversations(conversations.filter(c => c.id !== selectedConversation.id));
                setSelectedConversation(null);
                setShowMobileChat(false);
                setShowChatOptions(false);
            } else {
                toast.error('فشل حذف المحادثة');
            }
        } catch (err) {
            toast.error('حدث خطأ');
        }
    };

    const handleHideMessage = async (messageId: string) => {
        if (!confirm('هل أنت متأكد من إخفاء هذه الرسالة؟ لن تظهر للمستخدمين الآخرين.')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/messages/${messageId}/hide`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ hidden: true })
            });

            if (res.ok) {
                toast.success('تم إخفاء الرسالة');
                // Update local state to show hidden indicator
                setMessages(messages.map(m =>
                    m.id === messageId ? { ...m, hidden: true } : m
                ));
            } else {
                toast.error('فشل إخفاء الرسالة');
            }
        } catch (err) {
            toast.error('حدث خطأ');
        }
    };


    const handleSearchUsers = async (query: string, pageNum: number = 1) => {
        setSearchQuery(query);
        // Removed length check to allow "Load All" on empty query

        // If query changed (pageNum === 1), reset results
        if (pageNum === 1) {
            setPage(1);
            setHasMore(true);
            setSearchResults([]); // Optional: clear or keep while loading? Let's clear if query changed. 
        }

        setSearching(true);
        try {
            const token = localStorage.getItem('token');
            // Use limit 100 for empty query (list mode), 10 or 20 for search. Backend handles default.
            const res = await fetch(`${API_URL}/api/users/search?q=${query}&page=${pageNum}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            const newUsers = data.users || [];

            if (pageNum === 1) {
                setSearchResults(newUsers);
            } else {
                setSearchResults(prev => [...prev, ...newUsers]);
            }

            // Check pagination metadata from backend
            if (data.pagination) {
                setHasMore(data.pagination.hasMore);
            } else {
                // Fallback logic if backend didn't send pagination (shouldn't happen with new backend)
                setHasMore(newUsers.length > 0);
            }

            setPage(pageNum);

        } catch (error) {
            console.error(error);
        } finally {
            setSearching(false);
        }
    };

    // Load initial users when modal opens
    useEffect(() => {
        if (showUserSearch) {
            // Check if we already have results to avoid re-fetching if just toggling? 
            // Better to refresh.
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
        // Check if conversation exists
        const existing = conversations.find(c => c.user.id === user.id);
        if (existing) {
            handleSelectConversation(existing);
        } else {
            // Create temporary conversation
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

    const directMessages = conversations.filter(c => c.type === 'direct');
    const groupMessages = conversations.filter(c => c.type === 'group');

    return (
        <div className="bg-gray-100 min-h-screen" dir="rtl">
            {/* Header - only show on desktop or when chat list is visible */}
            <div className={`${showMobileChat ? 'hidden md:block' : ''}`}>
                <Header />
            </div>

            <main className={`${showMobileChat ? '' : 'pt-20'} md:pt-20`}>
                <div className="md:container md:mx-auto md:px-4 md:py-4 h-[100dvh] md:h-[calc(100vh-100px)]">
                    <div className="bg-white md:rounded-2xl h-full overflow-hidden flex md:shadow-xl md:border border-gray-200">

                        {/* Conversations List - Hidden on mobile when chat is open */}
                        <div className={`w-full md:w-96 border-l border-gray-200 flex flex-col bg-white ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                            {/* Header */}
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

                            {/* Conversations */}
                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                    </div>
                                ) : (
                                    <>
                                        {/* Groups */}
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

                                        {/* Direct Messages */}
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

                        {/* Chat Window */}
                        <div className={`flex-1 flex flex-col bg-[#f0f2f5] ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                            {selectedConversation ? (
                                <>
                                    {/* Chat Header */}
                                    <div className="px-3 py-2.5 bg-white border-b border-gray-200 flex items-center gap-2 shadow-sm">
                                        {/* Back button - mobile only */}
                                        <button
                                            onClick={() => {
                                                setShowMobileChat(false);
                                                window.dispatchEvent(new Event('chatClosed'));
                                            }}
                                            className="md:hidden w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                                        >
                                            <ArrowRight className="w-5 h-5 text-gray-600" />
                                        </button>

                                        {/* Avatar */}
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

                                        {/* Name */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900">
                                                {selectedConversation.user.role === 'owner' ? 'دعم إيواء' : selectedConversation.user.nickname}
                                            </p>
                                            {(currentUser?.role === 'owner' || currentUser?.role === 'specialist') && (
                                                <p className="text-[10px] text-gray-400 font-mono select-all cursor-pointer hover:text-primary" onClick={() => { navigator.clipboard.writeText(selectedConversation.user.id); toast.success('تم نسخ ID'); }}>
                                                    ID: {selectedConversation.user.id}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            {/* View Group Members - Available for ALL users in group chats */}
                                            {selectedConversation.type === 'group' && (
                                                <button
                                                    onClick={async () => {
                                                        setShowGroupMembers(true);
                                                        setLoadingMembers(true);
                                                        try {
                                                            const token = localStorage.getItem('token');
                                                            const res = await fetch(`${API_URL}/api/groups/${selectedConversation.id}/members`, {
                                                                headers: { 'Authorization': `Bearer ${token}` }
                                                            });
                                                            const data = await res.json();
                                                            if (data.success) {
                                                                setGroupMembers(data.members || []);
                                                            }
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
                                                <button
                                                    onClick={() => setShowSchedule(!showSchedule)}
                                                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                                                >
                                                    <Calendar className="w-5 h-5 text-gray-600" />
                                                </button>
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

                                    {/* Schedule Form */}
                                    {showSchedule && (
                                        <div className="p-4 bg-white border-b border-gray-200">
                                            <form onSubmit={handleScheduleSession} className="flex flex-wrap gap-3">
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="عنوان الجلسة"
                                                    className="flex-1 min-w-[150px] px-4 py-2 rounded-lg bg-gray-100 border-0 text-sm"
                                                    value={scheduleData.title}
                                                    onChange={e => setScheduleData({ ...scheduleData, title: e.target.value })}
                                                />
                                                <input
                                                    type="date"
                                                    required
                                                    className="px-4 py-2 rounded-lg bg-gray-100 border-0 text-sm"
                                                    value={scheduleData.date}
                                                    onChange={e => setScheduleData({ ...scheduleData, date: e.target.value })}
                                                />
                                                <input
                                                    type="time"
                                                    required
                                                    className="px-4 py-2 rounded-lg bg-gray-100 border-0 text-sm"
                                                    value={scheduleData.time}
                                                    onChange={e => setScheduleData({ ...scheduleData, time: e.target.value })}
                                                />
                                                <button type="submit" disabled={scheduling} className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium">
                                                    {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'جدولة'}
                                                </button>
                                            </form>
                                        </div>
                                    )}

                                    {/* Messages */}
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
                                                const isSystem = msg.sender?.role === 'admin' || msg.sender?.email === 'system@sakina.com';
                                                const isOwner = currentUser?.role === 'owner';
                                                // Check if system message (admin role) AND I am owner
                                                const isMe = senderId === currentUser.id || (isOwner && isSystem);

                                                console.log(`Msg: ${msg.id}, Role: ${msg.sender?.role}, Email: ${msg.sender?.email}, IsOwner: ${isOwner}, IsSystem: ${isSystem} -> IsMe: ${isMe} (SenderId: ${senderId}, MyId: ${currentUser.id})`);

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

                                    {/* Reply Preview - with image thumbnail for images */}
                                    {replyingTo && (
                                        <div className="px-3 py-2 bg-gray-100 border-t border-gray-200 flex items-center gap-2">
                                            <div className="flex-1 w-0 bg-white rounded-lg p-2 border-r-4 border-primary overflow-hidden flex items-center gap-2">
                                                {/* Show thumbnail if it's an image */}
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

                                    {/* Image Preview */}
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

                                    {/* Sticker Picker */}
                                    {showStickerPicker && (
                                        <div className="absolute bottom-20 right-4 z-50 shadow-xl rounded-xl bg-white border border-gray-200 p-2 w-64 max-h-64 overflow-y-auto">
                                            <div className="grid grid-cols-3 gap-2">
                                                {STICKERS.map((sticker, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => handleSendSticker(sticker)}
                                                        className="hover:bg-gray-100 rounded-lg p-1 transition-colors"
                                                    >
                                                        <img src={sticker} alt="Sticker" className="w-full h-auto object-contain" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-3 bg-white border-t border-gray-200 relative">
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
                                                className="flex-1 min-w-0 px-4 py-3 rounded-full bg-gray-100 border-0 outline-none text-sm"
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

            {/* User Search Modal */}
            {
                showUserSearch && (
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
                                        placeholder="بحث بالاسم، البريد أو ID..."
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
                                                    <p className="text-xs text-gray-500 truncate">{user.email || 'بدون بريد'}</p>
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

            {/* Group Members Modal */}
            {
                showGroupMembers && (
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
            {/* Avatar */}
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

            {/* Content */}
            <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-between mb-0.5">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                        {conv.user.role === 'owner' ? 'دعم إيواء' : conv.user.nickname}
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

function ChatBubble({ msg, isMe, isGroup, onReply, onHide, canHide }: { msg: Message, isMe: boolean, isGroup: boolean, onReply?: () => void, onHide?: () => void, canHide?: boolean }) {
    // Swipe state for mobile
    const [swipeX, setSwipeX] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const touchStartX = useRef(0);
    const swipeThreshold = 60; // pixels to trigger reply

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        setIsSwiping(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - touchStartX.current;

        // RTL logic: 
        // isMe (Right aligned) -> Swipe Left (Negative)
        // !isMe (Left aligned) -> Swipe Right (Positive)
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
            onReply();
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

    // Generate consistent color for sender name based on their ID
    const getNameColor = (senderId: string | null) => {
        if (!senderId) return 'text-gray-600'; // Default for system messages
        const colors = ['text-blue-600', 'text-green-600', 'text-purple-600', 'text-orange-600', 'text-pink-600', 'text-teal-600'];
        let hash = 0;
        for (let i = 0; i < senderId.length; i++) {
            hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div
            className={`flex w-full group relative mb-3 ${isMe ? 'justify-start' : 'justify-end'}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Swipe reply indicator */}
            {Math.abs(swipeX) > 10 && (
                <div
                    className={`absolute ${swipeX > 0 ? 'right-auto -left-12' : 'left-auto -right-12'} top-1/2 -translate-y-1/2 flex items-center justify-center transition-all z-10`}
                    style={{
                        opacity: Math.min(Math.abs(swipeX) / swipeThreshold, 1),
                        transform: `translateY(-50%) scale(${0.5 + (Math.abs(swipeX) / swipeThreshold) * 0.5})`
                    }}
                >
                    <div className={`w-10 h-10 rounded-full ${Math.abs(swipeX) >= swipeThreshold ? 'bg-primary' : 'bg-gray-200'} flex items-center justify-center transition-colors shadow-md`}>
                        <Reply className={`w-5 h-5 ${Math.abs(swipeX) >= swipeThreshold ? 'text-white' : 'text-gray-500'}`} />
                    </div>
                </div>
            )}

            {/* Message content wrapper */}
            <div className="flex flex-col max-w-[75%] md:max-w-[55%]">
                {/* Avatar + Name row for group (others only) */}
                {isGroup && !isMe && (
                    <div className="flex items-center gap-2 mb-1 flex-row-reverse">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center overflow-hidden">
                            {msg.senderAvatar ? (
                                <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-[9px] font-bold">
                                    {(msg.senderName || 'م').charAt(0)}
                                </span>
                            )}
                        </div>
                        <span className={`text-sm font-bold ${getNameColor(msg.senderId)}`}>
                            {msg.senderName || 'مستخدم'}
                        </span>
                    </div>
                )}

                {/* Message bubble with reply button */}
                <div
                    className="flex items-center gap-1 transition-transform duration-100"
                    style={{ transform: `translateX(${swipeX}px)` }}
                >
                    {/* Reply button - appears on hover (desktop) */}
                    {!isMe && onReply && (
                        <button
                            onClick={onReply}
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center hidden md:flex"
                        >
                            <Reply className="w-4 h-4 text-gray-500" />
                        </button>
                    )}

                    <div className={`min-w-[60px] px-3 py-2 rounded-2xl shadow-sm overflow-hidden ${isMe
                        ? 'bg-[#dcf8c6] rounded-bl-sm'
                        : 'bg-white rounded-br-sm'
                        }`}>
                        {/* Quoted message - with image thumbnail */}
                        {msg.replyTo && (
                            <div className="mb-2 p-2 bg-black/5 rounded-lg border-r-2 border-primary overflow-hidden max-w-full flex items-center gap-2">
                                {/* Show thumbnail if it's an image */}
                                {(msg.replyTo.content?.startsWith('http') &&
                                    (msg.replyTo.content.length > 50 ||
                                        /\.(gif|jpg|jpeg|png|webp|svg)/i.test(msg.replyTo.content))) && (
                                        <img
                                            src={msg.replyTo.content}
                                            alt="صورة"
                                            className="w-8 h-8 rounded object-cover flex-shrink-0"
                                        />
                                    )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-primary font-bold truncate">{msg.replyTo.senderName || 'مستخدم'}</p>
                                    <p className="text-[11px] text-gray-600 truncate">
                                        {(msg.replyTo.content?.startsWith('http') &&
                                            (msg.replyTo.content.length > 50 ||
                                                /\.(gif|jpg|jpeg|png|webp|svg)/i.test(msg.replyTo.content)))
                                            ? '📷 صورة'
                                            : msg.replyTo.content}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Check if content is an image URL */}
                        {msg.type === 'image' || msg.type === 'sticker' ||
                            /\.(gif|jpg|jpeg|png|webp)/i.test(msg.content.trim()) ||
                            msg.content.includes('giphy.com') ||
                            msg.content.includes('jsdelivr.net') ||
                            msg.content.includes('twemoji') ||
                            msg.content.includes('zobj.net') ||
                            msg.content.includes('supabase.co/storage') ? (
                            <div className="rounded-lg overflow-hidden my-1 cursor-pointer" onClick={() => window.open(msg.content.trim(), '_blank')}>
                                <img
                                    src={msg.content.trim()}
                                    alt="img"
                                    className={`h-auto object-contain ${msg.content.includes('zobj.net') || msg.content.includes('twemoji') || msg.content.includes('jsdelivr.net')
                                        ? 'w-20 max-h-20' // Stickers/Emojis: small (80px)
                                        : 'w-full max-h-[200px]' // Regular images
                                        }`}
                                    loading="lazy"
                                />
                            </div>
                        ) : (
                            <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap break-all" dir="auto">{msg.content}</p>
                        )}
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                {new Date(msg.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                                msg.read ? <CheckCheck className="w-3.5 h-3.5 text-blue-500" /> : <Check className="w-3.5 h-3.5 text-gray-400" />
                            )}
                        </div>
                    </div>

                    {/* Reply button for own messages (desktop) */}
                    {isMe && onReply && (
                        <button
                            onClick={onReply}
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full hover:bg-gray-200 flex items-center justify-center hidden md:flex"
                        >
                            <Reply className="w-4 h-4 text-gray-500" />
                        </button>
                    )}

                    {/* Delete button for owners/specialists */}
                    {canHide && onHide && (
                        <button
                            onClick={onHide}
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full hover:bg-red-100 flex items-center justify-center hidden md:flex"
                            title="إخفاء الرسالة"
                        >
                            <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
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
