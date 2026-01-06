"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    Search,
    User,
    Users,
    Trash2,
    Loader2,
    MessageCircle,
    MoreVertical,
    CheckCircle2,
    XCircle
} from "lucide-react";
import Header from "@/components/layout/Header";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Conversation {
    id: string; // Group ID or User ID (for DM)
    name: string;
    subtitle?: string;
    avatar?: string;
    type: 'group' | 'direct';
    created_at: string;
    member_count?: number;
}

interface Message {
    id: string;
    content: string;
    created_at: string;
    sender: {
        id: string;
        nickname: string;
        avatar?: string;
    };
}

export default function MessagesManagement() {
    const router = useRouter();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [search, setSearch] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const user = JSON.parse(storedUser);
        if (user.role !== 'owner' && user.role !== 'admin') {
            router.push('/admin');
            return;
        }
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat);
        }
    }, [selectedChat]);

    const fetchConversations = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/conversations`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                toast.error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setTimeout(() => router.push('/login'), 2000);
                return;
            }

            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);
            }
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (chat: Conversation) => {
        setMessagesLoading(true);
        try {
            const token = localStorage.getItem('token');
            let url = `${API_URL}/api/admin/messages?limit=100`;

            if (chat.type === 'group') {
                url += `&courseId=${chat.id}`;
            } else {
                url += `&userId=${chat.id}`;
            }

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.status === 401) {
                toast.error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setTimeout(() => router.push('/login'), 2000);
                return;
            }

            if (res.ok) {
                const data = await res.json();
                setMessages((data.messages || []).reverse()); // Make chronological
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error('Failed to messages:', error);
        } finally {
            setMessagesLoading(false);
        }
    };

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteChat = async () => {
        if (!selectedChat) return;
        if (!confirm('هل أنت متأكد من إنهاء/حذف هذه المحادثة؟')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/conversations/${selectedChat.id}?type=${selectedChat.type}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('تم حذف المحادثة بنجاح');
                setConversations(conversations.filter(c => c.id !== selectedChat.id));
                setSelectedChat(null);
                setMessages([]);
            } else {
                toast.error('فشل في حذف المحادثة');
            }
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.subtitle?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="bg-warm-mesh min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-warm-mesh flex flex-col" dir="rtl">
            <Header />

            <main className="flex-grow pt-24 pb-6 px-4 md:px-6 h-[calc(100vh-24px)] flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => router.push('/admin')} className="p-2 hover:bg-black/5 rounded-full">
                        <ArrowRight className="w-5 h-5 text-foreground" />
                    </button>
                    <h1 className="text-2xl font-bold text-foreground">إدارة المحادثات</h1>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 flex-grow flex overflow-hidden">

                    {/* Sidebar */}
                    <div className="w-full md:w-80 lg:w-96 border-l border-gray-100 flex flex-col bg-white/50">
                        <div className="p-4 border-b border-gray-100">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="بحث في المحادثات..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-4 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                                <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto p-2 space-y-1">
                            {filteredConversations.map(chat => (
                                <button
                                    key={`${chat.type}-${chat.id}`}
                                    onClick={() => setSelectedChat(chat)}
                                    className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition-all ${selectedChat?.id === chat.id
                                        ? 'bg-primary/10 border-primary/20'
                                        : 'hover:bg-gray-50 border-transparent'
                                        } border`}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-sm ${chat.type === 'group' ? 'bg-indigo-100 text-indigo-600' : 'bg-pink-100 text-pink-600'
                                        }`}>
                                        {chat.avatar ? (
                                            <img src={chat.avatar} alt={chat.name} className="w-full h-full rounded-full object-cover" />
                                        ) : chat.type === 'group' ? <Users className="w-6 h-6" /> : <User className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h3 className="font-bold text-gray-900 truncate">{chat.name}</h3>
                                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                                {chat.type === 'group' ? 'مجموعة' : 'خاص'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 truncate">{chat.subtitle || 'لا توجد رسائل'}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="flex-grow flex flex-col bg-slate-50/50">
                        {selectedChat ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between shadow-sm z-10">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedChat.type === 'group' ? 'bg-indigo-100 text-indigo-600' : 'bg-pink-100 text-pink-600'
                                            }`}>
                                            {selectedChat.type === 'group' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-gray-900">{selectedChat.name}</h2>
                                            <p className="text-xs text-gray-500">
                                                {selectedChat.type === 'group' ? `${selectedChat.member_count} عضو` : 'محادثة خاصة'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            // onClick={handleDeleteChat}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="إنهاء المحادثة"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Messages */}
                                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                                    {messagesLoading ? (
                                        <div className="h-full flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                            <MessageCircle className="w-12 h-12 mb-2 opacity-20" />
                                            <p>لا توجد رسائل</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div key={msg.id} className={`flex gap-3 ${msg.sender.id === 'system' ? 'justify-center' : ''}`}>
                                                {msg.sender.id !== 'system' && (
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center font-bold text-xs text-gray-600 mt-1">
                                                        {msg.sender.nickname[0]}
                                                    </div>
                                                )}
                                                <div className={`max-w-[70%] rounded-2xl p-3 text-sm ${msg.sender.id === 'system'
                                                    ? 'bg-gray-200 text-gray-600 text-center text-xs px-4 py-1'
                                                    : 'bg-white border border-gray-100 shadow-sm'
                                                    }`}>
                                                    {msg.sender.id !== 'system' && (
                                                        <p className="text-xs font-bold text-primary mb-1">{msg.sender.nickname}</p>
                                                    )}
                                                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                    <p className="text-[10px] text-gray-400 mt-1 text-left">
                                                        {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={chatEndRef} />
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                <MessageCircle className="w-24 h-24 mb-4" />
                                <h3 className="text-xl font-bold">اختر محادثة لعرضها</h3>
                                <p>بإمكانك مراقبة جميع المحادثات من هنا</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

