'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, User, BookOpen, Loader2, MessageCircle, ArrowLeft, ChevronLeft } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Enrollment {
    id: string;
    course: {
        id: string;
        title: string;
        total_sessions: number;
    };
    completed_sessions: number;
}

interface UpcomingSession {
    id: string;
    title: string;
    course_title: string;
    scheduled_at: string;
    specialist_name: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                fetchUserData();
            } catch (e) {
                console.error("Failed to parse user data");
                router.push('/login');
            }
        } else {
            router.push('/login');
        }
    }, [router]);

    const fetchUserData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const enrollRes = await fetch(`${API_URL}/api/users/enrollments`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (enrollRes.ok) {
                const data = await enrollRes.json();
                setEnrollments(data.enrollments || []);
            }

            const scheduleRes = await fetch(`${API_URL}/api/users/schedule`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (scheduleRes.ok) {
                const data = await scheduleRes.json();
                setUpcomingSessions(data.sessions || []);
            }
        } catch (err) {
            console.error('Failed to fetch user data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white"></div>;

    return (
        <div className="bg-gradient-to-b from-purple-50 via-white to-purple-50/30 min-h-screen" dir="rtl">
            <Header />

            <main className="pt-24 pb-20">
                <div className="container mx-auto px-5 max-w-2xl">

                    {/* Simple Welcome */}
                    <div className="text-center mb-10 animate-in fade-in duration-500">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                            {user.avatar ? (
                                <img src={user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span className="text-white font-bold text-2xl">
                                    {(user.nickname || "U").charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-1">
                            مرحباً {user.nickname} 👋
                        </h1>
                        <p className="text-gray-500 text-sm">نتمنى لك يوماً هادئاً</p>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

                            {/* Upcoming Session Card */}
                            {upcomingSessions.length > 0 ? (
                                <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-6 shadow-xl shadow-purple-500/25 relative overflow-hidden">
                                    {/* Background decoration removed */}
                                    <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />

                                    <div className="relative z-10">
                                        {/* Header */}
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center animate-bounce" style={{ animationDuration: '2s' }}>
                                                <Calendar className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="font-bold text-white text-lg">جلستك القادمة ✨</h2>
                                                <p className="text-white/60 text-xs">لا تنسَ الحضور!</p>
                                            </div>
                                        </div>

                                        {/* Session Cards */}
                                        {upcomingSessions.slice(0, 2).map((session, idx) => (
                                            <Link
                                                key={session.id}
                                                href={`/session/${session.id}`}
                                                className={`block p-4 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 hover:bg-white/25 hover:scale-[1.02] transition-all duration-300 mb-3 last:mb-0 ${idx === 0 ? 'ring-2 ring-white/40 shadow-lg' : 'opacity-80'}`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* BIG Date Badge - More Prominent */}
                                                    <div className="w-20 h-20 bg-white rounded-2xl flex flex-col items-center justify-center shadow-xl shrink-0 border-2 border-purple-200">
                                                        <span className="text-purple-600 font-black text-3xl leading-none">
                                                            {new Date(session.scheduled_at).getDate()}
                                                        </span>
                                                        <span className="text-purple-500 text-xs font-bold mt-1">
                                                            {new Date(session.scheduled_at).toLocaleDateString('ar-EG', { month: 'short' })}
                                                        </span>
                                                    </div>

                                                    {/* Session Info */}
                                                    <div className="flex-1 min-w-0 pt-1">
                                                        <h3 className="font-bold text-white text-base truncate mb-1">{session.title}</h3>
                                                        <p className="text-sm text-white/60 truncate mb-3">{session.course_title}</p>

                                                        {/* TIME - Visible with color, simple font */}
                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-400 text-purple-900 rounded-lg text-sm">
                                                            <Clock className="w-4 h-4" />
                                                            {new Date(session.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>

                                                        <div className="flex items-center gap-1 mt-2">
                                                            <span className="text-white/80 text-xs font-medium">
                                                                مع الأخصائي {session.specialist_name}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Arrow */}
                                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors shrink-0 mt-5">
                                                        <ChevronLeft className="w-5 h-5 text-white" />
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                                    <img src="/meditation.png" alt="" className="w-32 h-32 mx-auto mb-4" />
                                    <p className="text-gray-700 font-bold mb-1">لا توجد جلسات قادمة</p>

                                </div>
                            )}

                            {/* My Courses */}
                            {enrollments.length > 0 && (
                                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <BookOpen className="w-5 h-5 text-primary" />
                                            <h2 className="font-bold text-gray-800">كورساتي</h2>
                                        </div>
                                        <Link href="/courses" className="text-primary text-sm font-medium hover:underline">
                                            الكل
                                        </Link>
                                    </div>

                                    <div className="space-y-3">
                                        {enrollments.slice(0, 3).map((enrollment) => {
                                            const progress = enrollment.course.total_sessions > 0
                                                ? Math.round((enrollment.completed_sessions / enrollment.course.total_sessions) * 100)
                                                : 0;
                                            return (
                                                <Link
                                                    key={enrollment.id}
                                                    href={`/courses/${enrollment.course.id}`}
                                                    className="block p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h4 className="font-bold text-gray-800 text-sm">{enrollment.course.title}</h4>
                                                        <span className="text-xs font-bold text-primary">{progress}%</span>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all"
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div className="grid grid-cols-2 gap-4">
                                <Link
                                    href="/messages"
                                    className="bg-gradient-to-br from-purple-400/90 to-violet-500/90 rounded-2xl p-5 shadow-lg shadow-purple-400/20 hover:shadow-xl hover:scale-[1.02] transition-all text-center relative overflow-hidden group"
                                >
                                    <div className="absolute -bottom-2 -right-2 w-24 h-24 opacity-40 group-hover:opacity-50 transition-opacity">
                                        <img src="/voice.png" alt="" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 mx-auto mb-3 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                                            <MessageCircle className="w-7 h-7 text-white" />
                                        </div>
                                        <p className="font-bold text-white">الرسائل</p>
                                        <p className="text-xs text-white/70 mt-1">تواصل مع أخصائيك</p>
                                    </div>
                                </Link>
                                <Link
                                    href="/courses"
                                    className="bg-gradient-to-br from-teal-400/90 to-cyan-500/90 rounded-2xl p-5 shadow-lg shadow-teal-400/20 hover:shadow-xl hover:scale-[1.02] transition-all text-center relative overflow-hidden group"
                                >
                                    <div className="absolute -bottom-4 -right-4 w-20 h-20 opacity-20 group-hover:opacity-30 transition-opacity">
                                        <img src="/therapy.png" alt="" className="w-full h-full object-contain" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="w-14 h-14 mx-auto mb-3 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                                            <BookOpen className="w-7 h-7 text-white" />
                                        </div>
                                        <p className="font-bold text-white">الكورسات</p>
                                        <p className="text-xs text-white/70 mt-1">اكتشف رحلات جديدة</p>
                                    </div>
                                </Link>
                            </div>

                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
