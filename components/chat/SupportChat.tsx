"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, Loader2, X, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Message {
    id: string;
    content: string;
    sender_id: string;
    sender?: { nickname: string; avatar?: string };
    created_at: string;
    isLocal?: boolean;
}

export default function SupportChat() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [supportUser, setSupportUser] = useState<any>(null);
    const [hasShownWelcome, setHasShownWelcome] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) { }
        }
        // Check if welcome was already shown
        const welcomeShown = localStorage.getItem('support_welcome_shown');
        if (welcomeShown) {
            setHasShownWelcome(true);
        }
    }, []);

    useEffect(() => {
        if (isOpen && user) {
            fetchSupportInfo();
        }
    }, [isOpen, user]);

    useEffect(() => {
        if (supportUser?.id) {
            fetchMessages();
        }
    }, [supportUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Send automatic welcome message when first opening chat (only if no messages exist)
    useEffect(() => {
        if (isOpen && user && supportUser?.id && !loading && messages.length === 0 && !hasShownWelcome) {
            sendWelcomeMessage();
        }
    }, [isOpen, user, supportUser, loading, messages.length, hasShownWelcome]);

    const fetchSupportInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/messages/support`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setSupportUser(data.owner);
            }
        } catch (err) {
            console.error('Failed to get support:', err);
        }
    };

    const fetchMessages = async () => {
        if (!supportUser?.id) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/messages/${supportUser.id}`, {
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

    const sendWelcomeMessage = async () => {
        if (hasShownWelcome) return;

        // Mark as shown
        setHasShownWelcome(true);
        localStorage.setItem('support_welcome_shown', 'true');

        // Send automatic welcome message from user to support
        const welcomeContent = "مرحباً! أحتاج مساعدة 👋";

        const localMsg: Message = {
            id: `local-${Date.now()}`,
            content: welcomeContent,
            sender_id: user?.id || '',
            created_at: new Date().toISOString(),
            isLocal: true
        };
        setMessages(prev => [...prev, localMsg]);

        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/api/messages/${supportUser.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: welcomeContent })
            });
            fetchMessages();
        } catch (err) {
            console.error('Failed to send welcome:', err);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending || !supportUser?.id) return;

        // Add local message immediately
        const localMsg: Message = {
            id: `local-${Date.now()}`,
            content: newMessage.trim(),
            sender_id: user?.id || '',
            created_at: new Date().toISOString(),
            isLocal: true
        };
        setMessages(prev => [...prev, localMsg]);
        const msgContent = newMessage.trim();
        setNewMessage("");

        setSending(true);
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API_URL}/api/messages/${supportUser.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: msgContent })
            });
            fetchMessages();
        } catch (err) {
            toast.error('فشل إرسال الرسالة');
        } finally {
            setSending(false);
        }
    };

    // Render avatar helper
    const renderAvatar = (avatar: string | undefined, fallback: string) => {
        if (!avatar) {
            return (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm">
                    {fallback.charAt(0)}
                </div>
            );
        }
        if (avatar.includes('|')) {
            const [emoji, color] = avatar.split('|');
            return (
                <div className={`w-8 h-8 rounded-full ${color || 'bg-rose-100'} flex items-center justify-center text-lg`}>
                    {emoji}
                </div>
            );
        }
        if (avatar.startsWith('http')) {
            return <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover" />;
        }
        return (
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-lg">
                {avatar}
            </div>
        );
    };

    // For guests, show button but redirect to login when clicked
    const handleOpenChat = () => {
        if (!user) {
            // Guest: toggle the mini chat
            setIsOpen(!isOpen);
            return;
        }
        // Logged in user: go to messages page
        router.push('/messages');
    };

    // Navigate to messages page with support chat
    const handleGoToMessages = () => {
        setIsOpen(false);
        router.push('/messages?support=true');
    };

    // Don't show the floating button for logged-in users (they use bottom nav)
    if (user) return null;

    return (
        <>
            {/* Mobile Overlay - Only for guests when chat is open */}
            {isOpen && !user && (
                <div
                    className="md:hidden overlay-mobile"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Floating Help Button - Only for guests */}
            <button
                onClick={handleOpenChat}
                className={`fab-mobile touch-target-lg ${isOpen
                    ? 'bg-muted text-foreground shadow-lg'
                    : 'bg-gradient-to-br from-primary to-primary/80 text-white hover:shadow-2xl hover:scale-105'
                    }`}
                style={{
                    boxShadow: isOpen
                        ? '0 4px 20px rgba(0, 0, 0, 0.1)'
                        : '0 4px 25px rgba(var(--primary), 0.3), 0 0 50px rgba(var(--primary), 0.15)'
                }}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
            </button>

            {/* Chat Panel - For guests only */}
            {isOpen && (
                <div className={`
                    fixed z-50 bg-background flex flex-col overflow-hidden
                    /* Mobile: Bottom sheet full screen */
                    inset-x-0 bottom-0 h-[85vh] rounded-t-3xl
                    /* Desktop: Floating panel */
                    md:inset-auto md:bottom-24 md:right-6 md:w-96 md:h-[500px] md:rounded-2xl
                    shadow-2xl border border-border
                    animate-sheet-up md:animate-in md:fade-in md:slide-in-from-bottom-4
                `}>
                    {/* Drag Handle - Mobile only */}
                    <div className="md:hidden flex justify-center pt-3 pb-1">
                        <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
                    </div>

                    {/* Header */}
                    <div className="p-4 md:p-4 bg-gradient-to-r from-primary to-primary/80 text-white">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 md:w-10 md:h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6 md:w-5 md:h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-base md:text-sm">الدعم والمساعدة</h3>
                                    <p className="text-sm md:text-xs opacity-80">نحن هنا لمساعدتك</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Go to full messages button */}
                                <button
                                    onClick={handleGoToMessages}
                                    className="text-sm md:text-xs bg-white/20 hover:bg-white/30 px-4 py-2 md:px-3 md:py-1 rounded-full transition-colors touch-feedback"
                                >
                                    عرض الكل
                                </button>
                                {/* Close button - Mobile only */}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="md:hidden w-10 h-10 rounded-full bg-white/20 flex items-center justify-center touch-feedback"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-secondary/5 to-secondary/20 scrollbar-mobile">
                        {/* Static Welcome Message */}
                        {/* Welcome message for guests */}
                        <div className="text-center mb-4">
                            <div className="inline-block bg-white/80 backdrop-blur-sm text-muted-foreground text-sm px-4 py-3 rounded-2xl shadow-sm border border-border/50 max-w-[85%]">
                                مرحباً! 👋 كيف يمكننا مساعدتك اليوم؟
                            </div>
                        </div>

                        {/* Guest welcome content */}
                        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <HelpCircle className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">هل تحتاج مساعدة؟</h3>
                            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                                سجّل دخولك للتواصل معنا مباشرة والحصول على الدعم الفوري
                            </p>
                            <div className="flex flex-col gap-3 w-full max-w-xs">
                                <a
                                    href="/login"
                                    className="w-full py-3 px-6 bg-primary text-white rounded-xl font-bold text-center hover:bg-primary/90 transition-colors"
                                >
                                    تسجيل الدخول
                                </a>
                                <a
                                    href="/register"
                                    className="w-full py-3 px-6 bg-secondary text-foreground rounded-xl font-bold text-center hover:bg-secondary/80 transition-colors"
                                >
                                    إنشاء حساب جديد
                                </a>
                            </div>
                        </div>
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Info footer for guests */}
                    <div className="p-4 border-t border-border bg-background safe-area-bottom text-center">
                        <p className="text-sm text-muted-foreground">
                            لديك سؤال؟ راسلنا على <a href="mailto:support@eiwa.app" className="text-primary font-bold">support@eiwa.app</a>
                        </p>
                    </div>
                </div>
            )}
        </>
    );
}

