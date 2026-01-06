"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, ArrowRight, Video, Mic, Sparkles, Loader2, BookOpen, Users, Play } from "lucide-react";
import Header from "@/components/layout/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Course {
    id: string;
    title: string;
    description: string;
    total_sessions: number;
    sessions: { id: string; title: string; session_number: number; status: string }[];
}

interface Stats {
    courses: number;
    totalSessions: number;
    completedSessions: number;
    activeSessions: number;
}

export default function SpecialistDashboard() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [groups, setGroups] = useState<any[]>([]); // New: Groups state
    const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]); // New: Schedule state
    const [stats, setStats] = useState<Stats>({ courses: 0, totalSessions: 0, completedSessions: 0, activeSessions: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('يجب تسجيل الدخول أولاً');
                setLoading(false);
                return;
            }

            const headers = { 'Authorization': `Bearer ${token}` };

            // Run queries in parallel
            const [coursesRes, statsRes, groupsRes, scheduleRes] = await Promise.all([
                fetch(`${API_URL}/api/specialist/courses`, { headers }),
                fetch(`${API_URL}/api/specialist/stats`, { headers }),
                fetch(`${API_URL}/api/specialist/groups`, { headers }),
                fetch(`${API_URL}/api/specialist/schedule`, { headers })
            ]);



            // Check for authorization errors specifically
            if ([coursesRes, statsRes, groupsRes, scheduleRes].some(r => r.status === 401 || r.status === 403)) {
                setError('جلسة غير صالحة أو ليس لديك صلاحية أخصائي. يرجى تسجيل الدخول مجدداً.');
                localStorage.removeItem('token'); // Force logout on auth error
                localStorage.removeItem('user');
                setTimeout(() => window.location.href = '/login', 3000);
                return;
            }

            if (coursesRes.ok) {
                const data = await coursesRes.json();
                setCourses(data.courses || []);
            }

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data.stats);
            }

            if (groupsRes.ok) {
                const data = await groupsRes.json();
                setGroups(data.groups || []);
            }

            if (scheduleRes.ok) {
                const data = await scheduleRes.json();
                setUpcomingSessions(data.upcoming || []);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartSession = async (courseId: string, sessionNumber: number) => {
        try {
            const token = localStorage.getItem('token');

            // Create session for this course
            const res = await fetch(`${API_URL}/api/specialist/courses/${courseId}/sessions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ session_number: sessionNumber })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            const data = await res.json();

            // Start the session
            await fetch(`${API_URL}/api/specialist/sessions/${data.session.id}/start`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Redirect to session
            window.location.href = `/session/${data.session.id}`;
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="bg-warm-mesh min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="bg-warm-mesh min-h-screen flex flex-col" dir="rtl">
            <Header />

            <main className="flex-grow pb-20 pt-32">
                <div className="container mx-auto px-6">

                    {/* Header */}
                    <div className="mb-12 text-center md:text-right animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                            <Sparkles className="w-4 h-4 fill-current" />
                            <span>مكتب الأخصائي</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-3">
                            أهلاً بك، دكتور
                        </h1>
                        <p className="text-muted-foreground text-lg">لديك {stats.activeSessions} جلسات نشطة و {groups.length} مجموعات تفاعلية اليوم.</p>
                    </div>

                    {error && (
                        <div className="card-love p-4 mb-8 bg-destructive/10 border-destructive/20 text-destructive text-center">
                            {error}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="card-love p-4 text-center">
                            <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
                            <p className="text-2xl font-bold text-foreground">{stats.courses}</p>
                            <p className="text-xs text-muted-foreground">كورسات</p>
                        </div>
                        <div className="card-love p-4 text-center">
                            <Video className="w-6 h-6 text-primary mx-auto mb-2" />
                            <p className="text-2xl font-bold text-foreground">{stats.totalSessions}</p>
                            <p className="text-xs text-muted-foreground">جلسات</p>
                        </div>
                        <div className="card-love p-4 text-center">
                            <Users className="w-6 h-6 text-green-500 mx-auto mb-2" />
                            <p className="text-2xl font-bold text-green-600">{stats.activeSessions}</p>
                            <p className="text-xs text-muted-foreground">نشطة</p>
                        </div>
                        <div className="card-love p-4 text-center">
                            <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                            <p className="text-2xl font-bold text-foreground">{stats.completedSessions}</p>
                            <p className="text-xs text-muted-foreground">مكتملة</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {/* Right Column: Schedule & Groups */}
                        <div className="md:col-span-1 space-y-8">
                            {/* Create Session CTA */}
                            <Link
                                href="/specialist/schedule"
                                className="block w-full btn-primary py-4 text-center text-lg shadow-lg hover:shadow-xl transition-all"
                            >
                                + جدولة جلسة جديدة
                            </Link>

                            {/* Upcoming Schedule */}
                            <div className="card-love p-5">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    الجلسات القادمة
                                </h3>
                                {upcomingSessions.length > 0 ? (
                                    <div className="space-y-3">
                                        {upcomingSessions.slice(0, 5).map((session) => (
                                            <div key={session.id} className="p-3 rounded-xl bg-muted/50 border border-border flex items-center justify-between">
                                                <div>
                                                    <p className="font-bold text-sm text-foreground">{session.title}</p>
                                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(session.scheduled_at || session.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                <Link
                                                    href={`/session/${session.id}`}
                                                    className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
                                                >
                                                    بدء
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-4 text-sm">لا توجد جلسات قادمة</p>
                                )}
                            </div>

                            {/* Groups */}
                            <div className="card-love p-5">
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-blue-500" />
                                    المجموعات التفاعلية
                                </h3>
                                {groups.length > 0 ? (
                                    <div className="space-y-3">
                                        {groups.map((group) => (
                                            <div key={group.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-xl transition-colors cursor-pointer" onClick={() => window.location.href = `/messages?id=${group.id}`}>
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                                    {group.course?.title?.[0] || 'G'}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className="font-bold text-sm text-foreground truncate">{group.course?.title || 'مجموعة'}</p>
                                                    <p className="text-xs text-muted-foreground truncate">اضغط للدخول للمحادثة</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-4 text-sm">لا توجد مجموعات نشطة حالياً</p>
                                )}
                            </div>
                        </div>

                        {/* Left Column: Courses Grid */}
                        <div className="md:col-span-2 space-y-6">
                            <h2 className="text-2xl font-bold text-foreground mb-4">كورساتك النشطة</h2>
                            {courses.map((course) => (
                                <div key={course.id} className="card-love p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h2 className="text-xl font-bold text-foreground">{course.title}</h2>
                                            <p className="text-sm text-muted-foreground">{course.description}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-bold">
                                            {course.total_sessions} جلسات
                                        </span>
                                    </div>

                                    {/* Sessions Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {Array.from({ length: course.total_sessions }, (_, i) => {
                                            const sessionNum = i + 1;
                                            const existingSession = course.sessions?.find(s => s.session_number === sessionNum);
                                            const isCompleted = existingSession?.status === 'ended';
                                            const isActive = existingSession?.status === 'active';

                                            return (
                                                <button
                                                    key={sessionNum}
                                                    onClick={() => {
                                                        if (isActive && existingSession) {
                                                            window.location.href = `/session/${existingSession.id}`;
                                                        } else if (!isCompleted) {
                                                            handleStartSession(course.id, sessionNum);
                                                        }
                                                    }}
                                                    disabled={isCompleted}
                                                    className={`p-4 rounded-xl border text-center transition-all ${isActive
                                                        ? 'bg-green-50 border-green-300 text-green-700 animate-pulse'
                                                        : isCompleted
                                                            ? 'bg-muted border-border text-muted-foreground cursor-not-allowed'
                                                            : 'bg-primary/5 border-primary/20 hover:bg-primary/10 hover:border-primary/40 text-foreground'
                                                        }`}
                                                >
                                                    <div className="text-2xl font-bold mb-1">{sessionNum}</div>
                                                    <div className="text-xs">
                                                        {isActive ? '🟢 نشطة' : isCompleted ? '✅ مكتملة' : 'جلسة'}
                                                    </div>
                                                    {!isCompleted && !isActive && (
                                                        <Play className="w-4 h-4 mx-auto mt-2 text-primary" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {courses.length === 0 && (
                                <div className="card-love p-12 text-center">
                                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground">لا توجد كورسات مسندة لك بعد</p>
                                    <p className="text-sm text-muted-foreground mt-2">تواصل مع المالك لإسناد كورس لك</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Back Link */}
                    <div className="text-center mt-8">
                        <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2">
                            <ArrowRight className="w-4 h-4" />
                            العودة للوحة التحكم
                        </Link>
                    </div>

                </div>
            </main>
        </div>
    );
}
