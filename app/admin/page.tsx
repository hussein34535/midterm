"use client";

import Link from "next/link";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    CreditCard,
    Settings,
    Bell,
    Search,
    ChevronDown,
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Wifi
} from "lucide-react";
import { useState } from "react";

// Types
type NavItem = {
    icon: any;
    label: string;
    active?: boolean;
    href?: string;
};

// Sidebar Component
const Sidebar = () => {
    const navItems: NavItem[] = [
        { icon: LayoutDashboard, label: "لوحة التحكم", active: true },
        { icon: Users, label: "المستخدمين" },
        { icon: BookOpen, label: "الكورسات" },
        { icon: CreditCard, label: "المدفوعات" },
        { icon: Calendar, label: "الجلسات" },
        { icon: Settings, label: "الإعدادات" },
    ];

    return (
        <aside className="fixed right-0 top-0 h-screen w-72 bg-[var(--bg-darker)] border-l border-[var(--glass-border)] hidden lg:flex flex-col z-50">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-8 border-b border-[var(--glass-border)]">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center shadow-lg shadow-[var(--primary)]/20">
                        <Wifi className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[var(--text-secondary)]">
                        سكينة
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-8 px-4 space-y-2">
                {navItems.map((item, index) => (
                    <button
                        key={index}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${item.active
                                ? "bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm border border-[var(--primary)]/20"
                                : "text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-white"
                            }`}
                    >
                        <item.icon className={`w-5 h-5 ${item.active ? "text-[var(--primary)]" : "group-hover:text-white transition-colors"}`} />
                        <span className="font-medium">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* User Profile Snippet */}
            <div className="p-4 border-t border-[var(--glass-border)]">
                <div className="glass-card p-3 flex items-center gap-3 cursor-pointer hover:bg-[var(--surface-glass-hover)]">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] font-bold">
                        A
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold text-white truncate">أدمن النظام</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">admin@sakina.app</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                </div>
            </div>
        </aside>
    );
};

// Top Header Component
const Header = () => {
    return (
        <header className="h-20 border-b border-[var(--glass-border)] bg-[var(--bg-dark)]/80 backdrop-blur-xl sticky top-0 z-40 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
                <div className="relative w-full">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                        type="text"
                        placeholder="بحث في النظام..."
                        className="w-full input-field rounded-xl py-2.5 pr-10 pl-4 text-sm text-white focus:outline-none focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/50 transition-all placeholder:text-[var(--text-muted)]"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 mr-4">
                <button className="relative w-10 h-10 rounded-xl bg-[var(--bg-card)] border border-[var(--glass-border)] flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:border-[var(--text-muted)]/30 transition-all">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 left-2.5 w-2 h-2 rounded-full bg-[var(--error)] border border-[var(--bg-dark)]"></span>
                </button>
                <Link href="/" className="btn-secondary py-2 px-4 text-sm">
                    العودة للموقع
                </Link>
            </div>
        </header>
    );
};

// Stat Card Component
const StatCard = ({ title, value, change, isPositive, icon: Icon, colorClass }: any) => {
    return (
        <div className="glass-card p-6 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${colorClass}`}>
                <Icon className="w-24 h-24" />
            </div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border ${isPositive
                        ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20"
                        : "bg-[var(--error)]/10 text-[var(--error)] border-[var(--error)]/20"
                    }`}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {change}
                </div>
            </div>

            <div className="relative z-10">
                <h3 className="text-[var(--text-muted)] text-sm font-medium mb-1">{title}</h3>
                <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
            </div>
        </div>
    );
};

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-dark)] lg:pr-72">
            <Sidebar />

            <div className="flex flex-col min-h-screen">
                <Header />

                <main className="flex-1 p-8 animate-fade-in">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">لوحة المعلومات</h1>
                        <p className="text-[var(--text-muted)]">نظرة عامة على أداء المنصة والإحصائيات الرئيسية.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="إجمالي المستخدمين"
                            value="12,345"
                            change="+12%"
                            isPositive={true}
                            icon={Users}
                            colorClass="text-[var(--primary)] bg-[var(--primary)]"
                        />
                        <StatCard
                            title="الكورسات النشطة"
                            value="24"
                            change="+4%"
                            isPositive={true}
                            icon={BookOpen}
                            colorClass="text-[var(--secondary)] bg-[var(--secondary)]"
                        />
                        <StatCard
                            title="إيرادات الشهر"
                            value="45,230 ج.م"
                            change="-2.5%"
                            isPositive={false}
                            icon={CreditCard}
                            colorClass="text-[var(--accent-teal)] bg-[var(--accent-teal)]"
                        />
                        <StatCard
                            title="جلسات اليوم"
                            value="8"
                            change="+1"
                            isPositive={true}
                            icon={Calendar}
                            colorClass="text-[var(--accent-orange)] bg-[var(--accent-orange)]"
                        />
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                        {/* Active Courses Table */}
                        <div className="xl:col-span-2 glass-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white">الكورسات النشطة</h2>
                                <button className="text-xs font-semibold text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
                                    عرض الكل
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="table-base">
                                    <thead>
                                        <tr>
                                            <th>اسم الكورس</th>
                                            <th className="text-center">المقاعد</th>
                                            <th className="text-center">الحالة</th>
                                            <th className="text-center">التقدم</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { name: "التعامل مع القلق المزمن", seats: "8/10", status: "نشط", progress: 60 },
                                            { name: "بناء تقدير الذات", seats: "12/15", status: "مكتمل", progress: 100 },
                                            { name: "إدارة ضغوط العمل", seats: "5/10", status: "قريباً", progress: 0 },
                                            { name: "التشافي من الصدمات", seats: "10/10", status: "نشط", progress: 25 },
                                        ].map((course, idx) => (
                                            <tr key={idx} className="group hover:bg-[var(--bg-card-hover)] transition-colors">
                                                <td className="font-medium text-white">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-dark)] flex items-center justify-center text-[var(--text-muted)] text-xs font-bold border border-[var(--glass-border)]">
                                                            {idx + 1}
                                                        </div>
                                                        {course.name}
                                                    </div>
                                                </td>
                                                <td className="text-center text-[var(--text-secondary)] font-mono text-sm">{course.seats}</td>
                                                <td className="text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${course.status === "نشط" ? "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20" :
                                                            course.status === "مكتمل" ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20" :
                                                                "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20"
                                                        }`}>
                                                        {course.status}
                                                    </span>
                                                </td>
                                                <td className="text-center align-middle">
                                                    <div className="w-24 h-1.5 bg-[var(--bg-dark)] rounded-full mx-auto overflow-hidden">
                                                        <div
                                                            className="h-full bg-[var(--primary)] rounded-full"
                                                            style={{ width: `${course.progress}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="text-left">
                                                    <button className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-dark)] transition-colors">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-white">أحدث العمليات</h2>
                                <button className="p-1.5 rounded-lg hover:bg-[var(--bg-dark)] transition-colors">
                                    <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { user: "أحمد محمد", type: "اشتراك كورس", amount: "+450", time: "منذ 5 د", status: "success" },
                                    { user: "سارة علي", type: "جلسة فردية", amount: "+200", time: "منذ 25 د", status: "success" },
                                    { user: "محمود حسن", type: "استرداد", amount: "-450", time: "منذ ساعة", status: "error" },
                                    { user: "نور الهدى", type: "اشتراك كورس", amount: "+350", time: "منذ ساعتين", status: "pending" },
                                ].map((tx, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-dark)]/50 transition-colors border border-transparent hover:border-[var(--border-glass)] cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${tx.status === "success" ? "bg-[var(--success)]/10 text-[var(--success)]" :
                                                    tx.status === "error" ? "bg-[var(--error)]/10 text-[var(--error)]" :
                                                        "bg-[var(--warning)]/10 text-[var(--warning)]"
                                                }`}>
                                                {tx.status === "success" ? "↓" : tx.status === "error" ? "↑" : "•"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{tx.user}</p>
                                                <p className="text-xs text-[var(--text-muted)]">{tx.type} • {tx.time}</p>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-mono font-bold ${tx.status === "error" ? "text-[var(--text-primary)]" : "text-[var(--success)]"
                                            }`}>
                                            {tx.amount}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-6 btn-secondary py-2 text-sm justify-center">
                                عرض كل العمليات
                            </button>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
