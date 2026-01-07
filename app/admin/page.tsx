"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Users, LayoutDashboard, Settings, LogOut, ShieldAlert, DollarSign,
    Sparkles, Loader2, TrendingUp, FileText, UserPlus, BookOpen,
    Contact2, Wallet, BadgeCheck, BellRing, ScrollText, BarChart3,
    Settings2
} from "lucide-react";
import Header from "@/components/layout/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        specialists: 0,
        totalSessions: 0,
        activeSessions: 0,
        totalRevenue: 0,
        monthlyRevenue: 0,
        pendingRevenue: 0
    });
    const [pendingPayments, setPendingPayments] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchStats();
        fetchPendingPayments();
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

    const fetchPendingPayments = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/payments?status=pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPendingPayments(data.payments?.length || 0);
            }
        } catch (err) {
            console.error('Failed to fetch pending payments');
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

            <main className="flex-grow pb-24 pt-24 md:pt-32">
                <div className="container mx-auto px-4 md:px-6 max-w-5xl">

                    <div className="flex flex-col gap-1 md:gap-2 mb-8 md:mb-12">
                        <div className="flex items-center gap-3">
                            <div className="w-1 md:w-1.5 h-6 md:h-8 bg-primary rounded-full shadow-sm shadow-primary/20" />
                            <h1 className="text-3xl md:text-5xl font-black text-foreground tracking-tight">لوحة التحكم</h1>
                        </div>
                        <p className="text-muted-foreground/60 text-sm md:text-lg font-medium pr-4 border-r-2 border-primary/5 italic truncate">أهلاً بك مجدداً يا مدير 🗝️</p>
                    </div>

                    {error && (
                        <div className="card-love p-4 mb-8 bg-red-500/5 border-red-500/10 text-red-600 rounded-3xl text-center font-bold">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-8 md:mb-10">
                        {[
                            { label: "المستخدمين", value: stats.users, icon: Users },
                            { label: "الأخصائيين", value: stats.specialists, icon: ShieldAlert },
                            { label: "الجلسات", value: stats.totalSessions, icon: LayoutDashboard },
                            { label: "نشطة الآن", value: stats.activeSessions, icon: Settings }
                        ].map((stat, i) => (
                            <div key={i} className="card-love p-4 md:p-5 flex items-center gap-3 md:gap-4 group hover:bg-white/80 transition-all active:scale-95">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-inner">
                                    <stat.icon className="w-5 h-5 md:w-6 md:h-6 stroke-[2]" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-muted-foreground/70 mb-1">{stat.label}</p>
                                    <h3 className="text-xl md:text-2xl font-black text-foreground leading-none tabular-nums tracking-tighter">{stat.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mb-14">
                        <div className="flex items-center gap-2 mb-6 px-4">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <h2 className="text-xs font-bold text-muted-foreground/60">التقرير المالي الموحد</h2>
                        </div>
                        <div className="card-love p-2 flex flex-row items-center divide-x divide-x-reverse divide-primary/10 overflow-hidden bg-white/50 backdrop-blur-sm">
                            <div className="flex-1 p-6 text-center group hover:bg-white/40 transition-colors rounded-r-2xl">
                                <span className="block text-xs md:text-sm font-bold text-muted-foreground/70 mb-2">الإجمالي</span>
                                <span className="text-2xl md:text-4xl font-black text-foreground tabular-nums tracking-tight">{stats.totalRevenue?.toLocaleString()} <small className="text-xs font-bold opacity-40">ج.م</small></span>
                            </div>
                            <div className="flex-1 p-6 text-center bg-primary/[0.03] relative overflow-hidden group hover:bg-primary/[0.06] transition-colors">
                                <span className="block text-xs md:text-sm font-bold text-primary/80 mb-2">هذا الشهر</span>
                                <span className="text-3xl md:text-5xl font-black text-primary tabular-nums tracking-tight">{stats.monthlyRevenue?.toLocaleString()} <small className="text-xs font-bold opacity-40">ج.م</small></span>
                            </div>
                            <div className="flex-1 p-6 text-center group hover:bg-white/40 transition-colors rounded-l-2xl">
                                <span className="block text-xs md:text-sm font-bold text-muted-foreground/70 mb-2">معلق</span>
                                <span className="text-2xl md:text-4xl font-black text-foreground/80 tabular-nums tracking-tight">{stats.pendingRevenue?.toLocaleString()} <small className="text-xs font-bold opacity-40">ج.م</small></span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-20 px-1">
                        {[
                            { name: "المستخدمين", href: "/admin/users", icon: UserPlus, desc: "التحكم في الحسابات والأدوار", color: "text-indigo-600", bg: "bg-indigo-50/80" },
                            { name: "المناهج", href: "/admin/courses", icon: BookOpen, desc: "المحتويات العلمية والدروس", color: "text-rose-600", bg: "bg-rose-50/80" },
                            { name: "المجموعات", href: "/admin/groups", icon: Contact2, desc: "توزيع الطلاب والفرق التعليمية", color: "text-emerald-600", bg: "bg-emerald-50/80" },
                            { name: "المدفوعات", href: "/admin/payments", icon: Wallet, desc: "تأكيد التحصيلات البنكية", color: "text-amber-600", bg: "bg-amber-50/80", badge: pendingPayments },
                            { name: "الأخصائيين", href: "/admin/specialists", icon: BadgeCheck, desc: "ملفات الكادر التعليمي والمهني", color: "text-blue-600", bg: "bg-blue-50/80" },
                            { name: "التنبيهات", href: "/admin/messages", icon: BellRing, desc: "مركز التواصل والدعم الفني", color: "text-purple-600", bg: "bg-purple-50/80" },
                            { name: "الفواتير", href: "/admin/invoices", icon: ScrollText, desc: "إصدار وطباعة الفواتير الرسمية", color: "text-pink-600", bg: "bg-pink-50/80" },
                            { name: "التقارير", href: "/admin/reports", icon: BarChart3, desc: "التقارير الإحصائية والنمو", color: "text-cyan-600", bg: "bg-cyan-50/80" },
                            { name: "الإعدادات", href: "/admin/settings", icon: Settings2, desc: "خيارات النظام والتحكم العام", color: "text-slate-600", bg: "bg-slate-50/80" },
                        ].map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="card-love p-4 md:p-6 flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-5 hover:border-primary/40 hover:bg-white transition-all group relative active:scale-[0.97] border-white/60 shadow-sm text-center md:text-right"
                            >
                                {item.badge && item.badge > 0 ? (
                                    <div className="absolute top-2 right-2 md:top-4 md:right-4 px-1.5 md:px-2 py-0.5 bg-primary text-white rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-black shadow-lg shadow-primary/30 border-2 border-white z-10 animate-pulse">
                                        {item.badge}
                                    </div>
                                ) : null}
                                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl ${item.bg} ${item.color} border border-white flex items-center justify-center group-hover:scale-110 group-hover:shadow-lg transition-all duration-500 relative overflow-hidden backdrop-blur-sm shrink-0`}>
                                    <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <item.icon className="w-5 h-5 md:w-7 md:h-7 stroke-[1.5] drop-shadow-sm relative z-10" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="text-[10px] md:text-lg font-black text-foreground group-hover:text-primary transition-colors leading-tight mb-0.5 truncate">{item.name}</h3>
                                    <p className="hidden md:block text-muted-foreground/40 text-[11px] font-black tracking-tight">{item.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>

                </div>
            </main>
        </div>
    );
}
