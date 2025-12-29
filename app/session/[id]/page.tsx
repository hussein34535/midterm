"use client";

import { useState, use } from "react";
import Link from "next/link";
import {
    Mic,
    MicOff,
    Volume2,
    VolumeX,
    LogOut,
    Hand,
    AlertCircle,
    MessageCircle,
    Users,
    Clock,
    Send,
    Wand2,
    Sparkles
} from "lucide-react";

interface PageProps {
    params: Promise<{ id: string }>;
}

// Mock participants
const participants = [
    { id: 1, nickname: "نجمة", isSpeaking: true, isMuted: false, isSpecialist: false },
    { id: 2, nickname: "قمر", isSpeaking: false, isMuted: true, isSpecialist: false },
    { id: 3, nickname: "أمل", isSpeaking: false, isMuted: false, isSpecialist: false },
    { id: 4, nickname: "صباح", isSpeaking: true, isMuted: false, isSpecialist: false },
    { id: 5, nickname: "ورد", isSpeaking: false, isMuted: true, isSpecialist: false },
    { id: 6, nickname: "نسيم", isSpeaking: false, isMuted: false, isSpecialist: false },
    { id: 7, nickname: "د. أمل", isSpeaking: true, isMuted: false, isSpecialist: true },
    { id: 8, nickname: "فجر", isSpeaking: false, isMuted: false, isSpecialist: false },
];

// Mock chat messages
const initialMessages = [
    { id: 1, sender: "د. أمل", message: "مرحباً بالجميع في الجلسة 📍", isAnnouncement: true, time: "20:00" },
    { id: 2, sender: "د. أمل", message: "ثيم اليوم: التعبير عن المشاعر", isAnnouncement: true, time: "20:01" },
    { id: 3, sender: "نجمة", message: "مساء الخير 💜", isAnnouncement: false, time: "20:02" },
];

