import { IAgoraRTCRemoteUser } from "agora-rtc-sdk-ng";
import { useState, useEffect } from "react";
import { Mic, MicOff, UserX, Shield } from "lucide-react";

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

// Speaking detection hook with volume level
const useSpeakingDetection = (audioTrack: any, threshold: number = 0.2) => {
    const [volumeLevel, setVolumeLevel] = useState(0);

    useEffect(() => {
        if (!audioTrack) {
            setVolumeLevel(0);
            return;
        }

        let animationId: number;

        const checkAudioLevel = () => {
            try {
                const level = audioTrack.getVolumeLevel?.() || 0;
                setVolumeLevel(level);
            } catch (e) { }
            animationId = requestAnimationFrame(checkAudioLevel);
        };

        animationId = requestAnimationFrame(checkAudioLevel);
        return () => { if (animationId) cancelAnimationFrame(animationId); };
    }, [audioTrack, threshold]);

    return volumeLevel;
};

// Get ring style based on volume level - same green color, different intensity
const getVolumeRingStyle = (level: number): React.CSSProperties => {
    const opacity = Math.min(level * 2, 1); // 0 to 1 based on volume
    const blur = 10 + level * 25; // 10px to 35px blur
    return {
        boxShadow: `0 0 ${blur}px rgba(34, 197, 94, ${opacity})`,
        borderColor: `rgba(34, 197, 94, ${0.3 + opacity * 0.7})`,
        borderWidth: '3px',
        borderStyle: 'solid'
    };
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

    const localVolume = useSpeakingDetection(localAudioTrack);
    const [mutedUsers, setMutedUsers] = useState<Set<string | number>>(new Set());
    const [remoteVolumes, setRemoteVolumes] = useState<Record<string | number, number>>({});

    // Check remote speaking
    useEffect(() => {
        let animationId: number;

        const checkAllRemote = () => {
            const volumes: Record<string | number, number> = {};
            remoteUsers.forEach(user => {
                if (user.hasAudio && user.audioTrack && !mutedUsers.has(user.uid)) {
                    try {
                        const level = user.audioTrack.getVolumeLevel?.() || 0;
                        volumes[user.uid] = level;
                    } catch { volumes[user.uid] = 0; }
                } else {
                    volumes[user.uid] = 0;
                }
            });
            setRemoteVolumes(volumes);
            animationId = requestAnimationFrame(checkAllRemote);
        };

        if (remoteUsers.length > 0) {
            animationId = requestAnimationFrame(checkAllRemote);
        }

        return () => { if (animationId) cancelAnimationFrame(animationId); };
    }, [remoteUsers, mutedUsers]);

    // Toggle mute user
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
                            transition-all duration-150
                            ${localUser.avatar ? '' : 'bg-gradient-to-br from-primary/20 to-primary/40'}
                            ${isForceMuted ? 'ring-[3px] ring-red-500 grayscale' : ''}
                            ${isMuted && !isForceMuted ? 'ring-2 ring-white/20' : ''}
                        `}
                            style={{
                                ...(localUser.avatar ? {
                                    backgroundImage: `url(${localUser.avatar})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center'
                                } : {}),
                                ...(!isMuted && !isForceMuted ? getVolumeRingStyle(localVolume) : {})
                            }}>
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
                    const userVolume = remoteVolumes[user.uid] || 0;

                    return (
                        <div key={user.uid} className="flex flex-col items-center gap-2 group relative">
                            <div className="relative">
                                <div className={`
                                    w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center
                                    bg-gradient-to-br from-secondary to-muted
                                    transition-all duration-150
                                    ${isUserMuted ? 'ring-2 ring-red-500/50 grayscale opacity-80' : ''}
                                `}
                                    style={!isUserMuted ? getVolumeRingStyle(userVolume) : {}}
                                >
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
        </div>
    );
}
