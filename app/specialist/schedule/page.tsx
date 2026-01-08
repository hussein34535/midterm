"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CalendarPlus, Loader2, Users, Edit2, Trash2 } from "lucide-react";
import Header from "@/components/layout/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function SpecialistSchedule() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [editingId, setEditingId] = useState<string | null>(null);

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
        sessionId: '', // Syllabus session id
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

            let fetchedCourses = [];
            let fetchedGroups = [];

            if (coursesRes.ok) {
                const data = await coursesRes.json();
                fetchedCourses = data.courses || [];
                setCourses(fetchedCourses);
            }

            if (groupsRes.ok) {
                const data = await groupsRes.json();
                fetchedGroups = data.groups || [];
                setGroups(fetchedGroups);
            }

            // Handle Query Params for Auto-fill (Only if getting new data)
            const paramGroupId = searchParams.get('groupId');
            const paramSessionNum = searchParams.get('sessionNum');
            const paramEditSessionId = searchParams.get('editSessionId');

            if (scheduleRes.ok) {
                const sData = await scheduleRes.json();
                const allSessions = [...(sData.upcoming || []), ...(sData.past || [])];

                // If editSessionId is present, find and edit that session
                if (paramEditSessionId) {
                    const targetSession = allSessions.find((s: any) => s.id === paramEditSessionId);
                    if (targetSession) {
                        handleEdit(targetSession);
                    }
                }

                setUpcoming(sData.upcoming || []);
                setPast(sData.past || []);
            }

            // Only auto-fill for NEW session if we are not editing
            if (!editingId && !showForm && !paramEditSessionId) {
                if (paramGroupId && fetchedGroups.length > 0) {
                    const targetGroup = fetchedGroups.find(g => g.id === paramGroupId);
                    if (targetGroup) {
                        const targetCourse = fetchedCourses.find(c => c.id === targetGroup.course_id);
                        setForm(prev => ({
                            ...prev,
                            courseId: targetGroup.course_id,
                            groupId: paramGroupId,
                            sessionId: '',
                        }));

                        if (targetCourse) {
                            setSyllabus(targetCourse.sessions || []);
                            if (paramSessionNum) {
                                const targetSession = targetCourse.sessions?.find((s: any) => s.session_number === parseInt(paramSessionNum));
                                if (targetSession) {
                                    setForm(prev => ({ ...prev, sessionId: targetSession.id }));
                                }
                            }
                        }
                        setShowForm(true);
                    }
                }
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

        if ((!form.groupId || !form.sessionId) && !editingId) {
            setError('يجب اختيار المجموعة والجلسة');
            setSubmitting(false);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();

            if (editingId) {
                // Edit (Reschedule)
                const res = await fetch(`${API_URL}/api/specialist/sessions/${editingId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ scheduled_at: scheduledAt })
                });
                if (!res.ok) throw new Error('فشل تعديل الموعد');
            } else {
                // Create New
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
                if (!res.ok) throw new Error('فشل جدولة الجلسة');
            }

            await fetchData();
            setShowForm(false);
            setEditingId(null);
            resetForm();
            alert(editingId ? 'تم تعديل الموعد بنجاح' : 'تم جدولة الجلسة بنجاح');

        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setForm({ courseId: '', groupId: '', sessionId: '', date: '', time: '' });
    }

    const handleEdit = (session: any) => {
        // Need to find which course/group this session belongs to
        // Session object from API: { id, group_name, title, scheduled_at, group_id, course_id, ... }
        // Note: The API returns minimal info. Ideally we need group_id and course_id.
        // Let's assume we can match it from the title parsing or if API provides it.
        // Current API `GET /schedule` returns: id (group_session), group_id, course_id, session_id (nested object)

        // Let's rely on finding it in our `groups` list if possible, or assume simple edit (date/time only).
        // For simple edit (Reschedule), we only need Date/Time.
        // So we can simplify the form logic: If editing, show minimal form (Date/Time).

        const dateObj = new Date(session.scheduled_at);
        const dateStr = dateObj.toISOString().split('T')[0];
        const timeStr = dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        setEditingId(session.id);
        setForm(prev => ({ ...prev, date: dateStr, time: timeStr }));
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (sessionId: string) => {
        if (!confirm('هل أنت متأكد من حذف/إلغاء هذه الجلسة؟\nسيتم إزالتها من الجدول.')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/specialist/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                fetchData();
            } else {
                const d = await res.json();
                alert(d.error || 'فشل الحذف');
            }
        } catch (err) {
            console.error(err);
            alert('حدث خطأ');
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
                            onClick={() => {
                                setShowForm(!showForm);
                                setEditingId(null);
                                resetForm();
                            }}
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

                    {/* New/Edit Session Form */}
                    {showForm && (
                        <div className="card-love p-6 mb-8 animate-in slide-in-from-top-4 border-2 border-primary/20">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                {editingId ? <Edit2 className="w-5 h-5 text-blue-600" /> : <CalendarPlus className="w-5 h-5 text-primary" />}
                                {editingId ? 'تعديل موعد الجلسة' : 'جدولة جلسة لمجموعة'}
                            </h2>

                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* Only show Course/Group selection if NOT editing */}
                                {!editingId && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold mb-2 text-foreground">الكورس</label>
                                                <select
                                                    value={form.courseId}
                                                    onChange={(e) => handleCourseChange(e.target.value)}
                                                    className="w-full p-3 rounded-lg border border-border bg-background text-foreground"
                                                    required={!editingId}
                                                >
                                                    <option value="">اختر الكورس...</option>
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
                                                    required={!editingId}
                                                >
                                                    <option value="">اختر المجموعة...</option>
                                                    {availableGroups.map(g => (
                                                        <option key={g.id} value={g.id}>{g.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold mb-2 text-foreground">الجلسة (من المنهج)</label>
                                            <select
                                                value={form.sessionId}
                                                onChange={(e) => setForm({ ...form, sessionId: e.target.value })}
                                                className="w-full p-3 rounded-lg border border-border bg-background text-foreground"
                                                required={!editingId}
                                            >
                                                <option value="">اختر الجلسة...</option>
                                                {syllabus.map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        الجلسة {s.session_number}: {s.title || 'بدون عنوان'}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

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

                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="btn-primary flex-1 py-3 text-lg"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (editingId ? 'حفظ التعديلات' : 'حفظ الجلسة')}
                                    </button>
                                    {editingId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingId(null);
                                                setShowForm(false);
                                                resetForm();
                                            }}
                                            className="px-6 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200"
                                        >
                                            إلغاء
                                        </button>
                                    )}
                                </div>
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
                                        {/* Date formatting updated as requested */}
                                        <span className="bg-primary/5 px-2 py-1 rounded-md">
                                            {new Date(session.scheduled_at || session.created_at).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </span>
                                        <span className="text-muted-foreground">|</span>
                                        <span className="bg-primary/5 px-2 py-1 rounded-md" dir="ltr">
                                            {new Date(session.scheduled_at || session.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                        </span>
                                    </p>
                                </div>

                                {activeTab === 'upcoming' && (
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <Link
                                            href={`/session/${session.id}`}
                                            className="btn-primary flex-1 md:flex-none text-center px-4 py-2 text-sm"
                                        >
                                            بدء الآن
                                        </Link>
                                        <button
                                            onClick={() => handleEdit(session)}
                                            className="px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                            title="تعديل الموعد"
                                        >
                                            <Edit2 className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(session.id)}
                                            className="px-3 py-2 text-destructive bg-destructive/10 rounded-lg hover:bg-destructive/20 transition-colors"
                                            title="إلغاء الجلسة"
                                        >
                                            <Trash2 className="w-5 h-5" />
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
