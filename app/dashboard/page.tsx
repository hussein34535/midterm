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
                                <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        <h2 className="font-bold text-gray-800">جلستك القادمة</h2>
                                    </div>

                                    {upcomingSessions.slice(0, 2).map((session) => (
                                        <Link
                                            key={session.id}
                                            href={`/session/${session.id}`}
                                            className="flex items-center gap-4 p-4 bg-purple-50 rounded-2xl mb-2 last:mb-0 hover:bg-purple-100 transition-colors"
                                        >
                                            <div className="w-14 h-14 bg-white rounded-xl flex flex-col items-center justify-center shadow-sm">
                                                <span className="text-primary font-bold text-lg">
                                                    {new Date(session.scheduled_at).getDate()}
                                                </span>
                                                <span className="text-gray-400 text-[10px] font-medium">
                                                    {new Date(session.scheduled_at).toLocaleDateString('ar-EG', { month: 'short' })}
                                                </span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-800 text-sm">{session.title}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">{session.course_title}</p>
                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(session.scheduled_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <User className="w-3 h-3" />
                                                        {session.specialist_name}
                                                    </span>
                                                </div>
                                            </div>
                                            <ChevronLeft className="w-5 h-5 text-gray-300" />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                                    <img src="/meditation.png" alt="" className="w-32 h-32 mx-auto mb-4 opacity-80" />
                                    <p className="text-gray-600 font-medium mb-1">لا توجد جلسات قادمة</p>
                                    <p className="text-gray-400 text-sm mb-4">استكشف الكورسات للانضمام</p>
                                    <Link href="/courses" className="inline-flex items-center gap-2 text-primary font-bold text-sm hover:underline">
                                        تصفح الكورسات
                                        <ArrowLeft className="w-4 h-4 rotate-180" />
                                    </Link>
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
                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    href="/messages"
                                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center"
                                >
                                    <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-xl flex items-center justify-center">
                                        <MessageCircle className="w-6 h-6 text-primary" />
                                    </div>
                                    <p className="font-bold text-gray-800 text-sm">الرسائل</p>
                                    <p className="text-xs text-gray-400 mt-0.5">تواصل مع أخصائيك</p>
                                </Link>
                                <Link
                                    href="/courses"
                                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow text-center"
                                >
                                    <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-xl flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <p className="font-bold text-gray-800 text-sm">الكورسات</p>
                                    <p className="text-xs text-gray-400 mt-0.5">اكتشف رحلات جديدة</p>
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
