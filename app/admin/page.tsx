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
    Wifi,
    LogOut
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
        <aside className="fixed right-0 top-0 h-screen w-72 bg-background border-l border-border hidden lg:flex flex-col z-50">
            {/* Logo Area */}
            <div className="h-20 flex items-center px-8 border-b border-border">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-serif font-bold text-xl group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20">
                        س
                    </div>
                    <span className="text-2xl font-serif font-bold tracking-tight text-foreground">سكينة</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-8 px-4 space-y-2">
                {navItems.map((item, index) => (
                    <button
                        key={index}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${item.active
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                    >
                        <item.icon className="w-5 h-5 shrink-0" />
                        <span className="font-bold">{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* User Profile Snippet */}
            <div className="p-4 border-t border-border bg-secondary/30">
                <div className="flex items-center gap-3 cursor-pointer hover:bg-background p-2 rounded-xl transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/10">
                        A
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-foreground truncate">مدير النظام</p>
                        <p className="text-xs text-muted-foreground truncate">admin@sakina.app</p>
                    </div>
                    <LogOut className="w-4 h-4 text-muted-foreground hover:text-red-500 transition-colors" />
                </div>
            </div>
        </aside>
    );
};

// Top Header Component
const Header = () => {
    return (
        <header className="h-20 border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-40 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
                <div className="relative w-full">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="بحث في السجلات..."
                        className="w-full bg-secondary/50 border border-transparent rounded-xl py-2.5 pr-10 pl-4 text-sm text-foreground focus:outline-none focus:border-primary focus:bg-background transition-all placeholder:text-muted-foreground"
                    />
                </div>
            </div>

            <div className="flex items-center gap-4 mr-4">
                <button className="relative w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shadow-sm">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 left-2.5 w-2 h-2 rounded-full bg-red-500 border border-background"></span>
                </button>
                <Link href="/" className="px-4 py-2 rounded-xl bg-background border border-border text-sm font-bold text-foreground hover:border-primary hover:text-primary transition-all shadow-sm">
                    زيارة الموقع
                </Link>
            </div>
        </header>
    );
};

// Stat Card Component
const StatCard = ({ title, value, change, isPositive, icon: Icon, colorClass }: any) => {
    // Extract base color name (e.g., 'primary', 'blue-500') roughly or use standardized approach
    // For simplicity with new design system, we'll use consistent styling
    return (
        <div className="card-love p-6 relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Icon className="w-24 h-24 text-primary" />
            </div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                    <Icon className="w-6 h-6" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${isPositive
                    ? "bg-green-100 text-green-700 border-green-200"
                    : "bg-red-100 text-red-700 border-red-200"
                    }`}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {change}
                </div>
            </div>

            <div className="relative z-10">
                <h3 className="text-muted-foreground text-sm font-medium mb-1">{title}</h3>
                <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
            </div>
        </div>
    );
};

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-warm-mesh lg:pr-72" dir="rtl">
            <Sidebar />

            <div className="flex flex-col min-h-screen">
                <Header />

                <main className="flex-1 p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">لوحة المعلومات</h1>
                        <p className="text-muted-foreground">نظرة عامة على أداء المنصة والإحصائيات الحيوية.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <StatCard
                            title="إجمالي الأعضاء"
                            value="12,345"
                            change="+12%"
                            isPositive={true}
                            icon={Users}
                        />
                        <StatCard
                            title="الجلسات النشطة"
                            value="24"
                            change="+4%"
                            isPositive={true}
                            icon={BookOpen}
                        />
                        <StatCard
                            title="الإيرادات (شهر)"
                            value="45,230"
                            change="-2.5%"
                            isPositive={false}
                            icon={CreditCard}
                        />
                        <StatCard
                            title="جلسات اليوم"
                            value="8"
                            change="+1"
                            isPositive={true}
                            icon={Calendar}
                        />
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                        {/* Active Courses Table */}
                        <div className="xl:col-span-2 card-love p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-foreground">الجلسات النشطة</h2>
                                <button className="text-xs font-bold text-primary hover:underline transition-all">
                                    عرض الكل
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border/50">
                                            <th className="text-right py-3 text-muted-foreground font-medium text-sm">اسم الجلسة</th>
                                            <th className="text-center py-3 text-muted-foreground font-medium text-sm">المقاعد</th>
                                            <th className="text-center py-3 text-muted-foreground font-medium text-sm">الحالة</th>
                                            <th className="text-center py-3 text-muted-foreground font-medium text-sm">التقدم</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {[
                                            { name: "التعامل مع القلق المزمن", seats: "8/10", status: "نشط", progress: 60 },
                                            { name: "بناء تقدير الذات", seats: "12/15", status: "مكتمل", progress: 100 },
                                            { name: "إدارة ضغوط العمل", seats: "5/10", status: "قريباً", progress: 0 },
                                            { name: "التشافي من الصدمات", seats: "10/10", status: "نشط", progress: 25 },
                                        ].map((course, idx) => (
                                            <tr key={idx} className="group hover:bg-secondary/30 transition-colors">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                                                            {idx + 1}
                                                        </div>
                                                        <span className="font-bold text-foreground text-sm">{course.name}</span>
                                                    </div>
                                                </td>
                                                <td className="text-center text-muted-foreground font-mono text-sm">{course.seats}</td>
                                                <td className="text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${course.status === "نشط" ? "bg-green-100 text-green-700 border-green-200" :
                                                        course.status === "مكتمل" ? "bg-blue-100 text-blue-700 border-blue-200" :
                                                            "bg-yellow-100 text-yellow-700 border-yellow-200"
                                                        }`}>
                                                        {course.status}
                                                    </span>
                                                </td>
                                                <td className="text-center align-middle px-4">
                                                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full"
                                                            style={{ width: `${course.progress}%` }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="text-left">
                                                    <button className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-secondary transition-colors">
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
                        <div className="card-love p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-bold text-foreground">أحدث العمليات</h2>
                                <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                                    <Settings className="w-4 h-4 text-muted-foreground" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { user: "أحمد محمد", type: "اشتراك كورس", amount: "+450", time: "منذ 5 د", status: "success" },
                                    { user: "سارة علي", type: "جلسة فردية", amount: "+200", time: "منذ 25 د", status: "success" },
                                    { user: "محمود حسن", type: "استرداد", amount: "-450", time: "منذ ساعة", status: "error" },
                                    { user: "نور الهدى", type: "اشتراك كورس", amount: "+350", time: "منذ ساعتين", status: "pending" },
                                ].map((tx, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors border border-transparent hover:border-border cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm border ${tx.status === "success" ? "bg-green-100 text-green-700 border-green-200" :
                                                tx.status === "error" ? "bg-red-100 text-red-700 border-red-200" :
                                                    "bg-yellow-100 text-yellow-700 border-yellow-200"
                                                }`}>
                                                {tx.status === "success" ? "↓" : tx.status === "error" ? "↑" : "•"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{tx.user}</p>
                                                <p className="text-xs text-muted-foreground">{tx.type} • {tx.time}</p>
                                            </div>
                                        </div>
                                        <div className={`text-sm font-mono font-bold ${tx.status === "error" ? "text-red-600" : "text-green-600"
                                            }`}>
                                            {tx.amount}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-6 btn-outline py-2.5 text-sm justify-center font-bold">
                                عرض كل العمليات
                            </button>
                        </div>

                    </div>
                </main>
            </div>
        </div>
    );
}
