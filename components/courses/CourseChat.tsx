"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2, Users, X, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { renderAvatar } from "../settings/AvatarPicker";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Message {
    id: string;
    content: string;
    sender_id: string;
    sender?: { nickname: string; avatar?: string };
    created_at: string;
    type: string;
    is_system: boolean;
    image_url?: string;
}

interface CourseChatProps {
    courseId: string;
    courseTitle: string;
}

export default function CourseChat({ courseId, courseTitle }: CourseChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            setCurrentUser(JSON.parse(stored));
        }
    }, []);

    useEffect(() => {
        if (isOpen && currentUser) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        }
    }, [isOpen, currentUser, courseId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/messages/${courseId}?type=group`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages || []);
            }
        } catch (err) {
            console.error('Failed to fetch messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('حجم الصورة كبير جداً (الحد الأقصى 5MB)');
                return;
            }
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onload = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || sending) return;

        setSending(true);
        try {
            const token = localStorage.getItem('token');

            let imageUrl = null;

            // Upload image if selected
            if (selectedImage) {
                const formData = new FormData();
                formData.append('image', selectedImage);

                const uploadRes = await fetch(`${API_URL}/api/upload/image`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });

                if (uploadRes.ok) {
                    const uploadData = await uploadRes.json();
                    imageUrl = uploadData.url;
                } else {
                    toast.error('فشل رفع الصورة');
                    setSending(false);
                    return;
                }
            }

            const res = await fetch(`${API_URL}/api/messages/${courseId}?type=group`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: newMessage.trim() || (imageUrl ? '📷 صورة' : ''),
                    image_url: imageUrl
                })
            });

            if (res.ok) {
                setNewMessage("");
                clearImage();
                fetchMessages();
            } else {
                toast.error('فشل إرسال الرسالة');
            }
        } catch (err) {
            toast.error('حدث خطأ');
        } finally {
            setSending(false);
        }
    };

    if (!currentUser) return null;

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${isOpen
                    ? 'bg-muted text-foreground rotate-90'
                    : 'bg-primary text-white glow-primary animate-pulse-ring'
                    }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </button>

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-24 left-6 z-50 w-96 h-[500px] bg-background rounded-2xl shadow-2xl border border-border flex flex-col animate-slide-up overflow-hidden">
                    {/* Header */}
                    <div className="p-4 bg-primary text-white flex items-center gap-3">
                        <Users className="w-5 h-5" />
                        <div>
                            <h3 className="font-bold text-sm">شات الكورس</h3>
                            <p className="text-xs opacity-80">{courseTitle}</p>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/20">
                        {loading ? (
                            <div className="flex justify-center py-10">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">ابدأ المحادثة!</p>
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isMe = msg.sender_id === currentUser.id;
                                const isSystem = msg.is_system;

                                if (isSystem) {
                                    return (
                                        <div key={msg.id} className="text-center">
                                            <span className="inline-block bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                                                {msg.content}
                                            </span>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row' : 'flex-row-reverse'}`}>
                                        {/* Avatar */}
                                        <div className="flex-shrink-0">
                                            {renderAvatar(msg.sender?.avatar, 'sm')}
                                        </div>

                                        {/* Message Content */}
                                        <div className={`max-w-[75%]`}>
                                            {/* Sender Name */}
                                            <p className={`text-xs text-muted-foreground mb-1 ${isMe ? 'text-left' : 'text-right'}`}>
                                                {isMe ? 'أنت' : msg.sender?.nickname || 'مستخدم'}
                                            </p>

                                            {/* Bubble */}
                                            <div className={`px-4 py-2 rounded-2xl ${isMe
                                                ? 'bg-primary text-white rounded-tr-sm'
                                                : 'bg-white border border-border rounded-tl-sm'
                                                }`}>
                                                {/* Image */}
                                                {msg.image_url && (
                                                    <img
                                                        src={msg.image_url}
                                                        alt="صورة"
                                                        className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90"
                                                        onClick={() => window.open(msg.image_url, '_blank')}
                                                    />
                                                )}
                                                {msg.content && msg.content !== '📷 صورة' && (
                                                    <p className="text-sm">{msg.content}</p>
                                                )}
                                            </div>

                                            {/* Time */}
                                            <p className={`text-[10px] text-muted-foreground mt-1 ${isMe ? 'text-left' : 'text-right'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="p-2 bg-muted/50 border-t border-border flex items-center gap-2">
                            <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
                            <button
                                onClick={clearImage}
                                className="text-destructive hover:text-destructive/80"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* Input */}
                    <form onSubmit={sendMessage} className="p-3 border-t border-border bg-background flex gap-2">
                        {/* Image Upload Button */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors"
                        >
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </button>

                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="اكتب رسالتك..."
                            className="flex-1 px-4 py-2 rounded-full bg-secondary/50 border border-border text-sm focus:outline-none focus:border-primary"
                            dir="rtl"
                        />
                        <button
                            type="submit"
                            disabled={(!newMessage.trim() && !selectedImage) || sending}
                            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-transform"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
