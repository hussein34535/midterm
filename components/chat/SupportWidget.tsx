"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, X, Loader2, User } from "lucide-react";
import { toast } from "sonner";

const GUEST_SESSION_KEY = 'iwaa_guest_chat';
const GUEST_LAST_SEEN_KEY = 'iwaa_guest_last_seen';
const GUEST_TOKEN_KEY = 'iwaa_guest_token';

export default function SupportWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState<'chat' | 'name-input' | 'live-chat'>('chat');
    const [messageInput, setMessageInput] = useState("");
    const [guestName, setGuestName] = useState("");
    const [guestToken, setGuestToken] = useState("");
    const [messages, setMessages] = useState<{ id: string, content: string, isMe: boolean, createdAt: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [pendingMessage, setPendingMessage] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Check for existing user or guest session on mount
    useEffect(() => {
        const checkUser = () => {
            const user = localStorage.getItem('user');
            if (user) {
                setIsLoggedIn(true);
                // Clear guest session when user logs in
                localStorage.removeItem(GUEST_SESSION_KEY);
                localStorage.removeItem(GUEST_LAST_SEEN_KEY);
                localStorage.removeItem(GUEST_TOKEN_KEY);

                // Clear state
                setGuestToken("");
                setGuestName("");
                setMessages([]);
                setStep('chat');
            }
        };

        checkUser();

        // Listen for login events
        window.addEventListener('user-login', checkUser);
        window.addEventListener('storage', checkUser);

        // Check for existing guest session
        const savedSession = localStorage.getItem(GUEST_SESSION_KEY);
        const savedToken = localStorage.getItem(GUEST_TOKEN_KEY);
        if (savedSession && savedToken) {
            try {
                const session = JSON.parse(savedSession);
                if (session.name) {
                    setGuestName(session.name);
                    setGuestToken(savedToken);
                    setStep('live-chat');
                }
            } catch { }
        }

        return () => {
            window.removeEventListener('user-login', checkUser);
            window.removeEventListener('storage', checkUser);
        };
    }, []);

    // Polling for messages when in live-chat OR when widget is closed (to check for new messages)
    useEffect(() => {
        let interval: NodeJS.Timeout;

        const fetchMessages = async () => {
            const token = guestToken || localStorage.getItem(GUEST_TOKEN_KEY);
            if (!token) return;

            try {
                const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                const res = await fetch(`${API_URL}/api/auth/guest-messages`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages);

                    // Check for unread messages (compare with last seen count)
                    const lastSeenCount = parseInt(localStorage.getItem(GUEST_LAST_SEEN_KEY) || '0');
                    const ownerMessages = data.messages.filter((m: any) => !m.isMe).length;

                    if (ownerMessages > lastSeenCount && !isOpen) {
                        setUnreadCount(ownerMessages - lastSeenCount);
                    }
                }
            } catch (error) {
                console.error('Polling error', error);
            }
        };

        // Only poll if guest has token
        const savedToken = guestToken || localStorage.getItem(GUEST_TOKEN_KEY);
        if (savedToken || step === 'live-chat') {
            fetchMessages();
            interval = setInterval(fetchMessages, 3000);
        }

        return () => clearInterval(interval);
    }, [step, isOpen, guestToken]);

    // When widget opens, mark messages as seen
    useEffect(() => {
        if (isOpen && messages.length > 0) {
            const ownerMessages = messages.filter(m => !m.isMe).length;
            localStorage.setItem(GUEST_LAST_SEEN_KEY, ownerMessages.toString());
            setUnreadCount(0);
        }
    }, [isOpen, messages]);

    // Scroll to bottom when messages change or widget opens
    useEffect(() => {
        if (messagesEndRef.current) {
            // Small delay to ensure DOM is rendered
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [messages, isOpen, step]);

    const handleInitialSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim()) return;
        setPendingMessage(messageInput);
        setMessageInput("");
        setStep('name-input');
    };

    const handleGuestSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName.trim() || !pendingMessage.trim()) return;

        setLoading(true);
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const existingToken = guestToken || localStorage.getItem(GUEST_TOKEN_KEY);
            const res = await fetch(`${API_URL}/api/auth/guest-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: guestName,
                    message: pendingMessage,
                    guestToken: existingToken || undefined
                })
            });

            if (res.ok) {
                const data = await res.json();
                // Save token for future messages
                if (data.token) {
                    localStorage.setItem(GUEST_TOKEN_KEY, data.token);
                    setGuestToken(data.token);
                }
                localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify({ name: guestName }));
                setPendingMessage("");
                setStep('live-chat');
            } else {
                const data = await res.json();
                toast.error(data.error || 'فشل الإرسال');
            }
        } catch (error) {
            console.error(error);
            toast.error('خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    const handleLiveSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        const content = messageInput;
        setMessageInput("");

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const token = guestToken || localStorage.getItem(GUEST_TOKEN_KEY);
            await fetch(`${API_URL}/api/auth/guest-message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: guestName,
                    message: content,
                    guestToken: token
                })
            });
        } catch (error) {
            console.error('Send error', error);
            toast.error('فشل الإرسال');
        }
    };

    // Hide widget if user is logged in with a real account
    if (isLoggedIn) {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-4" dir="rtl">
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-110 transition-transform animate-in zoom-in duration-300"
                >
                    <MessageCircle className="w-7 h-7" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse border-2 border-white">
                            {unreadCount}
                        </span>
                    )}
                </button>
            )}

            {isOpen && (
                <div className="w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="bg-primary p-4 flex items-center justify-between text-white">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <MessageCircle className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">الدعم الفني</h3>
                                <p className="text-[10px] text-white/80">نحن هنا لمساعدتك</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="h-80 bg-gray-50 flex flex-col">
                        {step === 'chat' ? (
                            <>
                                <div className="flex-1 p-4 overflow-y-auto">
                                    <div className="flex items-start gap-2 mb-4">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                                        </div>
                                        <div className="bg-white p-3 rounded-2xl rounded-tr-none shadow-sm text-sm text-gray-700 border border-gray-100">
                                            مرحباً بك في إيواء! 👋<br />كيف يمكننا مساعدتك اليوم؟
                                        </div>
                                    </div>
                                </div>
                                <form onSubmit={handleInitialSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="اكتب رسالتك..."
                                        className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                    />
                                    <button type="submit" disabled={!messageInput.trim()} className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-50">
                                        <Send className="w-4 h-4 rtl:rotate-180" />
                                    </button>
                                </form>
                            </>
                        ) : step === 'name-input' ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                    <User className="w-8 h-8" />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">لنتعرف عليك أولاً</h3>
                                <p className="text-sm text-gray-500 mb-6">يرجى كتابة اسمك لنتمكن من الرد عليك.</p>
                                <form onSubmit={handleGuestSend} className="w-full space-y-3">
                                    <input
                                        type="text"
                                        placeholder="اسمك"
                                        autoFocus
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary text-center"
                                        value={guestName}
                                        onChange={(e) => setGuestName(e.target.value)}
                                    />
                                    <button type="submit" disabled={loading || !guestName.trim()} className="btn-primary w-full justify-center py-3">
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إرسال'}
                                    </button>
                                </form>
                                <button onClick={() => setStep('chat')} className="mt-4 text-xs text-gray-400 hover:text-gray-600">رجوع</button>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                                    {messages.map((msg) => (
                                        <div key={msg.id} className={`flex items-start gap-2 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                                            {!msg.isMe && (
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                    <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                                                </div>
                                            )}
                                            <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${msg.isMe ? 'bg-primary text-white rounded-tl-none' : 'bg-white text-gray-700 border border-gray-100 rounded-tr-none shadow-sm'}`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                                <form onSubmit={handleLiveSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="اكتب رسالتك..."
                                        className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                    />
                                    <button type="submit" disabled={!messageInput.trim()} className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center disabled:opacity-50">
                                        <Send className="w-4 h-4 rtl:rotate-180" />
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
