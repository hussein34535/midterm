"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, LayoutDashboard, Settings, LogOut, ShieldAlert, DollarSign, Sparkles, Loader2, TrendingUp } from "lucide-react";
import Header from "@/components/layout/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ users: 0, specialists: 0, totalSessions: 0, activeSessions: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('يجب تسجيل الدخول أولاً');
                setLoading(false);
                return;
            }

            const res = await fetch(`${API_URL}/api/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'فشل في جلب البيانات');
            }

            const data = await res.json();
            setStats(data.stats);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
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
                            <ShieldAlert className="w-4 h-4" />
                            <span>لوحة الإدارة</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-3">
                            نظرة عامة على المنصة
                        </h1>
                        <p className="text-muted-foreground text-lg">تحكم كامل في جميع جوانب النظام 🔐</p>
                    </div>

                    {error && (
                        <div className="card-love p-4 mb-8 bg-destructive/10 border-destructive/20 text-destructive text-center">
                            {error}
                        </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="card-love p-6 flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-all">
                            <Users className="w-8 h-8 text-primary mb-2" />
                            <h3 className="text-muted-foreground font-medium">المستخدمين</h3>
                            <p className="text-3xl font-bold mt-2 text-foreground">{stats.users}</p>
                        </div>
                        <div className="card-love p-6 flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-all">
                            <ShieldAlert className="w-8 h-8 text-primary mb-2" />
                            <h3 className="text-muted-foreground font-medium">الأخصائيين</h3>
                            <p className="text-3xl font-bold mt-2 text-foreground">{stats.specialists}</p>
                        </div>
                        <div className="card-love p-6 flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-all">
                            <LayoutDashboard className="w-8 h-8 text-primary mb-2" />
                            <h3 className="text-muted-foreground font-medium">إجمالي الجلسات</h3>
                            <p className="text-3xl font-bold mt-2 text-foreground">{stats.totalSessions}</p>
                        </div>
                        <div className="card-love p-6 flex flex-col items-center justify-center text-center group hover:border-primary/30 transition-all">
                            <Settings className="w-8 h-8 text-primary mb-2" />
                            <h3 className="text-muted-foreground font-medium">جلسات نشطة</h3>
                            <p className="text-3xl font-bold mt-2 text-foreground">{stats.activeSessions}</p>
                        </div>
                    </div>

                    {/* Financials (Owner Only Mock) */}
                    <div className="card-love p-6 mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <DollarSign className="w-6 h-6 text-primary" />
                            <h2 className="text-xl font-bold text-foreground">التقرير المالي (المالك فقط)</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                                <p className="text-sm text-muted-foreground">إجمالي الدخل</p>
                                <p className="text-2xl font-bold text-foreground">$12,450</p>
                            </div>
                            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                                <p className="text-sm text-muted-foreground">دخل هذا الشهر</p>
                                <p className="text-2xl font-bold text-foreground">$3,200</p>
                            </div>
                            <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                                <p className="text-sm text-muted-foreground">أرباح المعالجين</p>
                                <p className="text-2xl font-bold text-foreground">$8,500</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Link href="/admin/users" className="card-love p-6 flex items-center gap-4 group hover:border-primary/50 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                                <Users className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">إدارة المستخدمين</h3>
                                <p className="text-muted-foreground text-sm">عرض وتعديل الصلاحيات</p>
                            </div>
                        </Link>
                        <Link href="/admin/courses" className="card-love p-6 flex items-center gap-4 group hover:border-primary/50 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                                <LayoutDashboard className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground group-hover:text-blue-500 transition-colors">إدارة الكورسات</h3>
                                <p className="text-muted-foreground text-sm">إنشاء وتعديل الكورسات</p>
                            </div>
                        </Link>
                        <Link href="/admin/groups" className="card-love p-6 flex items-center gap-4 group hover:border-primary/50 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500/20 transition-colors">
                                <Users className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground group-hover:text-indigo-500 transition-colors">إدارة المجموعات</h3>
                                <p className="text-muted-foreground text-sm">توزيع المجموعات والأخصائيين</p>
                            </div>
                        </Link>
                        <Link href="/admin/payments" className="card-love p-6 flex items-center gap-4 group hover:border-primary/50 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:bg-green-500/20 transition-colors">
                                <DollarSign className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground group-hover:text-green-500 transition-colors">إدارة المدفوعات</h3>
                                <p className="text-muted-foreground text-sm">تأكيد ورفض الدفعات</p>
                            </div>
                        </Link>
                        <Link href="/admin/specialists" className="card-love p-6 flex items-center gap-4 group hover:border-primary/50 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500/20 transition-colors">
                                <ShieldAlert className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground group-hover:text-amber-500 transition-colors">إدارة الأخصائيين</h3>
                                <p className="text-muted-foreground text-sm">إدارة حسابات الأخصائيين</p>
                            </div>
                        </Link>
                        <Link href="/admin/messages" className="card-love p-6 flex items-center gap-4 group hover:border-primary/50 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                                <Sparkles className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground group-hover:text-purple-500 transition-colors">إدارة الرسائل</h3>
                                <p className="text-muted-foreground text-sm">عرض وحذف الرسائل</p>
                            </div>
                        </Link>
                        <Link href="/admin/reports" className="card-love p-6 flex items-center gap-4 group hover:border-primary/50 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                                <TrendingUp className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground group-hover:text-blue-500 transition-colors">التقارير والإحصائيات</h3>
                                <p className="text-muted-foreground text-sm">متابعة أداء المنصة</p>
                            </div>
                        </Link>
                        <Link href="/admin/settings" className="card-love p-6 flex items-center gap-4 group hover:border-primary/50 transition-all">
                            <div className="w-14 h-14 rounded-2xl bg-gray-500/10 flex items-center justify-center text-gray-500 group-hover:bg-gray-500/20 transition-colors">
                                <Settings className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground group-hover:text-gray-500 transition-colors">إعدادات المنصة</h3>
                                <p className="text-muted-foreground text-sm">تخصيص الإعدادات (المالك فقط)</p>
                            </div>
                        </Link>
                    </div>

                </div>
            </main>
        </div>
    );
}
