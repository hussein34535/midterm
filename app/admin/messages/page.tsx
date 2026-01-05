"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    MessageCircle,
    Trash2,
    Loader2,
    Search,
    Filter,
    User,
    Image as ImageIcon
} from "lucide-react";
import Header from "@/components/layout/Header";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Message {
    id: string;
    content: string;
    type?: string;
    created_at: string;
    course_id?: string;
    receiver_id?: string;
    sender: {
        id: string;
        nickname: string;
        avatar?: string;
    };
}

export default function MessagesManagement() {
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [search, setSearch] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const user = JSON.parse(storedUser);
        if (user.role !== 'owner' && user.role !== 'admin') {
            router.push('/dashboard');
            return;
        }
        fetchMessages();
    }, [filter]);

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/messages?type=${filter}&limit=200`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (messageId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return;

        setDeleting(messageId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/messages/${messageId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('تم حذف الرسالة');
                setMessages(messages.filter(m => m.id !== messageId));
            } else {
                const data = await res.json();
                toast.error(data.error || 'حدث خطأ');
            }
        } catch (error) {
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setDeleting(null);
        }
    };

    const isImageMessage = (content: string) => {
        return content?.startsWith('http') && (
            content.length > 50 ||
            /\.(gif|jpg|jpeg|png|webp|svg)/i.test(content)
        );
    };

    const filteredMessages = messages.filter(msg =>
        !search || msg.content?.toLowerCase().includes(search.toLowerCase()) ||
        msg.sender?.nickname?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-6 pt-24">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">إدارة الرسائل</h1>
                        <p className="text-gray-500">عرض وحذف الرسائل</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                        <p className="text-2xl font-bold text-blue-600">{messages.length}</p>
                        <p className="text-xs text-gray-500">إجمالي الرسائل</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                        <p className="text-2xl font-bold text-green-600">{messages.filter(m => m.course_id).length}</p>
                        <p className="text-xs text-gray-500">رسائل جماعية</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                        <p className="text-2xl font-bold text-purple-600">{messages.filter(m => !m.course_id).length}</p>
                        <p className="text-xs text-gray-500">رسائل خاصة</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl p-4 shadow-sm mb-6 space-y-3">
                    <div className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="ابحث في الرسائل..."
                            className="flex-1 border-0 bg-transparent focus:ring-0 text-sm outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-400" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="flex-1 border-0 bg-transparent focus:ring-0 text-sm"
                        >
                            <option value="all">الكل</option>
                            <option value="group">رسائل جماعية</option>
                            <option value="direct">رسائل خاصة</option>
                        </select>
                    </div>
                </div>

                {/* Messages List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredMessages.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center">
                        <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">لا توجد رسائل</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredMessages.map((msg) => (
                            <div key={msg.id} className="bg-white rounded-xl p-4 shadow-sm flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {msg.sender?.avatar ? (
                                        <img src={msg.sender.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5 text-gray-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-sm">{msg.sender?.nickname || 'مستخدم'}</span>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                            {new Date(msg.created_at).toLocaleDateString('ar-EG', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="mt-1">
                                        {isImageMessage(msg.content) ? (
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <ImageIcon className="w-4 h-4" />
                                                <span>صورة</span>
                                                <img src={msg.content} alt="" className="w-12 h-12 rounded object-cover" />
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-700 line-clamp-2">{msg.content}</p>
                                        )}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${msg.course_id ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                            {msg.course_id ? 'جماعي' : 'خاص'}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(msg.id)}
                                    disabled={deleting === msg.id}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    {deleting === msg.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
