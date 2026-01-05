"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageCircle, X, Smile, Image as ImageIcon } from "lucide-react";

// Stickers
const STICKERS = [
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60a/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f618/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f917/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f970/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f44d/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.gif",
    "https://fonts.gstatic.com/s/e/notoemoji/latest/1f4aa/512.gif",
];

interface ChatMessage {
    id: string;
    message: string;
    sender: {
        name: string;
        avatar: string | null;
        agoraUid: string | null;
    };
    timestamp: string;
    isMe?: boolean;
}

interface ChatBoxProps {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    myName: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ChatBox({
    messages,
    onSendMessage,
    myName,
    isOpen,
    onClose
}: ChatBoxProps) {
    const [inputValue, setInputValue] = useState("");
    const [showStickers, setShowStickers] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);

    const handleSend = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        onSendMessage(trimmed);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleSendSticker = (stickerUrl: string) => {
        onSendMessage(stickerUrl);
        setShowStickers(false);
    };

    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    };

    const isImageOrSticker = (content: string) => {
        return content.startsWith('http') && (
            content.includes('.gif') ||
            content.includes('.png') ||
            content.includes('.jpg') ||
            content.includes('.jpeg') ||
            content.includes('notoemoji') ||
            content.includes('gstatic')
        );
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 bg-background z-50 flex flex-col rounded-xl overflow-hidden" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50 shrink-0">
                <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <span className="font-bold text-foreground">المحادثة</span>
                    <span className="text-xs text-muted-foreground">({messages.length})</span>
                </div>
                <button
                    onClick={onClose}
                    className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 transition-colors text-white shadow-lg"
                    title="إغلاق المحادثة"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageCircle className="w-12 h-12 mb-2 opacity-50" />
                        <p className="text-sm">لا توجد رسائل بعد</p>
                        <p className="text-xs">ابدأ المحادثة!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender.name === myName || msg.isMe;
                        const isImage = isImageOrSticker(msg.message);
                        return (
                            <div
                                key={msg.id}
                                className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                            >
                                {/* Avatar */}
                                <div
                                    className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/60 overflow-hidden"
                                    style={msg.sender.avatar ? {
                                        backgroundImage: `url(${msg.sender.avatar})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    } : {}}
                                >
                                    {!msg.sender.avatar && (
                                        <span className="text-xs font-bold text-primary">
                                            {msg.sender.name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    {isImage ? (
                                        <img
                                            src={msg.message}
                                            alt="sticker"
                                            className="w-20 h-20 object-contain rounded-xl"
                                        />
                                    ) : (
                                        <div className={`
                                            px-3 py-2 rounded-2xl
                                            ${isMe
                                                ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                : 'bg-muted text-foreground rounded-tl-sm'
                                            }
                                        `}>
                                            {!isMe && (
                                                <p className="text-xs font-bold mb-1 opacity-70">
                                                    {msg.sender.name}
                                                </p>
                                            )}
                                            <p className="text-sm break-words">{msg.message}</p>
                                        </div>
                                    )}
                                    <p className={`text-[10px] text-muted-foreground mt-1 ${isMe ? 'text-left' : 'text-right'}`}>
                                        {formatTime(msg.timestamp)}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Sticker Picker */}
            {showStickers && (
                <div className="p-3 border-t border-border bg-muted/50 shrink-0">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {STICKERS.map((sticker, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSendSticker(sticker)}
                                className="w-12 h-12 rounded-lg bg-background hover:bg-muted flex items-center justify-center transition-colors shrink-0"
                            >
                                <img src={sticker} alt="sticker" className="w-8 h-8" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="p-3 border-t border-border bg-muted/30 shrink-0">
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setShowStickers(!showStickers)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${showStickers ? 'bg-primary text-white' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}
                        title="الملصقات"
                    >
                        <Smile className="w-5 h-5" />
                    </button>
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="اكتب رسالتك..."
                        className="flex-1 min-w-0 px-4 py-2.5 rounded-full bg-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
