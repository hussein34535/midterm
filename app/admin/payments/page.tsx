"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    Check,
    X,
    Clock,
    Filter,
    Loader2,
    DollarSign,
    User,
    BookOpen,
    FileText
} from "lucide-react";
import Header from "@/components/layout/Header";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Payment {
    id: string;
    amount: number;
    status: 'pending' | 'confirmed' | 'rejected' | 'completed';
    payment_method: string;
    screenshot?: string;
    created_at: string;
    user: {
        id: string;
        nickname: string;
        email: string;
        avatar?: string;
    };
    course: {
        id: string;
        title: string;
        price: number;
    };
}

export default function PaymentsManagement() {
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const user = JSON.parse(storedUser);
        if (user.role !== 'owner' && user.role !== 'admin') {
            router.push('/dashboard');
            return;
        }
        fetchPayments();
    }, [filter]);

    const fetchPayments = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/payments?status=${filter}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPayments(data.payments || []);
            }
        } catch (error) {
            console.error('Failed to fetch payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const updatePaymentStatus = async (paymentId: string, status: string) => {
        setProcessing(paymentId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/payments/${paymentId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (res.ok) {
                toast.success(status === 'confirmed' ? 'تم تأكيد الدفعة' : 'تم رفض الدفعة');
                fetchPayments();
            } else {
                const data = await res.json();
                toast.error(data.error || 'حدث خطأ');
            }
        } catch (error) {
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setProcessing(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> قيد الانتظار</span>;
            case 'confirmed':
            case 'completed':
                return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1"><Check className="w-3 h-3" /> مؤكد</span>;
            case 'rejected':
                return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1"><X className="w-3 h-3" /> مرفوض</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
        }
    };

    const stats = {
        total: payments.length,
        pending: payments.filter(p => p.status === 'pending').length,
        confirmed: payments.filter(p => p.status === 'confirmed' || p.status === 'completed').length,
        totalAmount: payments.filter(p => p.status === 'confirmed' || p.status === 'completed').reduce((sum, p) => sum + (parseFloat(String(p.amount)) || 0), 0)
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-6 pt-24">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">إدارة المدفوعات</h1>
                        <p className="text-gray-500">مراجعة وتأكيد المدفوعات</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-xs text-gray-500">إجمالي المدفوعات</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm relative">
                        {stats.pending > 0 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                                {stats.pending}
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                                <p className="text-xs text-gray-500">قيد الانتظار</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <Check className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.confirmed}</p>
                                <p className="text-xs text-gray-500">مؤكد</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalAmount.toFixed(0)} ج.م</p>
                                <p className="text-xs text-gray-500">الإيرادات</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter */}
                <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-500" />
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="flex-1 border-0 bg-transparent focus:ring-0 text-sm"
                        >
                            <option value="all">الكل</option>
                            <option value="pending">قيد الانتظار</option>
                            <option value="confirmed">مؤكد</option>
                            <option value="rejected">مرفوض</option>
                        </select>
                    </div>
                </div>

                {/* Payments List */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : payments.length === 0 ? (
                    <div className="bg-white rounded-xl p-8 text-center">
                        <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">لا توجد مدفوعات</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {payments.map((payment) => (
                            <div key={payment.id} className="bg-white rounded-xl p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                            {payment.user?.avatar ? (
                                                <img src={payment.user.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="w-6 h-6 text-gray-500" />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{payment.user?.nickname || 'مستخدم'}</h3>
                                            <p className="text-xs text-gray-500">{payment.user?.email}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(payment.status)}
                                </div>

                                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium">{payment.course?.title || 'كورس محذوف'}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-lg font-bold text-primary">{payment.amount} ج.م</span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(payment.created_at).toLocaleDateString('ar-EG', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>

                                {/* Screenshot */}
                                {payment.screenshot && (
                                    <div className="mt-4">
                                        <p className="text-xs text-gray-600 mb-2 font-medium">📸 إثبات الدفع:</p>
                                        <a
                                            href={payment.screenshot}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary transition-colors cursor-pointer group"
                                        >
                                            <img
                                                src={payment.screenshot}
                                                alt="Payment Screenshot"
                                                className="w-full h-auto max-h-96 object-contain bg-gray-50 group-hover:opacity-90 transition-opacity"
                                            />
                                            <div className="bg-gray-100 px-3 py-2 text-xs text-center text-gray-600 group-hover:bg-primary group-hover:text-white transition-colors">
                                                اضغط للفتح في تاب جديد وتنزيل الصورة
                                            </div>
                                        </a>
                                    </div>
                                )}

                                {payment.status === 'pending' && (
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => updatePaymentStatus(payment.id, 'confirmed')}
                                            disabled={processing === payment.id}
                                            className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {processing === payment.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    تأكيد
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => updatePaymentStatus(payment.id, 'rejected')}
                                            disabled={processing === payment.id}
                                            className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            <X className="w-4 h-4" />
                                            رفض
                                        </button>
                                    </div>
                                )}

                                {(payment.status === 'confirmed' || payment.status === 'completed') && (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => router.push(`/admin/invoices/${payment.id}`)}
                                            className="w-full py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-all flex items-center justify-center gap-2 font-bold"
                                        >
                                            <FileText className="w-4 h-4" />
                                            عرض الفاتورة الضريبية
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
