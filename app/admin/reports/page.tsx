"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    TrendingUp,
    Users,
    BookOpen,
    Video,
    DollarSign,
    Loader2,
    Calendar,
    Download
} from "lucide-react";
import Header from "@/components/layout/Header";
import { toast } from "sonner";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ReportStats {
    totalUsers: number;
    totalCourses: number;
    totalSessions: number;
    totalRevenue: number;
    recentRevenue: { date: string; revenue: number }[];
    recentUsers: { date: string; users: number }[];
}

export default function ReportsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ReportStats | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const user = JSON.parse(storedUser);
        if (user.role !== 'owner' && user.role !== 'admin') {
            toast.error('غير مصرح لك بدخول هذه الصفحة');
            router.push('/admin');
            return;
        }
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
            } else {
                toast.error('فشل جلب التقارير');
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-6 pt-24 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h1>
                        <p className="text-gray-500">نظرة شاملة على أداء المنصة</p>
                    </div>
                    {/* <button className="px-4 py-2 border rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm font-medium">
                        <Download className="w-4 h-4" />
                        تصدير PDF
                    </button> */}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Revenue */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">+12%</span>
                        </div>
                        <p className="text-gray-500 text-sm mb-1">إجمالي الإيرادات</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.totalRevenue.toLocaleString()} <span className="text-base font-normal text-gray-400">ج.م</span></h3>
                    </div>

                    {/* Users */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <Users className="w-6 h-6" />
                            </div>
                            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">+5%</span>
                        </div>
                        <p className="text-gray-500 text-sm mb-1">إجمالي المستخدمين</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</h3>
                    </div>

                    {/* Courses */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                <BookOpen className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm mb-1">الكورسات النشطة</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.totalCourses}</h3>
                    </div>

                    {/* Sessions */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                                <Video className="w-6 h-6" />
                            </div>
                        </div>
                        <p className="text-gray-500 text-sm mb-1">الجلسات المجدولة</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.totalSessions}</h3>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Revenue Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                نمو الإيرادات (آخر 30 يوم)
                            </h3>
                        </div>
                        <div className="h-[300px] w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.recentRevenue}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => new Date(str).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `${val} ج.م`}
                                    />
                                    <Tooltip
                                        formatter={(val) => [`${val} ج.م`, 'الإيرادات']}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Users Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-500" />
                                المستخدمين الجدد (آخر 30 يوم)
                            </h3>
                        </div>
                        <div className="h-[300px] w-full" dir="ltr">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.recentUsers}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(str) => new Date(str).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#9ca3af"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        formatter={(val) => [`${val} مستخدم`, 'المستخدمين']}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                        cursor={{ fill: '#f3f4f6' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar
                                        dataKey="users"
                                        fill="#3b82f6"
                                        radius={[4, 4, 0, 0]}
                                        barSize={20}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
