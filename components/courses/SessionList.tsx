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
    const [mySessions, setMySessions] = useState<Session[]>([]);
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const stored = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        if (stored && token) {
            const userData = JSON.parse(stored);
            setUser(userData);

            // Specialists/Owners always see syllabus
            if (userData.role === 'specialist' || userData.role === 'owner') {
                setIsEnrolled(true);
                setMySessions(sessions);
                setLoading(false);
            } else {
                // For students, fetch their group schedule
                fetchMySessions(token);
            }
        } else {
            // Not logged in
            setLoading(false);
        }
    }, [sessions, courseId]);

    const fetchMySessions = async (token: string) => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/courses/${courseId}/my-sessions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMySessions(data.sessions);
                setIsEnrolled(true);
            } else {
                // 403 = Not enrolled
                setIsEnrolled(false);
            }
        } catch (err) {
            console.error('Failed to fetch my sessions');
            setIsEnrolled(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSessionAction = async (session: Session) => {
        if (!user) {
            router.push('/login');
            return;
        }

        const isSpecialistOrOwner = user.role === 'specialist' || user.role === 'owner';

        if (isSpecialistOrOwner) {
            // Specialists manage sessions from dashboard
            router.push('/specialist');
            return;
        }

        // For connected students
        if (session.status === 'active') {
            router.push(`/session/${session.id}`);
        } else {
            alert("الجلسة لم تبدأ بعد"); // Should be handled by UI state mostly
        }
    };

    const isSpecialist = user?.role === 'specialist' || user?.role === 'owner';

    return (
        <div className="space-y-4">
            {loading ? (
                <div className="text-center p-8">
                    <p className="text-muted-foreground">جاري التحميل...</p>
                </div>
            ) : !isEnrolled ? (
                <div className="text-center p-8 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5">
                    <p className="text-foreground font-medium mb-2">🔒 جدول الجلسات</p>
                    <p className="text-muted-foreground text-sm">اشترك في الكورس لمشاهدة جدول مجموعتك</p>
                </div>
            ) : mySessions.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-muted-foreground">لا توجد جلسات مجدولة بعد لمجموعتك.</p>
                </div>
            ) : (
                mySessions.map((session) => {
                    const isActive = session.status === 'active';
                    const isEnded = session.status === 'ended';
                    const isGroupSession = (session as any).is_group_session;

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
                                        {(session as any).scheduled_at
                                            ? new Date((session as any).scheduled_at).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                            : 'غير محدد'
                                        }
                                    </span>
                                    {!isGroupSession && !isSpecialist && (
                                        <span className="text-amber-600 font-medium">• بانتظار الجدولة</span>
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
                                ) : isSpecialist ? (
                                    <Button
                                        onClick={() => router.push('/specialist')}
                                        variant="outline"
                                        className="rounded-full px-4"
                                    >
                                        إدارة
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
