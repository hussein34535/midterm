"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    Search,
    Filter,
    Loader2,
    FileText,
    Calendar,
    Printer,
    Download,
    Eye,
    DollarSign,
    ExternalLink
} from "lucide-react";
import Header from "@/components/layout/Header";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Payment {
    id: string;
    amount: number;
    status: string;
    payment_method: string;
    created_at: string;
    user: {
        nickname: string;
        email: string;
    };
    course: {
        title: string;
    };
}

export default function InvoicesList() {
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState("all"); // all, today, week, month

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const user = JSON.parse(storedUser);
        if (user.role !== 'owner') {
            router.push('/dashboard');
            return;
        }
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const token = localStorage.getItem('token');
            // We fetch confirmed payments as they are the ones that need invoices
            const res = await fetch(`${API_URL}/api/admin/payments?status=confirmed`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPayments(data.payments || []);
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPayments = payments.filter(payment => {
        const matchesSearch =
            payment.user.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            payment.course.title.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (dateFilter === "all") return true;

        const date = new Date(payment.created_at);
        const today = new Date();

        if (dateFilter === "today") {
            return date.toDateString() === today.toDateString();
        }
        if (dateFilter === "week") {
            const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return date >= lastWeek;
        }
        if (dateFilter === "month") {
            return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
        }

        return true;
    });

    const totalAmount = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
            <Header />

            <main className="container mx-auto px-6 pt-32 pb-20">
                {/* Breadcrumbs/Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors border border-border/50">
                            <ArrowRight className="w-5 h-5 text-foreground" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-foreground">نظام الفواتير 🧾</h1>
                            <p className="text-muted-foreground text-sm">إدارة وطباعة فواتير الطلاب والمدفوعات</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl border border-primary/20">
                            <span className="text-xs block opacity-70">إجمالي المبالغ المفلترة</span>
                            <span className="text-lg font-bold">{totalAmount.toLocaleString()} ج.م</span>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Search */}
                    <div className="relative col-span-1 md:col-span-2">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="بحث باسم الطالب، البريد الإلكتروني، أو الـكـورس..."
                            className="w-full bg-white border border-border/50 rounded-2xl py-3.5 pr-12 pl-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Date filter */}
                    <div className="relative">
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <select
                            className="w-full bg-white border border-border/50 rounded-2xl py-3.5 pr-12 pl-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm shadow-sm appearance-none"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        >
                            <option value="all">كل الأوقات</option>
                            <option value="today">اليوم</option>
                            <option value="week">هذا الأسبوع</option>
                            <option value="month">هذا الشهر</option>
                        </select>
                    </div>
                </div>

                {/* Invoices List */}
                <div className="card-love overflow-hidden border-border/40">
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-border/50">
                                    <th className="px-6 py-4 text-sm font-bold text-muted-foreground">الطالب</th>
                                    <th className="px-6 py-4 text-sm font-bold text-muted-foreground">الـكـورس</th>
                                    <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">التاريخ</th>
                                    <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">المبلغ</th>
                                    <th className="px-6 py-4 text-sm font-bold text-muted-foreground text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                                            <p className="text-muted-foreground">جاري تحميل الفواتير...</p>
                                        </td>
                                    </tr>
                                ) : filteredPayments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-20 text-center">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <FileText className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-lg font-bold text-foreground">لا توجد فواتير</p>
                                            <p className="text-muted-foreground">لم يتم العثور على أي مدفوعات مؤكدة تطابق البحث</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPayments.map((payment) => (
                                        <tr key={payment.id} className="border-b border-border/30 hover:bg-gray-50/30 transition-colors group">
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground text-sm">{payment.user.nickname}</span>
                                                    <span className="text-xs text-muted-foreground">{payment.user.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="text-sm font-medium text-foreground">{payment.course.title}</span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(payment.created_at).toLocaleDateString('ar-EG')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="px-3 py-1 bg-primary/5 text-primary rounded-full text-sm font-bold">
                                                    {Number(payment.amount).toLocaleString()} ج.م
                                                </span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => router.push(`/admin/invoices/${payment.id}`)} className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const win = window.open(`/admin/invoices/${payment.id}`, '_blank');
                                                            if (win) win.onload = () => win.print();
                                                        }}
                                                        className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200 transition-all border border-border/40"
                                                    >
                                                        <Printer className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards Layout */}
                    <div className="md:hidden divide-y divide-border/50">
                        {loading ? (
                            <div className="py-20 text-center">
                                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                                <p className="text-muted-foreground">جاري تحميل الفواتير...</p>
                            </div>
                        ) : filteredPayments.length === 0 ? (
                            <div className="py-20 text-center px-6">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-lg font-bold text-foreground">لا توجد فواتير</p>
                                <p className="text-muted-foreground text-sm">لم يتم العثور على أي مدفوعات تطابق البحث</p>
                            </div>
                        ) : (
                            filteredPayments.map((payment) => (
                                <div key={payment.id} className="p-5 active:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            <span className="font-black text-foreground">{payment.user.nickname}</span>
                                            <span className="text-[10px] text-muted-foreground opacity-70">{payment.user.email}</span>
                                        </div>
                                        <span className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-black shadow-sm shadow-primary/20">
                                            {Number(payment.amount).toLocaleString()} ج.م
                                        </span>
                                    </div>

                                    <div className="bg-gray-50/80 rounded-2xl p-4 mb-4 border border-border/30">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="w-3.5 h-3.5 text-primary" />
                                            <span className="text-sm font-bold text-foreground">{payment.course.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            <span>
                                                {new Date(payment.created_at).toLocaleDateString('ar-EG', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => router.push(`/admin/invoices/${payment.id}`)}
                                            className="flex-1 bg-primary/10 text-primary py-3 rounded-xl flex items-center justify-center gap-2 font-black text-sm transition-all active:scale-[0.98]"
                                        >
                                            <Eye className="w-4 h-4" />
                                            <span>عرض</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                const win = window.open(`/admin/invoices/${payment.id}`, '_blank');
                                                if (win) win.onload = () => win.print();
                                            }}
                                            className="w-12 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center transition-all active:scale-[0.98]"
                                        >
                                            <Printer className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Footer Message */}
                {!loading && filteredPayments.length > 0 && (
                    <p className="text-center text-xs text-muted-foreground mt-8">
                        * تُعرض فقط المدفوعات التي تم تأكيدها مسبقاً من صفحة إدارة المدفوعات.
                    </p>
                )}
            </main>
        </div>
    );
}
