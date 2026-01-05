"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, Lock, Play, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Session {
    id: string;
    session_number: number;
    title: string;
    description?: string;
    status: string; // 'waiting', 'active', 'ended'
    created_at: string;
}

interface SessionListProps {
    sessions: Session[];
    courseId: string;
    specialistId: string;
}

export default function SessionList({ sessions, courseId, specialistId }: SessionListProps) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            setUser(JSON.parse(stored));
        }
    }, []);

    const handleSessionAction = async (session: Session) => {
        if (!user) {
            router.push('/login');
            return;
        }

        setLoading(true);

        const isSpecialist = user.role === 'specialist' || user.role === 'owner';
        const isHost = isSpecialist && user.id === specialistId;

        // Implementation of join/start logic will go here
        // For now, simple redirect
        if (session.status === 'active' || isHost) {
            // If active or user is host, go to session
            // In real flow, we might need to hit /api/sessions/:id/join first 
            // but VoiceCall component also handles joining. 
            // Let's assume hitting the page is enough for now.
            router.push(`/session/${session.id}`);
        } else {
            alert("الجلسة لم تبدأ بعد");
        }

        setLoading(false);
    };

    const isSpecialist = user?.role === 'specialist' || user?.role === 'owner';
    const canControl = isSpecialist; // Simplified for now

    return (
        <div className="space-y-4">
            {sessions.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-muted-foreground">لا توجد جلسات مجدولة بعد لهذا الكورس.</p>
                </div>
            ) : (
                sessions.map((session) => {
                    const isActive = session.status === 'active';
                    const isEnded = session.status === 'ended';

                    return (
                        <div
                            key={session.id}
                            className={`group flex items-center gap-4 p-4 rounded-xl border transition-all ${isActive
                                    ? 'bg-green-50/50 border-green-200 hover:shadow-md'
                                    : isEnded
                                        ? 'bg-gray-50 border-gray-100 opacity-75'
                                        : 'bg-white border-transparent hover:border-primary/20 hover:bg-secondary/50'
                                }`}
                        >
                            {/* Session Number / Status Icon */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-transform group-hover:scale-105 shrink-0
                                ${isActive
                                    ? 'bg-green-100 text-green-600'
                                    : isEnded
                                        ? 'bg-gray-200 text-gray-500'
                                        : 'bg-primary/10 text-primary'
                                }
                            `}>
                                {isActive ? <Mic className="w-5 h-5 animate-pulse" /> :
                                    isEnded ? <CheckCircle className="w-5 h-5" /> :
                                        session.session_number}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-foreground text-lg truncate">
                                        {session.title || `الجلسة ${session.session_number}`}
                                    </h3>
                                    {isActive && (
                                        <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold animate-pulse">
                                            مباشر الآن
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {new Date(session.created_at).toLocaleDateString('ar-EG')}
                                    </span>
                                    {session.status === 'waiting' && (
                                        <span>• لم تبدأ بعد</span>
                                    )}
                                </div>
                            </div>

                            {/* Action Button */}
                            <div>
                                {isActive ? (
                                    <Button
                                        onClick={() => handleSessionAction(session)}
                                        className="bg-green-600 hover:bg-green-700 text-white rounded-full px-6"
                                    >
                                        انضمام
                                        <Play className="w-4 h-4 mr-2" />
                                    </Button>
                                ) : isEnded ? (
                                    <Button variant="ghost" disabled className="text-muted-foreground">
                                        منتهية
                                    </Button>
                                ) : canControl ? (
                                    <Button
                                        onClick={() => handleSessionAction(session)}
                                        className="bg-primary hover:bg-primary/90 text-white rounded-full px-6"
                                    >
                                        ابدأ الجلسة
                                        <Mic className="w-4 h-4 mr-2" />
                                    </Button>
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400" title="لم تبدأ بعد">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
