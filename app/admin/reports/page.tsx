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
    periodRevenue?: number;
    recentRevenue: { date: string; revenue: number }[];
    recentUsers: { date: string; users: number }[];
    transactions?: {
        id: string;
        amount: number;
        date: string;
        user: string;
        course: string;
    }[];
}

export default function ReportsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<ReportStats | null>(null);
    const [period, setPeriod] = useState('30');

    const fetchReports = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/reports?period=${period}`, {
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
    }, []);

    useEffect(() => {
        fetchReports();
    }, [period]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="min-h-screen bg-gray-50" dir="rtl">
            <Header />
            <main className="container mx-auto px-4 py-6 pt-24 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">التقارير والإحصائيات</h1>
                            <p className="text-gray-500">نظرة شاملة على أداء المنصة</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 flex-wrap">
                        <div className="relative flex items-center ml-2 pl-2 border-l border-gray-100">
                            <input
                                type="number"
                                min="1"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="w-20 px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 text-center"
                                placeholder="أيام"
                            />
                            <span className="text-xs text-gray-400 mr-2">يوم</span>
                        </div>
                        <button
                            onClick={() => setPeriod('7')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${period === '7' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            7
                        </button>
                        <button
                            onClick={() => setPeriod('30')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${period === '30' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            30
                        </button>
                        <button
                            onClick={() => setPeriod('90')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${period === '90' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            90
                        </button>
                        <button
                            onClick={() => setPeriod('365')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${period === '365' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            سنة
                        </button>
                    </div>
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
                                نمو الإيرادات (آخر {period} يوم)
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
                                المستخدمين الجدد (آخر {period} يوم)
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

                {/* Transactions Table (Detailed Reports) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
                    <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-lg">سجل المعاملات المالية</h3>
                            <p className="text-gray-500 text-sm">تفاصيل الدفعات للفترة المحددة</p>
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            طباعة تقرير
                        </button>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-right p-4 text-sm font-medium text-gray-500">رقم العملية</th>
                                    <th className="text-right p-4 text-sm font-medium text-gray-500">المستخدم</th>
                                    <th className="text-right p-4 text-sm font-medium text-gray-500">الكورس</th>
                                    <th className="text-right p-4 text-sm font-medium text-gray-500">التاريخ</th>
                                    <th className="text-left p-4 text-sm font-medium text-gray-500">المبلغ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {stats.transactions && stats.transactions.length > 0 ? (
                                    stats.transactions.map((tx: any) => (
                                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-4 text-sm font-mono text-gray-600">#{tx.id.slice(0, 8)}</td>
                                            <td className="p-4 text-sm font-medium text-gray-900">{tx.user}</td>
                                            <td className="p-4 text-sm text-gray-600">{tx.course}</td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {new Date(tx.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-4 text-left font-bold text-green-600 dir-ltr">{Number(tx.amount).toLocaleString()} ج.م</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            لا توجد عمليات في هذه الفترة
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden">
                        {stats.transactions && stats.transactions.length > 0 ? (
                            <div className="divide-y divide-gray-100">
                                {stats.transactions.map((tx: any) => (
                                    <div key={tx.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">#{tx.id.slice(0, 8)}</span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(tx.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm">{tx.user}</h4>
                                                <p className="text-xs text-gray-500 mt-0.5">{tx.course}</p>
                                            </div>
                                            <span className="font-bold text-green-600 dir-ltr text-lg">{Number(tx.amount).toLocaleString()} ج.م</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                لا توجد عمليات في هذه الفترة
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
