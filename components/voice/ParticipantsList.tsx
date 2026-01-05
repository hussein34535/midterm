import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { useState, useEffect } from "react";
import { Mic, MicOff, Volume2, UserX, Shield } from "lucide-react";

interface ParticipantsListProps {
    remoteUsers: IAgoraRTCRemoteUser[];
    localUser: { uid: string | number; name: string; avatar?: string };
    isMuted: boolean;
    isForceMuted?: boolean;
    canControl?: boolean;
    localAudioTrack?: any;
    onMuteUser?: (uid: string | number, shouldMute: boolean) => void;
    onKickUser?: (uid: string | number) => void;
}

// Speaking detection hook
const useSpeakingDetection = (audioTrack: any, threshold: number = 0.35) => {
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        if (!audioTrack) {
            setIsSpeaking(false);
            return;
        }

        let animationId: number;
        let lastSpeakingTime = 0;
        const speakingTimeout = 150;

        const checkAudioLevel = () => {
            try {
                const level = audioTrack.getVolumeLevel?.() || 0;
                const now = Date.now();

                if (level > threshold) {
                    setIsSpeaking(true);
                    lastSpeakingTime = now;
                } else if (now - lastSpeakingTime > speakingTimeout) {
                    setIsSpeaking(false);
                }
            } catch (e) { }
            animationId = requestAnimationFrame(checkAudioLevel);
        };

        animationId = requestAnimationFrame(checkAudioLevel);
        return () => { if (animationId) cancelAnimationFrame(animationId); };
    }, [audioTrack, threshold]);

    return isSpeaking;
};

