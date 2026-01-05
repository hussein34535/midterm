"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Plus, Edit, Trash2, Loader2, Users, X, Save } from "lucide-react";
import Header from "@/components/layout/Header";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Course {
    id: string;
    title: string;
    description: string;
    price: number;
    total_sessions: number;
    specialist?: { id: string; nickname: string };
    specialist_id?: string;
    created_at: string;
}

interface Specialist {
    id: string;
    nickname: string;
}

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [specialists, setSpecialists] = useState<Specialist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: 0,
        total_sessions: 4,
        specialist_id: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchCourses();
        fetchSpecialists();
    }, []);

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/courses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setCourses(data.courses || []);
            }
        } catch (err) {
            setError('فشل في جلب الكورسات');
        } finally {
            setLoading(false);
        }
    };

    const fetchSpecialists = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/specialists`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                setSpecialists(data.specialists || []);
            }
        } catch (err) {
            console.error('Failed to fetch specialists');
        }
    };

    const handleDelete = async (courseId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الكورس؟')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/courses/${courseId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setCourses(courses.filter(c => c.id !== courseId));
                toast.success('تم حذف الكورس');
            } else {
                toast.error('فشل في حذف الكورس');
            }
        } catch (err) {
            toast.error('فشل في حذف الكورس');
        }
    };

    const handleEdit = (course: Course) => {
        setEditingCourse(course);
        setFormData({
            title: course.title,
            description: course.description || '',
            price: course.price,
            total_sessions: course.total_sessions,
            specialist_id: course.specialist_id || course.specialist?.id || ''
        });
        setShowForm(true);
    };

    const handleNewCourse = () => {
        setEditingCourse(null);
        setFormData({
            title: '',
            description: '',
            price: 0,
            total_sessions: 4,
            specialist_id: ''
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim()) {
            toast.error('أدخل عنوان الكورس');
            return;
        }

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const url = editingCourse
                ? `${API_URL}/api/courses/${editingCourse.id}`
                : `${API_URL}/api/courses`;

            const res = await fetch(url, {
                method: editingCourse ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success(editingCourse ? 'تم تحديث الكورس' : 'تم إنشاء الكورس');
                setShowForm(false);
                fetchCourses();
            } else {
                const data = await res.json();
                toast.error(data.error || 'حدث خطأ');
            }
        } catch (err) {
            toast.error('حدث خطأ');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-warm-mesh min-h-screen flex flex-col" dir="rtl">
            <Header />

            <main className="flex-grow pb-20 pt-32">
                <div className="container mx-auto px-6 max-w-5xl">

                    {/* Breadcrumb */}
                    <div className="mb-8">
                        <Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 font-medium">
                            <ArrowRight className="w-4 h-4" />
                            العودة للوحة الإدارة
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-foreground mb-2 flex items-center gap-3">
                                <BookOpen className="w-8 h-8 text-primary" />
                                إدارة الكورسات
                            </h1>
                            <p className="text-muted-foreground">إنشاء وتعديل وحذف الكورسات</p>
                        </div>
                        <button onClick={handleNewCourse} className="btn-primary flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            كورس جديد
                        </button>
                    </div>

                    {/* Form Modal */}
                    {showForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                            <div className="card-love p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-foreground">
                                        {editingCourse ? 'تعديل الكورس' : 'كورس جديد'}
                                    </h2>
                                    <button onClick={() => setShowForm(false)} className="p-2 hover:bg-secondary rounded-lg">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-foreground mb-2">عنوان الكورس *</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
                                            placeholder="مثال: التعامل مع القلق"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-foreground mb-2">الوصف</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none resize-none h-24"
                                            placeholder="وصف مختصر للكورس..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-foreground mb-2">السعر (ج.م)</label>
                                            <input
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-foreground mb-2">عدد الجلسات</label>
                                            <input
                                                type="number"
                                                value={formData.total_sessions}
                                                onChange={(e) => setFormData({ ...formData, total_sessions: Number(e.target.value) })}
                                                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
                                                min="1"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-foreground mb-2">الأخصائي</label>
                                        <select
                                            value={formData.specialist_id}
                                            onChange={(e) => setFormData({ ...formData, specialist_id: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
                                        >
                                            <option value="">-- اختر أخصائي --</option>
                                            {specialists.map(s => (
                                                <option key={s.id} value={s.id}>{s.nickname}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="btn-primary flex-1 justify-center"
                                        >
                                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                            {editingCourse ? 'حفظ التعديلات' : 'إنشاء الكورس'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowForm(false)}
                                            className="btn-outline px-6"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="card-love p-6 text-center text-destructive">{error}</div>
                    ) : courses.length === 0 ? (
                        <div className="card-love p-12 text-center">
                            <BookOpen className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-2">لا توجد كورسات</h3>
                            <p className="text-muted-foreground mb-6">ابدأ بإنشاء أول كورس</p>
                            <button onClick={handleNewCourse} className="btn-primary">
                                <Plus className="w-5 h-5" />
                                إنشاء كورس
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {courses.map((course) => (
                                <div key={course.id} className="card-love p-6 flex items-center gap-6 group hover:border-primary/30 transition-all">
                                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-1">{course.description}</p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {course.specialist?.nickname || 'بدون أخصائي'}
                                            </span>
                                            <span>{course.total_sessions} جلسات</span>
                                            <span className="font-bold text-primary">
                                                {course.price === 0 ? 'مجاني' : `${course.price} ج.م`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleEdit(course)}
                                            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <Edit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(course.id)}
                                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
