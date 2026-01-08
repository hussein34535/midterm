"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft, Video, Mic, Sparkles, Loader2, BookOpen, Users, Play, AlertCircle, MessageSquare } from "lucide-react";
import StatCard from "@/components/specialist/StatCard";
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
    const [groups, setGroups] = useState<any[]>([]);
    const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
    const [stats, setStats] = useState<Stats>({ courses: 0, totalSessions: 0, completedSessions: 0, activeSessions: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetchData();
        const stored = localStorage.getItem('user');
        if (stored) setUser(JSON.parse(stored));
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

            const [coursesRes, statsRes, groupsRes, scheduleRes] = await Promise.all([
                fetch(`${API_URL}/api/specialist/courses`, { headers }),
                fetch(`${API_URL}/api/specialist/stats`, { headers }),
                fetch(`${API_URL}/api/specialist/groups`, { headers }),
                fetch(`${API_URL}/api/specialist/schedule`, { headers })
            ]);

            if ([coursesRes, statsRes, groupsRes, scheduleRes].some(r => r.status === 401 || r.status === 403)) {
                setError('جلسة غير صالحة. يرجى تسجيل الدخول مجدداً.');
                setTimeout(() => window.location.href = '/login', 2000);
                return;
            }

            if (coursesRes.ok) setCourses((await coursesRes.json()).courses || []);
            if (statsRes.ok) setStats((await statsRes.json()).stats);
            if (groupsRes.ok) setGroups((await groupsRes.json()).groups || []);
            if (scheduleRes.ok) setUpcomingSessions((await scheduleRes.json()).upcoming || []);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStartSession = async (groupSessionId: string) => {
        try {
            const token = localStorage.getItem('token');

            // Start the session via API
            await fetch(`${API_URL}/api/specialist/sessions/${groupSessionId}/start`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            // Redirect to session page
            window.location.href = `/session/${groupSessionId}`;
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleCancelSession = async (sessionId: string) => {
        if (!confirm('هل أنت متأكد من إلغاء هذه الجلسة؟\nسيتم حذفها وسيتعين عليك جدولتها مرة أخرى.')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/specialist/sessions/${sessionId}`, {
                method: 'DELETE', // Using the delete endpoint we created
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('تم إلغاء الجلسة بنجاح');
                fetchData(); // Refresh to show "Needs Scheduling" state again
            } else {
                const d = await res.json();
                toast.error(d.error || 'فشل الإلغاء');
            }
        } catch (err) {
            console.error(err);
            toast.error('حدث خطأ');
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "صباح الخير";
        if (hour < 18) return "مساء الخير";
        return "مساء الخير";
    };

    return (
        <div className="bg-warm-mesh min-h-screen flex flex-col" dir="rtl">
            <Header />

            <main className="flex-grow pb-20 pt-24 md:pt-32">
                <div className="container mx-auto px-4 md:px-6 max-w-7xl">

                    {/* Dashboard Header */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 animate-in fade-in slide-in-from-bottom-3 duration-700">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground font-serif">
                                {greeting()}، دكتور {user?.nickname || ""} 👋
                            </h1>
                            <p className="text-muted-foreground mt-2 text-lg">مركز القيادة الخاص بك: تابع مجموعاتك وجلساتك من هنا.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl border border-white/60 shadow-sm">
                            <span className="text-sm font-bold px-4 py-2 rounded-xl bg-white shadow-sm text-foreground">
                                {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })} 🗓️
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 mb-8 bg-red-50/50 border border-red-200 text-red-600 rounded-2xl text-center font-bold animate-in zoom-in-95">
                            {error}
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard
                            title="الطلاب النشطين"
                            value={stats.activeSessions}
                            icon={Users}
                            color="primary"
                            description="طالب يتلقون العلاج حالياً"
                        />
                        <StatCard
                            title="جلسات اليوم"
                            value={upcomingSessions.length}
                            icon={Calendar}
                            color="primary"
                            description={upcomingSessions.length > 0 ? "لديك جلسات قادمة اليوم" : "لا توجد جلسات اليوم"}
                        />
                        <StatCard
                            title="رسائل غير مقروءة"
                            value={groups.reduce((acc, g) => acc + (g.unreadCount || 0), 0)}
                            icon={MessageSquare}
                            color="primary"
                            description="في مجموعات الكورسات"
                        />
                        <StatCard
                            title="جلسات مكتملة"
                            value={stats.completedSessions}
                            icon={Clock}
                            color="primary"
                            trend="+100%"
                            trendUp={true}
                            description="إجمالي الجلسات المنجزة"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        {/* Main Content - Groups Management (2/3 width) */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                                    <Users className="w-6 h-6 text-primary" />
                                    مجموعاتك العلاجية
                                </h2>
                            </div>

                            <div className="space-y-6">
                                {groups.length > 0 ? groups.map((group) => {
                                    // Logic to determine progress and next session
                                    const totalSessions = group.course?.total_sessions || 0;
                                    const completedCount = group.sessions?.filter((s: any) => s.status === 'ended').length || 0;
                                    const nextSessionNum = completedCount + 1;

                                    // Find if next session is already scheduled
                                    const nextSessionScheduled = group.sessions?.find((s: any) => s.session?.session_number === nextSessionNum);
                                    const isNextActive = nextSessionScheduled?.status === 'active';
                                    const isNextScheduled = !!nextSessionScheduled;

                                    return (
                                        <div key={group.id} className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm p-6 hover:shadow-md transition-all duration-300 group">
                                            <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
                                                <div className="flex gap-4">
                                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                        <Users className="w-7 h-7 text-indigo-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-foreground">{group.course?.title || 'عنوان الكورس'}</h3>
                                                        <p className="text-sm font-bold text-indigo-600 mb-1">{group.name || 'اسم المجموعة'}</p>
                                                        <div className="flex flex-wrap items-center gap-3 mt-2">
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                                                                <Users className="w-3.5 h-3.5" />
                                                                {group.members_count || 0} طلاب
                                                            </span>
                                                            <Link href={`/messages?id=${group.id}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-colors">
                                                                <MessageSquare className="w-3.5 h-3.5" />
                                                                محادثة
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Session Progress Bar */}
                                            <div className="space-y-2 mb-6 bg-white/50 p-4 rounded-2xl border border-white/60">
                                                <div className="flex justify-between text-xs font-bold text-muted-foreground">
                                                    <span>تقدم المجموعة</span>
                                                    <span className="text-indigo-600">
                                                        {completedCount} / {totalSessions} جلسات
                                                    </span>
                                                </div>
                                                <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                                                        style={{ width: `${(completedCount / Math.max(totalSessions, 1)) * 100}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Next Session Action Area */}
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                {/* Status Box */}
                                                <div className="flex-1 bg-gray-50/80 rounded-2xl p-4 border border-gray-100 flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isNextActive ? 'bg-green-100 text-green-600 animate-pulse' : isNextScheduled ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                                        {isNextActive ? <Video className="w-5 h-5" /> : isNextScheduled ? <Calendar className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-foreground">
                                                            {isNextActive ? 'الجلسة جارية الان!' : isNextScheduled ? 'الجلسة القادمة مجدولة' : 'الجلسة القادمة معلقة'}
                                                        </h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            {isNextScheduled
                                                                ? `الموعد: ${new Date(nextSessionScheduled.scheduled_at).toLocaleDateString('ar-EG', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}`
                                                                : `يجب تحديد موعد الجلسة رقم ${nextSessionNum}`}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                <div className="shrink-0 flex items-center">
                                                    {isNextActive ? (
                                                        <button
                                                            onClick={() => window.location.href = `/session/${nextSessionScheduled.id}`}
                                                            className="h-12 px-6 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold shadow-lg shadow-green-500/20 transition-all flex items-center gap-2 animate-bounce-subtle"
                                                        >
                                                            <Video className="w-4 h-4" />
                                                            دخول الجلسة
                                                        </button>
                                                    ) : isNextScheduled ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm('هل تريد بدء الجلسة الان؟')) {
                                                                        handleStartSession(nextSessionScheduled.id);
                                                                    }
                                                                }}
                                                                className="h-12 px-6 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                                                            >
                                                                <Play className="w-4 h-4" />
                                                                بدء الجلسة
                                                            </button>

                                                            {/* Edit (Reschedule) */}
                                                            <Link
                                                                href={`/specialist/schedule?editSessionId=${nextSessionScheduled.id}&groupId=${group.id}`}
                                                                className="h-12 w-12 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all"
                                                                title="تعديل الموعد"
                                                            >
                                                                <Calendar className="w-5 h-5" />
                                                            </Link>

                                                            {/* Cancel */}
                                                            <button
                                                                onClick={() => handleCancelSession(nextSessionScheduled.id)}
                                                                className="h-12 w-12 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-all"
                                                                title="إلغاء الجلسة"
                                                            >
                                                                <AlertCircle className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        completedCount < totalSessions ? (
                                                            <Link href={`/specialist/schedule?groupId=${group.id}&sessionNum=${nextSessionNum}`} className="h-12 px-6 rounded-xl bg-foreground hover:bg-gray-800 text-white font-bold shadow-lg transition-all flex items-center gap-2">
                                                                <Calendar className="w-4 h-4" />
                                                                جدولة الجلسة {nextSessionNum}
                                                            </Link>
                                                        ) : (
                                                            <div className="h-12 px-6 rounded-xl bg-green-100 text-green-700 font-bold flex items-center gap-2 border border-green-200">
                                                                <Sparkles className="w-4 h-4" />
                                                                الكورس مكتمل
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }) : (
                                    <div className="text-center py-16 bg-white/40 rounded-3xl border border-dashed border-border/60">
                                        <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-foreground">لا توجد مجموعات نشطة</h3>
                                        <p className="text-muted-foreground mt-2">لم يتم إسناد أي مجموعات لك بعد.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Sidebar (Schedule Only) */}
                        <div className="space-y-6">

                            {/* Schedule Widget */}
                            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/50 shadow-sm p-6">
                                <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-foreground">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                    جدول اليوم
                                </h3>

                                <div className="space-y-4">
                                    {upcomingSessions.length > 0 ? upcomingSessions.map((session, i) => (
                                        <div key={i} className="relative pl-6 border-l-2 border-primary/10 pb-6 last:pb-0 last:border-0 group">
                                            <div className={`absolute -left-[7px] top-0 w-3.5 h-3.5 rounded-full border-2 border-white transition-colors ${i === 0 ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-200 group-hover:bg-primary/50'}`} />
                                            <div className="bg-white p-4 rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/30">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-bold flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(session.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {i === 0 && <span className="animate-pulse w-2 h-2 rounded-full bg-green-500"></span>}
                                                </div>
                                                <p className="font-bold text-sm text-foreground mb-3">{session.title}</p>
                                                <button
                                                    onClick={() => window.location.href = `/session/${session.id}`}
                                                    className="w-full py-2 bg-primary/5 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold transition-all"
                                                >
                                                    بدء الجلسة
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 px-4 bg-muted/20 rounded-2xl border border-dashed border-border/50">
                                            <Sparkles className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                            <p className="text-sm font-bold text-muted-foreground">يومك هادئ!</p>
                                            <p className="text-xs text-muted-foreground/70 mt-1">لا توجد مواعيد متبقية اليوم</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
