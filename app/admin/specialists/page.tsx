"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Shield, UserPlus, Edit, Trash2, Loader2, Mail, CheckCircle, XCircle } from "lucide-react";
import Header from "@/components/layout/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Specialist {
    id: string;
    nickname: string;
    email: string;
    avatar?: string;
    created_at: string;
    courses_count?: number;
}

export default function AdminSpecialistsPage() {
    const [specialists, setSpecialists] = useState<Specialist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSpecialists();
    }, []);

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
            setError('فشل في جلب الأخصائيين');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (specialistId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الأخصائي؟')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/users/${specialistId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setSpecialists(specialists.filter(s => s.id !== specialistId));
            }
        } catch (err) {
            alert('فشل في حذف الأخصائي');
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
                                <Shield className="w-8 h-8 text-amber-500" />
                                إدارة الأخصائيين
                            </h1>
                            <p className="text-muted-foreground">إضافة وإدارة حسابات الأخصائيين</p>
                        </div>
                        <button className="btn-primary flex items-center gap-2">
                            <UserPlus className="w-5 h-5" />
                            إضافة أخصائي
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : error ? (
                        <div className="card-love p-6 text-center text-destructive">{error}</div>
                    ) : specialists.length === 0 ? (
                        <div className="card-love p-12 text-center">
                            <Shield className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-2">لا يوجد أخصائيين</h3>
                            <p className="text-muted-foreground mb-6">ابدأ بإضافة أول أخصائي</p>
                            <button className="btn-primary">
                                <UserPlus className="w-5 h-5" />
                                إضافة أخصائي
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {specialists.map((specialist) => (
                                <div key={specialist.id} className="card-love p-6 group hover:border-primary/30 transition-all">
                                    <div className="flex items-start gap-4">
                                        <div className="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center overflow-hidden border-2 border-amber-500/20">
                                            {specialist.avatar ? (
                                                <img src={specialist.avatar} alt={specialist.nickname} className="w-full h-full object-cover" />
                                            ) : (
                                                <Shield className="w-6 h-6 text-amber-500" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                                {specialist.nickname}
                                            </h3>
                                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                                                ID: {specialist.id.substring(0, 8)}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2 text-xs">
                                                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700">
                                                    <CheckCircle className="w-3 h-3" />
                                                    نشط
                                                </span>
                                                <span className="text-muted-foreground">
                                                    {specialist.courses_count || 0} كورسات
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(specialist.id)}
                                                className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
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
