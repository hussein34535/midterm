"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CalendarPlus, Loader2, Users } from "lucide-react";
import Header from "@/components/layout/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function SpecialistSchedule() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    // Data
    const [courses, setCourses] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]); // Groups for selected course
    const [syllabus, setSyllabus] = useState<any[]>([]); // Sessions template for selected course
    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [past, setPast] = useState<any[]>([]);

    // Form
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        courseId: '',
        groupId: '',
        sessionId: '', // Syllabus session
        date: '',
        time: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [coursesRes, groupsRes, scheduleRes] = await Promise.all([
                fetch(`${API_URL}/api/specialist/courses`, { headers }),
                fetch(`${API_URL}/api/specialist/groups`, { headers }),
                fetch(`${API_URL}/api/specialist/schedule`, { headers })
            ]);

            if (coursesRes.ok) {
                const data = await coursesRes.json();
                setCourses(data.courses || []);
                // Set default course and load its syllabus
                if (data.courses?.length > 0) {
                    const firstCourse = data.courses[0];
                    setForm(prev => ({ ...prev, courseId: firstCourse.id }));
                    setSyllabus(firstCourse.sessions || []);
                }
            }

            if (groupsRes.ok) {
                const data = await groupsRes.json();
                setGroups(data.groups || []);
            }

            if (scheduleRes.ok) {
                const data = await scheduleRes.json();
                setUpcoming(data.upcoming || []);
                setPast(data.past || []);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // When course changes, update available syllabus sessions
    const handleCourseChange = (courseId: string) => {
        setForm({ ...form, courseId, groupId: '', sessionId: '' });
        const course = courses.find(c => c.id === courseId);
        setSyllabus(course?.sessions || []);
    };

    // Filter groups for selected course
    const availableGroups = groups.filter(g => g.course_id === form.courseId);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        if (!form.groupId || !form.sessionId) {
            setError('يجب اختيار المجموعة والجلسة');
            setSubmitting(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');

            // Combine date and time
            const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();

            const res = await fetch(`${API_URL}/api/specialist/groups/${form.groupId}/schedule`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    session_id: form.sessionId,
                    scheduled_at: scheduledAt
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'فشل في جدولة الجلسة');
            }

            // Refresh data
            await fetchData();
            setShowForm(false);
            setForm({ ...form, groupId: '', sessionId: '', date: '', time: '' });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (sessionId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه الجلسة؟')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/specialist/sessions/${sessionId}/end`, { // We use end/cancel endpoint
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchData();
            }
        } catch (err) {
            console.error(err);
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
                <div className="container mx-auto px-6 max-w-4xl">

                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Link href="/specialist" className="p-2 hover:bg-primary/10 rounded-full transition-colors">
                                <ArrowRight className="w-6 h-6 text-foreground" />
                            </Link>
                            <h1 className="text-3xl font-bold text-foreground">جدول الجلسات</h1>
                        </div>

                        <button
                            onClick={() => setShowForm(!showForm)}
                            className="btn-primary px-6 py-2 flex items-center gap-2"
                        >
                            <CalendarPlus className="w-5 h-5" />
                            {showForm ? 'إلغاء' : 'جلسة جديدة'}
                        </button>
                    </div>

                    {error && (
                        <div className="card-love p-4 mb-8 bg-destructive/10 border-destructive/20 text-destructive text-center">
                            {error}
                        </div>
                    )}

                    {/* New Session Form */}
                    {showForm && (
                        <div className="card-love p-6 mb-8 animate-in slide-in-from-top-4">
                            <h2 className="text-xl font-bold mb-6">جدولة جلسة لمجموعة</h2>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-foreground">الكورس</label>
                                        <select
                                            value={form.courseId}
                                            onChange={(e) => handleCourseChange(e.target.value)}
                                            className="w-full p-3 rounded-lg border border-border bg-background text-foreground"
                                            required
                                        >
                                            {courses.map(c => (
                                                <option key={c.id} value={c.id}>{c.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-foreground flex items-center gap-2">
                                            <Users className="w-4 h-4 text-blue-500" />
                                            المجموعة
                                        </label>
                                        <select
                                            value={form.groupId}
                                            onChange={(e) => setForm({ ...form, groupId: e.target.value })}
                                            className="w-full p-3 rounded-lg border border-border bg-background text-foreground"
                                            required
                                        >
                                            <option value="">اختر المجموعة...</option>
                                            {availableGroups.map(g => (
                                                <option key={g.id} value={g.id}>{g.name}</option>
                                            ))}
                                        </select>
                                        {availableGroups.length === 0 && (
                                            <p className="text-xs text-amber-600 mt-1">لا توجد مجموعات لهذا الكورس</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold mb-2 text-foreground">الجلسة (من المنهج)</label>
                                    <select
                                        value={form.sessionId}
                                        onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
                                        className="w-full p-3 rounded-lg border border-border bg-background text-foreground"
                                        required
                                    >
                                        <option value="">اختر الجلسة...</option>
                                        {syllabus.map(s => (
                                            <option key={s.id} value={s.id}>
                                                الجلسة {s.session_number}: {s.title || 'بدون عنوان'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-foreground">التاريخ</label>
                                        <input
                                            type="date"
                                            value={form.date}
                                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                                            className="w-full p-3 rounded-lg border border-border bg-background text-foreground"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-foreground">الوقت</label>
                                        <input
                                            type="time"
                                            value={form.time}
                                            onChange={(e) => setForm({ ...form, time: e.target.value })}
                                            className="w-full p-3 rounded-lg border border-border bg-background text-foreground"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn-primary w-full py-3 text-lg"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'حفظ الجلسة'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-4 mb-6 border-b border-border/50">
                        <button
                            onClick={() => setActiveTab('upcoming')}
                            className={`pb-4 px-4 font-bold transition-all ${activeTab === 'upcoming'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            القادمة ({upcoming.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('past')}
                            className={`pb-4 px-4 font-bold transition-all ${activeTab === 'past'
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            السابقة ({past.length})
                        </button>
                    </div>

                    {/* Sessions List */}
                    <div className="space-y-4">
                        {(activeTab === 'upcoming' ? upcoming : past).map((session) => (
                            <div key={session.id} className="card-love p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`px-2 py-1 text-xs rounded-full font-bold ${session.type === 'group' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                            {session.type === 'group' ? 'جماعية' : 'فردية'}
                                        </span>
                                        <h3 className="font-bold text-lg text-foreground">{session.title}</h3>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-1">
                                        {session.course?.title || 'كورس غير معروف'}
                                    </p>
                                    <p className="text-sm font-bold text-primary flex items-center gap-2">
                                        {new Date(session.scheduled_at || session.created_at).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        <span className="text-muted-foreground">|</span>
                                        {new Date(session.scheduled_at || session.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {activeTab === 'upcoming' && (
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <Link
                                            href={`/session/${session.id}`}
                                            className="btn-primary flex-1 md:flex-none text-center px-6 py-2 text-sm"
                                        >
                                            بدء الآن
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(session.id)}
                                            className="px-4 py-2 text-sm font-bold text-destructive bg-destructive/10 rounded-lg hover:bg-destructive/20 transition-colors"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                        {(activeTab === 'upcoming' ? upcoming : past).length === 0 && (
                            <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl">
                                لا توجد جلسات {activeTab === 'upcoming' ? 'قادمة' : 'سابقة'}
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