export default function SessionPage({ params }: PageProps) {
    const { id } = use(params);
    const [isMuted, setIsMuted] = useState(true);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [voiceChanger, setVoiceChanger] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [showChat, setShowChat] = useState(true);
    const [messages, setMessages] = useState(initialMessages);
    const [newMessage, setNewMessage] = useState("");

    const sessionTime = "45:23";

    const sendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        setMessages([...messages, {
            id: messages.length + 1,
            sender: "نجمة",
            message: newMessage,
            isAnnouncement: false,
            time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
        }]);
        setNewMessage("");
    };

    return (
        <div className="bg-warm-mesh min-h-screen flex flex-col" dir="rtl">
            {/* Header */}
            <header className="bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 sticky top-0 z-50">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="text-white font-bold">3</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                                الجلسة 3: التعبير عن المشاعر
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 animate-pulse">
                                    مباشر
                                </span>
                            </h1>
                            <p className="text-sm text-muted-foreground">التعامل مع القلق</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-2 text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg">
                            <Clock className="w-4 h-4 text-primary" />
                            <span className="font-mono font-medium">{sessionTime}</span>
                        </div>
                        <div className="hidden md:flex items-center gap-2 text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg">
                            <Users className="w-4 h-4 text-primary" />
                            <span>{participants.length}</span>
                        </div>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-destructive hover:bg-destructive/10 px-4 py-2 rounded-xl transition-colors font-medium"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="hidden md:inline">خروج</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Participants Grid */}
                <div className="flex-1 p-6 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
                        {participants.map((participant) => (
                            <div
                                key={participant.id}
                                className={`card-love p-6 flex flex-col items-center gap-4 relative transition-all duration-300 ${participant.isSpeaking ? "ring-2 ring-primary shadow-lg shadow-primary/20 scale-105" : "hover:border-primary/30"
                                    }`}
                            >
                                {/* Avatar */}
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl relative transition-all ${participant.isSpecialist
                                    ? "bg-gradient-to-br from-primary to-primary/60 text-white shadow-lg"
                                    : "bg-secondary text-foreground"
                                    }`}>
                                    {participant.isSpecialist ? "⭐" : "👤"}

                                    {/* Speaking indicator */}
                                    {participant.isSpeaking && (
                                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
                                        </span>
                                    )}
                                </div>

                                <div className="text-center">
                                    <h3 className={`font-bold ${participant.isSpecialist ? "text-primary" : "text-foreground"}`}>
                                        {participant.nickname}
                                    </h3>
                                    {participant.isSpecialist && <span className="text-xs text-muted-foreground">أخصائي</span>}
                                </div>

                                {/* Muted badge */}
                                {participant.isMuted && (
                                    <span className="absolute top-3 left-3 bg-destructive/10 p-1.5 rounded-full">
                                        <MicOff className="w-3 h-3 text-destructive" />
                                    </span>
                                )}

                                {/* Speaking waves */}
                                {participant.isSpeaking && !participant.isMuted && (
                                    <div className="flex items-center gap-1 h-4">
                                        <div className="w-1 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-1 h-4 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-1 h-3 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        <div className="w-1 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "450ms" }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Sidebar */}
                {showChat && (
                    <div className="w-80 border-r border-l border-border bg-background/50 backdrop-blur-sm flex flex-col shadow-xl z-20 animate-in slide-in-from-left duration-300">
                        <div className="p-4 border-b border-border bg-background/80">
                            <h2 className="font-bold text-foreground flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-primary" />
                                المحادثة
                            </h2>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`rounded-2xl p-3 max-w-[90%] ${msg.isAnnouncement
                                        ? "bg-primary/5 border border-primary/20 mx-auto w-full text-center"
                                        : msg.sender === "نجمة"
                                            ? "bg-primary text-primary-foreground mr-auto rounded-tl-none"
                                            : "bg-secondary text-foreground ml-auto rounded-tr-none"}`}
                                >
                                    {!msg.isAnnouncement && (
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold ${msg.sender === "نجمة" ? "text-white/90" : "text-primary"}`}>
                                                {msg.sender}
                                            </span>
                                            <span className={`text-[10px] ${msg.sender === "نجمة" ? "text-white/70" : "text-muted-foreground"}`}>{msg.time}</span>
                                        </div>
                                    )}
                                    <p className={`text-sm ${msg.isAnnouncement ? "text-primary font-medium" : ""}`}>{msg.message}</p>
                                </div>
                            ))}
                        </div>

                        {/* Message Input */}
                        <div className="p-4 border-t border-border bg-background/80 absolute bottom-[90px] w-full md:relative md:bottom-0">
                            <form onSubmit={sendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="اكتب رسالة..."
                                    className="flex-1 bg-secondary/50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground"
                                />
                                <button type="submit" className="btn-primary p-3 rounded-xl shadow-none">
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="bg-background/80 backdrop-blur-md border-t border-border p-4 md:p-6 sticky bottom-0 z-50">
                <div className="container mx-auto flex items-center justify-center gap-3 md:gap-6">
                    {/* Mic */}
                    <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isMuted
                            ? "bg-destructive text-white hover:bg-destructive/90 shadow-destructive/20"
                            : "bg-green-500 text-white hover:bg-green-600 shadow-green-500/20"
                            }`}
                    >
                        {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </button>

                    {/* Speaker */}
                    <button
                        onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isSpeakerOn
                            ? "bg-secondary text-foreground hover:bg-secondary/80"
                            : "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border border-yellow-500/20"
                            }`}
                    >
                        {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>

                    {/* Voice Changer */}
                    <button
                        onClick={() => setVoiceChanger(!voiceChanger)}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${voiceChanger
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "bg-secondary text-foreground hover:bg-secondary/80"
                            }`}
                        title="تغيير الصوت"
                    >
                        <Wand2 className="w-5 h-5" />
                    </button>

                    {/* Raise Hand */}
                    <button
                        onClick={() => setHandRaised(!handRaised)}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${handRaised
                            ? "bg-yellow-400 text-white shadow-lg shadow-yellow-400/20 animate-bounce"
                            : "bg-secondary text-foreground hover:bg-secondary/80"
                            }`}
                        title="رفع اليد"
                    >
                        <Hand className="w-5 h-5" />
                    </button>

                    {/* Chat Toggle */}
                    <button
                        onClick={() => setShowChat(!showChat)}
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${showChat
                            ? "bg-primary text-white shadow-lg shadow-primary/20"
                            : "bg-secondary text-foreground hover:bg-secondary/80"
                            }`}
                    >
                        <MessageCircle className="w-5 h-5" />
                    </button>

                    {/* Emergency Exit */}
                    <button
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-destructive/10 hover:bg-destructive hover:text-white text-destructive flex items-center justify-center transition-all group ml-2 md:ml-4"
                        title="خروج سريع"
                    >
                        <AlertCircle className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
