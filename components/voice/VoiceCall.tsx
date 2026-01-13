"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff, Phone, Loader2, Users, Clock, AlertTriangle, MessageCircle, Mail } from "lucide-react";
import ParticipantsList from "./ParticipantsList";
import ChatBox from "./ChatBox";
import { io } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "19d2ae52aa924cc48c65e996affd8560";

interface VoiceCallProps {
    channelName: string;
    groupId?: string;
    onEndCall?: () => void;
    userName?: string;
    userAvatar?: string;
    userRole?: string;
    className?: string;
}

export default function VoiceCall({
    channelName,
    groupId,
    onEndCall,
    userName = "مستخدم",
    userAvatar,
    userRole = 'user',
    className = ""
}: VoiceCallProps) {
    const [isJoined, setIsJoined] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isForceMuted, setIsForceMuted] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
    const [callDuration, setCallDuration] = useState(0);
    const [agoraLoaded, setAgoraLoaded] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);

    const clientRef = useRef<any>(null);
    const audioTrackRef = useRef<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const AgoraRTCRef = useRef<any>(null);
    const myUidRef = useRef<string>('');
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastProcessedRef = useRef<number>(0);
    const socketRef = useRef<any>(null);
    const [participatingUsers, setParticipatingUsers] = useState<{ socketId: string; name: string; avatar: string | null; agoraUid: string | null }[]>([]);
    const [socketConnected, setSocketConnected] = useState(false);
    const [chatMessages, setChatMessages] = useState<any[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isNotifying, setIsNotifying] = useState(false);

    const canControl = userRole === 'specialist' || userRole === 'owner';

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 4000);
    };

    // Initialize Agora
    useEffect(() => {
        const loadAgora = async () => {
            try {
                const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
                AgoraRTCRef.current = AgoraRTC;

                const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
                clientRef.current = client;

                client.on("user-published", async (user: any, mediaType: "audio" | "video") => {
                    await client.subscribe(user, mediaType);
                    if (mediaType === "audio") {
                        user.audioTrack?.play();
                    }
                    setRemoteUsers(prev => {
                        if (prev.find(u => u.uid === user.uid)) return prev;
                        return [...prev, user];
                    });
                });

                client.on("user-unpublished", (user: any) => {
                    setRemoteUsers((prev) => prev.map(u => u.uid === user.uid ? user : u));
                });

                client.on("user-left", (user: any) => {
                    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
                });

                setAgoraLoaded(true);
            } catch (error) {
                console.error("Failed to load Agora SDK:", error);
            }
        };

        loadAgora();

        return () => {
            leaveChannel(false);
        };
    }, []);

    // Socket.io Connection & Events
    useEffect(() => {
        if (!channelName) return;

        // Initialize socket if not exists
        if (!socketRef.current) {
            const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            console.log("🔌 Connecting to Socket.io at:", SOCKET_URL);
            socketRef.current = io(SOCKET_URL);
        }

        const socket = socketRef.current;

        const handleConnect = () => {
            console.log("🔌 Socket Connected:", socket.id);
            setSocketConnected(true);
            // Send user info when joining room
            socket.emit("join-room", {
                roomId: `iwaa-mod-${channelName}`,
                name: userName,
                avatar: userAvatar || null,
                agoraUid: myUidRef.current || null
            });
        };

        socket.on("connect", handleConnect);

        if (socket.connected) {
            handleConnect();
        }

        socket.on("disconnect", () => {
            console.log("❌ Socket Disconnected");
            setSocketConnected(false);
        });

        socket.on("connect_error", (err: any) => {
            console.error("Socket Connection Error:", err);
            setSocketConnected(false);
        });

        // Listen for participants update (Pre-join Preview)
        socket.on("room-users-update", (users: any[]) => {
            console.log("👥 Room users updated:", users);
            setParticipatingUsers(users);
        });

        // Listen for chat messages
        socket.on("chat-message", (msg: any) => {
            console.log("💬 Chat message received:", msg);
            setChatMessages(prev => [...prev, { ...msg, isMe: msg.sender.name === userName }]);
        });

        socket.on("moderation-event", (data: any) => {
            const { action, targetUid, fromName } = data;
            const myUid = myUidRef.current; // Read current ref value

            console.log(`[Socket Debug] INCOMING EVENT:`, data);
            console.log(`[Socket Debug] Target: '${targetUid}' (Type: ${typeof targetUid}) | Me: '${myUid}' (Type: ${typeof myUid})`);

            // Normalize both to strings for comparison
            if (String(targetUid).trim() !== String(myUid).trim()) {
                console.log(`[Socket Debug] ❌ Ignoring event. Target '${targetUid}' != My UID '${myUid}'`);
                return;
            }

            console.log("✅ Applying moderation action:", action);

            switch (action) {
                case 'mute':
                    setIsForceMuted(true);
                    if (audioTrackRef.current) {
                        try {
                            audioTrackRef.current.setEnabled(false);
                            console.log("Track disabled successfully");
                        } catch (e) {
                            console.error("Failed to disable track:", e);
                        }
                    } else {
                        console.warn("No audio track found to mute");
                    }
                    showNotification(`🔇 تم كتمك من قبل ${fromName || 'الأخصائي'}`);
                    break;

                case 'unmute':
                    setIsForceMuted(false);
                    if (audioTrackRef.current) {
                        audioTrackRef.current.setEnabled(true);
                    }
                    showNotification('🔊 تم إلغاء كتمك');
                    break;

                case 'kick':
                    showNotification('⚠️ تم إخراجك من الجلسة');
                    setTimeout(() => leaveChannel(true), 2000);
                    break;
            }
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [channelName]);

    // Send moderation action via Socket.io
    const sendModerationAction = (targetUid: string | number, action: string) => {
        // Auto-reconnect if needed
        if (!socketRef.current) {
            const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            socketRef.current = io(SOCKET_URL);
            socketRef.current.emit("join-room", `iwaa-mod-${channelName}`);
        }

        const data = {
            action,
            targetUid: String(targetUid),
            fromUid: myUidRef.current,
            fromName: userName,
            channelName: `iwaa-mod-${channelName}`
        };

        // Emit to backend
        socketRef.current.emit("moderation-action", data);
        console.log("Sent moderation (socket):", action, "to UID:", targetUid);

        showNotification(
            action === 'mute' ? '🔇 تم كتم المستخدم' :
                action === 'unmute' ? '🔊 تم إلغاء كتم المستخدم' :
                    '👋 تم طرد المستخدم'
        );
    };

    // Send chat message via Socket.io
    const sendChatMessage = (message: string) => {
        if (!socketRef.current || !message.trim()) return;

        socketRef.current.emit("chat-message", {
            roomId: `iwaa-mod-${channelName}`,
            message: message.trim(),
            sender: {
                name: userName,
                avatar: userAvatar || null,
                agoraUid: myUidRef.current
            }
        });
    };

    // Call duration timer
    useEffect(() => {
        if (isJoined) {
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isJoined]);

    const formatDuration = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const joinChannel = async () => {
        if (!clientRef.current || !AgoraRTCRef.current) {
            alert("جاري تحميل نظام الصوت...");
            return;
        }

        setIsConnecting(true);
        try {
            // Get token from backend
            const token = localStorage.getItem('token');
            const uid = Math.floor(Math.random() * 100000);

            const tokenRes = await fetch(`${API_URL}/api/agora/token?channelName=${channelName}&uid=${uid}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!tokenRes.ok) {
                throw new Error('Failed to get Agora token');
            }

            const tokenData = await tokenRes.json();
            console.log('Got Agora token:', tokenData);

            const audioTrack = await AgoraRTCRef.current.createMicrophoneAudioTrack();
            audioTrackRef.current = audioTrack;

            await clientRef.current.join(tokenData.appId || APP_ID, channelName, tokenData.token, uid);

            const actualUid = clientRef.current.uid;
            myUidRef.current = String(actualUid);
            lastProcessedRef.current = Date.now(); // Ignore old messages
            console.log("Joined with UID:", actualUid);

            await clientRef.current.publish([audioTrack]);

            setIsJoined(true);
            setCallDuration(0);
            sessionStorage.setItem(`iwaa_call_active_${channelName}`, 'true');

            // Restore mute state if exists
            const wasMuted = sessionStorage.getItem(`iwaa_is_muted_${channelName}`) === 'true';
            if (wasMuted) {
                audioTrack.setEnabled(false);
                setIsMuted(true);
            }
        } catch (error: any) {
            console.error("Error joining channel:", error);
            if (error.message?.includes("Permission denied") || error.code === "PERMISSION_DENIED") {
                alert("يرجى السماح بالوصول للميكروفون من المتصفح");
            } else if (error.message?.includes("token")) {
                alert("حدث خطأ في الحصول على صلاحيات المكالمة. تأكد من تسجيل الدخول.");
            } else {
                alert("حدث خطأ في الاتصال. تأكد من السماح بالميكروفون.");
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const leaveChannel = async (userInitiated: boolean = false) => {
        try {
            if (audioTrackRef.current) {
                audioTrackRef.current.close();
                audioTrackRef.current = null;
            }
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
            if (clientRef.current) {
                await clientRef.current.leave();
            }
        } catch (e) { }
        setIsJoined(false);
        setRemoteUsers([]);
        setCallDuration(0);
        setIsForceMuted(false);
        if (timerRef.current) clearInterval(timerRef.current);

        if (userInitiated) {
            sessionStorage.removeItem(`iwaa_call_active_${channelName}`);
            sessionStorage.removeItem(`iwaa_is_muted_${channelName}`);
            onEndCall?.();
        }
    };

    // Auto-rejoin on refresh
    useEffect(() => {
        if (agoraLoaded && !isJoined && !isConnecting) {
            const wasConnected = sessionStorage.getItem(`iwaa_call_active_${channelName}`);
            if (wasConnected === 'true') {
                console.log("Found active session flag, auto-rejoining...");
                // Set connecting true immediately to prevent button flash
                setIsConnecting(true);
                joinChannel();
            }
        }
    }, [agoraLoaded, channelName]);

    const toggleMute = () => {
        if (isForceMuted) {
            showNotification('🔇 لا يمكنك إلغاء الكتم - الأخصائي كتمك');
            return;
        }
        if (audioTrackRef.current) {
            const newMuteState = !isMuted;
            audioTrackRef.current.setEnabled(!newMuteState); // enabled = !muted
            setIsMuted(newMuteState);
            sessionStorage.setItem(`iwaa_is_muted_${channelName}`, String(newMuteState));
        }
    };



    const handleMuteUser = (uid: string | number, shouldMute: boolean) => {
        sendModerationAction(uid, shouldMute ? 'mute' : 'unmute');
    };

    const handleKickUser = (uid: string | number) => {
        sendModerationAction(uid, 'kick');
    };

    // Notify all group members about session start
    const notifySessionStart = async () => {
        if (!groupId || isNotifying) return;
        setIsNotifying(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/specialist/notify-session-start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ groupId, sessionTitle: channelName })
            });
            const data = await res.json();
            if (res.ok) {
                showNotification(`📧 تم إشعار ${data.sent} عضو`);
            } else {
                showNotification(data.error || 'حدث خطأ');
            }
        } catch (err) {
            showNotification('فشل الإرسال');
        } finally {
            setIsNotifying(false);
        }
    };

    if (!agoraLoaded) {
        return (
            <div className="bg-gradient-to-b from-background to-muted/30 rounded-3xl p-8 text-center max-w-lg mx-auto border border-border" dir="rtl">
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>جاري تحميل نظام الصوت...</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative bg-background/95 backdrop-blur-sm border border-border rounded-xl overflow-hidden ${className || 'p-6 md:p-8 max-w-lg mx-auto border border-border shadow-xl'}`} dir="rtl">


            {/* Notification Toast */}
            {notification && (
                <div className="absolute top-4 left-4 right-4 bg-foreground text-background px-4 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4 flex items-center gap-2 z-50">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span className="text-sm font-medium">{notification}</span>
                </div>
            )}

            {/* Force Muted Banner */}
            {isForceMuted && isJoined && (
                <div className="bg-red-500 text-white px-4 py-2 rounded-xl mb-4 text-center text-sm font-medium animate-pulse">
                    🔇 تم كتمك من قبل الأخصائي
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isJoined ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                    <span className="text-sm font-medium text-muted-foreground">
                        {isJoined ? 'متصل' : 'غير متصل'}
                    </span>
                </div>
                {isJoined && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{remoteUsers.length + 1}</span>
                        </div>
                        <div className="flex items-center gap-1 font-mono">
                            <Clock className="w-4 h-4" />
                            <span>{formatDuration(callDuration)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            {isJoined ? (
                <>
                    <ParticipantsList
                        remoteUsers={remoteUsers}
                        localUser={{
                            uid: myUidRef.current,
                            name: userName,
                            avatar: userAvatar
                        }}
                        isMuted={isMuted || isForceMuted}
                        isForceMuted={isForceMuted}
                        canControl={canControl}
                        localAudioTrack={audioTrackRef.current}
                        onMuteUser={handleMuteUser}
                        onKickUser={handleKickUser}
                    />

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4 mt-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        {/* Chat Button */}
                        <button
                            onClick={() => setIsChatOpen(true)}
                            className="w-14 h-14 rounded-full bg-secondary text-foreground flex items-center justify-center hover:bg-secondary/80 transition-all hover:scale-110 active:scale-95 shadow-lg btn-ripple relative"
                            title="الدردشة"
                        >
                            <MessageCircle className="w-6 h-6" />
                            {chatMessages.length > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">
                                    {chatMessages.length > 99 ? '99+' : chatMessages.length}
                                </span>
                            )}
                        </button>

                        {/* Notify Session Button - Specialist/Owner Only */}
                        {canControl && groupId && (
                            <button
                                onClick={notifySessionStart}
                                disabled={isNotifying}
                                className="w-14 h-14 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="إشعار الأعضاء بالجلسة"
                            >
                                {isNotifying ? <Loader2 className="w-6 h-6 animate-spin" /> : <Mail className="w-6 h-6" />}
                            </button>
                        )}

                        {/* Mute Button (Disabled if force muted) */}
                        <button
                            onClick={toggleMute}
                            disabled={isForceMuted}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl btn-ripple ${isMuted || isForceMuted
                                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white animate-mute glow-primary shadow-red-500/40 hover:shadow-red-500/60'
                                : 'bg-gradient-to-br from-secondary to-secondary/80 text-foreground hover:scale-110 hover:shadow-2xl shadow-secondary/30'
                                } ${isForceMuted ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                            title={isMuted ? "تشغيل الميكروفون" : "كتم الميكروفون"}
                        >
                            {isMuted || isForceMuted ? <MicOff className="w-7 h-7 animate-breathe" /> : <Mic className="w-7 h-7" />}
                        </button>

                        {/* End Call Button */}
                        <button
                            onClick={() => leaveChannel(true)}
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-xl shadow-red-500/40 hover:shadow-red-500/60 hover:scale-105 active:scale-95 btn-ripple"
                            title="إنهاء المكالمة"
                        >
                            <PhoneOff className="w-7 h-7" />
                        </button>
                    </div>

                    {/* Chat Overlay */}
                    <ChatBox
                        messages={chatMessages}
                        onSendMessage={sendChatMessage}
                        myName={userName}
                        isOpen={isChatOpen}
                        onClose={() => setIsChatOpen(false)}
                    />

                    {(isMuted || isForceMuted) && (
                        <div className="text-center mt-4 animate-slide-up">
                            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${isForceMuted ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground'}`}>
                                <MicOff className="w-4 h-4" />
                                {isForceMuted ? 'مكتوم من الأخصائي' : 'الميكروفون مغلق'}
                            </span>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-8">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <Phone className="w-10 h-10 text-primary" />
                    </div>

                    <h3 className="text-xl font-bold text-foreground mb-2">
                        {isConnecting ? 'جاري العودة للمكالمة...' : 'انضم للغرفة'}
                    </h3>

                    {/* Participants Preview */}
                    <div className="flex flex-col items-center gap-3 mb-6">
                        <span className="text-muted-foreground text-sm">المتواجدون الآن:</span>

                        {participatingUsers.length > 0 ? (
                            <div className="flex flex-col items-center gap-2">
                                {/* Avatar Stack */}
                                <div className="flex -space-x-3 rtl:space-x-reverse">
                                    {participatingUsers.slice(0, 5).map((user, idx) => (
                                        <div
                                            key={user.socketId}
                                            className="w-10 h-10 rounded-full border-2 border-background flex items-center justify-center bg-gradient-to-br from-primary/30 to-primary/60 overflow-hidden"
                                            style={user.avatar ? {
                                                backgroundImage: `url(${user.avatar})`,
                                                backgroundSize: 'cover',
                                                backgroundPosition: 'center'
                                            } : {}}
                                            title={user.name}
                                        >
                                            {!user.avatar && (
                                                <span className="text-sm font-bold text-primary">
                                                    {user.name.charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {participatingUsers.length > 5 && (
                                        <div className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                                            <span className="text-xs font-bold text-muted-foreground">+{participatingUsers.length - 5}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Names List */}
                                <p className="text-xs text-muted-foreground">
                                    {participatingUsers.slice(0, 3).map(u => u.name).join('، ')}
                                    {participatingUsers.length > 3 && ` و ${participatingUsers.length - 3} آخرين`}
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">لا يوجد أحد بعد</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={joinChannel}
                        disabled={isConnecting}
                        className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto transition-all shadow-xl
                            ${isConnecting ? 'bg-muted cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600 shadow-green-500/30 hover:scale-105'}
                        `}
                    >
                        {isConnecting ? (
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        ) : (
                            <Phone className="w-8 h-8" />
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