export default function ParticipantsList({
    remoteUsers,
    localUser,
    isMuted,
    isForceMuted = false,
    canControl = false,
    localAudioTrack,
    onMuteUser,
    onKickUser
}: ParticipantsListProps) {

    const localIsSpeaking = useSpeakingDetection(localAudioTrack);
    const [mutedUsers, setMutedUsers] = useState<Set<string | number>>(new Set());
    const [remoteSpeaking, setRemoteSpeaking] = useState<Record<string | number, boolean>>({});

    // Check remote speaking
    useEffect(() => {
        let animationId: number;

        const checkAllRemote = () => {
            const speaking: Record<string | number, boolean> = {};
            remoteUsers.forEach(user => {
                if (user.hasAudio && user.audioTrack && !mutedUsers.has(user.uid)) {
                    try {
                        const level = user.audioTrack.getVolumeLevel?.() || 0;
                        speaking[user.uid] = level > 0.35;
                    } catch { speaking[user.uid] = false; }
                } else {
                    speaking[user.uid] = false;
                }
            });
            setRemoteSpeaking(speaking);
            animationId = requestAnimationFrame(checkAllRemote);
        };

        if (remoteUsers.length > 0) {
            animationId = requestAnimationFrame(checkAllRemote);
        }

        return () => { if (animationId) cancelAnimationFrame(animationId); };
    }, [remoteUsers, mutedUsers]);

    // Toggle mute user (local + send RTM message)
    const toggleMuteUser = (user: IAgoraRTCRemoteUser) => {
        const uid = user.uid;
        const willMute = !mutedUsers.has(uid);

        setMutedUsers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uid)) {
                newSet.delete(uid);
                user.audioTrack?.play();
            } else {
                newSet.add(uid);
                user.audioTrack?.stop();
            }
            return newSet;
        });

        // Send RTM message to the user
        onMuteUser?.(uid, willMute);
    };

    // Kick user
    const kickUser = (uid: string | number) => {
        if (confirm('هل أنت متأكد من طرد هذا المشارك؟')) {
            onKickUser?.(uid);
        }
    };

    const totalParticipants = remoteUsers.length + 1;

    return (
        <div className="pt-4" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-center gap-3 mb-6">
                <div className={`w-2 h-2 rounded-full ${totalParticipants > 1 ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                <span className="text-sm font-medium text-muted-foreground">
                    {totalParticipants} في الغرفة
                </span>
                {canControl && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full flex items-center gap-1">
                        <Shield className="w-3 h-3" />
                        أخصائي
                    </span>
                )}
            </div>

            {/* Participants Grid */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">

                {/* Local User */}
                <div className="flex flex-col items-center gap-2">
                    <div className="relative">
                        <div className={`
                            w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center
                            transition-all duration-200
                            ${localUser.avatar ? '' : 'bg-gradient-to-br from-primary/20 to-primary/40'}
                            ${localIsSpeaking && !isMuted
                                ? 'ring-[3px] ring-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]'
                                : isForceMuted
                                    ? 'ring-[3px] ring-red-500 grayscale'
                                    : 'ring-2 ring-white/10'
                            }
                        `}
                            style={localUser.avatar ? {
                                backgroundImage: `url(${localUser.avatar})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            } : {}}>
                            {!localUser.avatar && (
                                <span className="text-xl md:text-2xl font-bold text-primary">
                                    {localUser.name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>



                        {(isMuted || isForceMuted) && (
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md bg-red-500">
                                <MicOff className="w-3.5 h-3.5 text-white" />
                            </div>
                        )}
                    </div>
                    <div className="text-center">
                        <p className="text-sm font-medium text-foreground">أنت</p>
                        {isForceMuted && (
                            <p className="text-[10px] text-red-500 font-bold">مكتوم</p>
                        )}
                    </div>
                </div>

                {/* Remote Users */}
                {remoteUsers.map((user) => {
                    const isUserMuted = mutedUsers.has(user.uid) || !user.hasAudio;
                    const isUserSpeaking = remoteSpeaking[user.uid] && !isUserMuted;

                    return (
                        <div key={user.uid} className="flex flex-col items-center gap-2 group relative">
                            <div className="relative">
                                <div className={`
                                    w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center
                                    bg-gradient-to-br from-secondary to-muted
                                    transition-all duration-200
                                        ? 'ring-2 ring-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-105'
                                        : isUserMuted
                                            ? 'ring-2 ring-red-500/50 grayscale opacity-80'
                                            : 'ring-1 ring-white/10 hover:ring-white/20'
                                `}>
                                    <span className="text-xl md:text-2xl font-bold text-muted-foreground">
                                        {String(user.uid).slice(-1).toUpperCase()}
                                    </span>
                                </div>



                                {isUserMuted && (
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-md bg-red-500">
                                        <MicOff className="w-3.5 h-3.5 text-white" />
                                    </div>
                                )}

                                {/* Quick Action Buttons - ONLY for specialist/owner */}
                                {canControl && (
                                    <div className="absolute -top-2 -left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => toggleMuteUser(user)}
                                            className={`w-7 h-7 rounded-full flex items-center justify-center shadow-lg transition-all
                                                ${mutedUsers.has(user.uid)
                                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                                    : 'bg-red-500 hover:bg-red-600 text-white'
                                                }
                                            `}
                                            title={mutedUsers.has(user.uid) ? 'إلغاء الكتم' : 'كتم'}
                                        >
                                            {mutedUsers.has(user.uid) ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                                        </button>

                                        <button
                                            onClick={() => kickUser(user.uid)}
                                            className="w-7 h-7 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-all"
                                            title="طرد"
                                        >
                                            <UserX className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="text-center">
                                <p className="text-sm font-medium text-foreground">
                                    مستخدم {String(user.uid).slice(-4)}
                                </p>
                                {isUserMuted && (
                                    <p className="text-[10px] text-red-500 font-medium">صامت</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty state */}
            {remoteUsers.length === 0 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                    في انتظار انضمام الآخرين...
                </p>
            )}

            {/* Hint for specialist */}
            {canControl && remoteUsers.length > 0 && (
                <p className="text-center text-xs text-muted-foreground mt-6 bg-muted/50 py-2 rounded-lg">
                    💡 مرر على أي مشارك للتحكم (كتم / طرد)
                </p>
            )}
        </div>
    );
}
