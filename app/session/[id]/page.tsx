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
    Wand2
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
        <div className="bg-[var(--bg-dark)] min-h-screen flex flex-col">
            {/* Header */}
            <header className="glass-card border-t-0 border-l-0 border-r-0 rounded-none px-6 py-4">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
                            <span className="text-white font-bold">3</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-white">الجلسة 3: التعبير عن المشاعر</h1>
                            <p className="text-sm text-[var(--text-muted)]">التعامل مع القلق</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                            <Clock className="w-5 h-5" />
                            <span className="font-mono">{sessionTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                            <Users className="w-5 h-5" />
                            <span>{participants.length}</span>
                        </div>
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-[var(--error)] hover:bg-[var(--error)]/10 px-4 py-2 rounded-xl transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            خروج
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 flex">
                {/* Participants Grid */}
                <div className="flex-1 p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                        {participants.map((participant) => (
                            <div
                                key={participant.id}
                                className={`glass-card p-6 flex flex-col items-center gap-3 relative ${participant.isSpeaking ? "border-[var(--success)] animate-pulse-glow" : ""
                                    }`}
                            >
                                {/* Avatar */}
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl relative ${participant.isSpecialist
                                    ? "bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]"
                                    : "bg-[var(--bg-card)]"
                                    }`}>
                                    {participant.isSpecialist ? "⭐" : "👤"}
                                    {/* Speaking indicator */}
                                    {participant.isSpeaking && (
                                        <div className="absolute inset-0 rounded-full border-2 border-[var(--success)] animate-pulse-glow" />
                                    )}
                                </div>

                                {/* Nickname */}
                                <span className={`font-semibold ${participant.isSpecialist ? "text-[var(--primary)]" : "text-white"
                                    }`}>
                                    {participant.nickname}
                                </span>

                                {/* Muted badge */}
                                {participant.isMuted && (
                                    <span className="absolute top-3 left-3 bg-[var(--error)]/20 p-1.5 rounded-full">
                                        <MicOff className="w-4 h-4 text-[var(--error)]" />
                                    </span>
                                )}

                                {/* Speaking waves */}
                                {participant.isSpeaking && !participant.isMuted && (
                                    <div className="flex items-center gap-1">
                                        <div className="w-1 h-3 bg-[var(--success)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <div className="w-1 h-5 bg-[var(--success)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <div className="w-1 h-4 bg-[var(--success)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        <div className="w-1 h-3 bg-[var(--success)] rounded-full animate-bounce" style={{ animationDelay: "450ms" }} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Controls */}
                    <div className="fixed bottom-0 left-0 right-0 glass-card border-b-0 border-l-0 border-r-0 rounded-none p-6">
                        <div className="container mx-auto flex items-center justify-center gap-4">
                            {/* Mic */}
                            <button
                                onClick={() => setIsMuted(!isMuted)}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted
                                    ? "bg-[var(--error)] hover:bg-[var(--error)]/80"
                                    : "bg-[var(--success)] hover:bg-[var(--success)]/80"
                                    }`}
                            >
                                {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                            </button>

                            {/* Speaker */}
                            <button
                                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isSpeakerOn
                                    ? "bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]"
                                    : "bg-[var(--warning)] hover:bg-[var(--warning)]/80"
                                    }`}
                            >
                                {isSpeakerOn ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white" />}
                            </button>

                            {/* Voice Changer */}
                            <button
                                onClick={() => setVoiceChanger(!voiceChanger)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${voiceChanger
                                    ? "bg-[var(--primary)] hover:bg-[var(--primary-dark)]"
                                    : "bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]"
                                    }`}
                                title="تغيير الصوت"
                            >
                                <Wand2 className="w-5 h-5 text-white" />
                            </button>

                            {/* Raise Hand */}
                            <button
                                onClick={() => setHandRaised(!handRaised)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${handRaised
                                    ? "bg-[var(--warning)] hover:bg-[var(--warning)]/80"
                                    : "bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]"
                                    }`}
                                title="رفع اليد"
                            >
                                <Hand className="w-5 h-5 text-white" />
                            </button>

                            {/* Chat Toggle */}
                            <button
                                onClick={() => setShowChat(!showChat)}
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${showChat
                                    ? "bg-[var(--primary)] hover:bg-[var(--primary-dark)]"
                                    : "bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]"
                                    }`}
                            >
                                <MessageCircle className="w-5 h-5 text-white" />
                            </button>

                            {/* Emergency Exit */}
                            <button
                                className="w-12 h-12 rounded-full bg-[var(--error)]/20 hover:bg-[var(--error)] flex items-center justify-center transition-all group"
                                title="خروج سريع"
                            >
                                <AlertCircle className="w-5 h-5 text-[var(--error)] group-hover:text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Chat Sidebar */}
                {showChat && (
                    <div className="w-80 border-r border-[var(--glass-border)] bg-[var(--bg-darker)] flex flex-col">
                        <div className="p-4 border-b border-[var(--glass-border)]">
                            <h2 className="font-semibold text-white flex items-center gap-2">
                                <MessageCircle className="w-5 h-5 text-[var(--primary)]" />
                                المحادثة
                            </h2>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 mb-20">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`${msg.isAnnouncement ? "bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-xl p-3" : ""}`}
                                >
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-sm font-semibold ${msg.isAnnouncement ? "text-[var(--primary)]" : "text-[var(--secondary)]"
                                            }`}>
                                            {msg.sender}
                                        </span>
                                        <span className="text-xs text-[var(--text-muted)]">{msg.time}</span>
                                    </div>
                                    <p className="text-[var(--text-secondary)] text-sm">{msg.message}</p>
                                </div>
                            ))}
                        </div>

                        {/* Message Input */}
                        <form onSubmit={sendMessage} className="p-4 border-t border-[var(--glass-border)] mb-16">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="اكتب رسالة..."
                                    className="input-field flex-1 py-3 px-4 text-sm"
                                />
                                <button type="submit" className="btn-primary p-2">
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
