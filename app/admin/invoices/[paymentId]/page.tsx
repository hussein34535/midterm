"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Printer,
    ArrowRight,
    FileText,
    Download,
    Share2,
    Loader2,
    Calendar,
    Target,
    User,
    DollarSign,
    Shield
} from "lucide-react";
import Header from "@/components/layout/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface PaymentDetail {
    id: string;
    amount: number;
    payment_method: string;
    created_at: string;
    status: string;
    sender_number?: string;
    user: {
        nickname: string;
        email: string;
        id: string;
    };
    course: {
        title: string;
        price: number;
        description: string;
    };
}

export default function InvoiceDetail() {
    const router = useRouter();
    const { paymentId } = useParams();
    const [payment, setPayment] = useState<PaymentDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        fetchPaymentDetails();
    }, [paymentId]);

    const fetchPaymentDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/payments/${paymentId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPayment(data.payment);
            }
        } catch (error) {
            console.error('Failed to fetch payment details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!payment) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <FileText className="w-20 h-20 text-gray-300 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">الفاتورة غير موجودة</h2>
                <p className="text-gray-500 mb-6">عذراً، لم نتمكن من العثور على تفاصيل هذه الفاتورة.</p>
                <button onClick={() => router.back()} className="btn-primary px-8">العودة للخلف</button>
            </div>
        );
    }

    // Professional Receipt Layout
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-32 pb-20 print:bg-white print:pt-0 print:pb-0" dir="rtl">
            <div className="print:hidden">
                <Header />
            </div>

            <main className="container mx-auto px-6 max-w-4xl">
                {/* Actions Bar - Hidden on print */}
                <div className="flex items-center justify-between mb-8 print:hidden">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowRight className="w-5 h-5" />
                        العودة لقائمة الفواتير
                    </button>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all"
                        >
                            <Printer className="w-4 h-4" />
                            طباعة الفاتورة
                        </button>
                    </div>
                </div>

                {/* The Invoice Document */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-border/40 mb-10 print:shadow-none print:border-none print:rounded-none">
                    {/* Invoice Header */}
                    <div className="bg-gradient-to-br from-primary via-indigo-700 to-indigo-900 p-10 text-white relative overflow-hidden print:from-indigo-900 print:text-indigo-900 print:bg-none print:p-0 print:mb-10">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 print:flex-row print:items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg print:border print:border-indigo-900">
                                    <img src="/logo.png" alt="إيواء" className="w-12 h-12 rounded-lg" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-serif font-black tracking-tight">منصة إيـواء</h1>
                                    <p className="text-primary-foreground/80 text-sm">العنوان التعليمي للمهارات الحياتية</p>
                                </div>
                            </div>
                            <div className="text-left md:text-right print:text-right">
                                <h2 className="text-4xl font-black mb-1">فـاتـورة</h2>
                                <p className="text-primary-foreground/70 text-sm">رقم الدفع: #{payment.id.substring(0, 8).toUpperCase()}</p>
                            </div>
                        </div>

                        {/* Decorative blobs (hidden on print) */}
                        <div className="print:hidden absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                        <div className="print:hidden absolute -bottom-20 -left-10 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                    </div>

                    {/* Invoice Content */}
                    <div className="p-10 md:p-14 print:p-0">
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-14 border-b border-border/40 pb-14 print:grid-cols-2 print:gap-10">
                            {/* Student Info */}
                            <div>
                                <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-black mb-4 flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" /> بيانات الطالب
                                </h3>
                                <div className="space-y-1">
                                    <p className="text-xl font-bold text-foreground">{payment.user.nickname}</p>
                                    <p className="text-muted-foreground">{payment.user.email}</p>
                                    <p className="text-xs text-muted-foreground mt-2">كود الطالب: {payment.user.id.substring(0, 8)}</p>
                                </div>
                            </div>

                            {/* Billing Info */}
                            <div className="text-right">
                                <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-black mb-4 flex items-center justify-end gap-2">
                                    <Calendar className="w-3.5 h-3.5" /> تفاصيل الفاتورة
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-end gap-2 text-sm">
                                        <span className="font-bold text-foreground">
                                            {new Date(payment.created_at).toLocaleDateString('ar-EG', {
                                                year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </span>
                                        <span className="text-muted-foreground">تاريخ الإصدار:</span>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 text-sm">
                                        <span className="font-bold text-foreground">{payment.payment_method === 'vodafone_cash' ? 'فودافون كاش' : payment.payment_method === 'bank_transfer' ? 'تحويل بنكي' : payment.payment_method === 'instapay' ? 'InstaPay' : 'فوري'}</span>
                                        <span className="text-muted-foreground">وسيلة الدفع:</span>
                                    </div>
                                    {payment.sender_number && (
                                        <div className="flex items-center justify-end gap-2 text-sm">
                                            <span className="font-bold text-foreground font-mono">{payment.sender_number}</span>
                                            <span className="text-muted-foreground">رقم المحفظة:</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-end gap-2 text-sm">
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-black rounded-md border border-green-200 uppercase">PAID / مدفوعة</span>
                                        <span className="text-muted-foreground">الحالة:</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary Table */}
                        <div className="mb-14">
                            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-black mb-6">
                                تفاصيل الخدمات
                            </h3>
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="border-b border-foreground/10">
                                        <th className="py-4 text-sm font-black text-foreground">الخدمة / الكورس</th>
                                        <th className="py-4 text-sm font-black text-foreground text-center">الكمية</th>
                                        <th className="py-4 text-sm font-black text-foreground text-left">السعر</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    <tr>
                                        <td className="py-6">
                                            <p className="font-bold text-foreground">{payment.course.title}</p>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed truncate">{payment.course.description || 'اشتراك كامل في الأنشطة المخصصة'}</p>
                                        </td>
                                        <td className="py-6 text-center text-sm">1</td>
                                        <td className="py-6 text-left font-bold text-foreground text-lg">{Number(payment.amount).toLocaleString()} ج.م</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Totals Section */}
                        <div className="flex justify-start mb-14">
                            <div className="w-full md:w-80 bg-gray-50/50 rounded-2xl p-6 border border-border/40 print:bg-white print:border-none print:p-0">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">المبلغ الصافي:</span>
                                        <span className="font-bold text-foreground">{Number(payment.amount).toLocaleString()} ج.م</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">الضرائب (0%):</span>
                                        <span className="font-bold text-foreground">0.00 ج.م</span>
                                    </div>
                                    <div className="h-px bg-border/50 my-2" />
                                    <div className="flex items-center justify-between text-xl">
                                        <span className="font-black text-foreground">الإجمالي:</span>
                                        <span className="font-black text-primary print:text-indigo-900">{Number(payment.amount).toLocaleString()} ج.م</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Notes */}
                        <div className="border-t border-border/40 pt-10 text-center">
                            <p className="text-sm font-bold text-foreground mb-1">شكراً لانضمامك لمنصة إيواء التعليمية ✨</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                هذه الفاتورة صادرة إلكترونياً وتعتبر مستند تأكيد سداد الرسوم الدراسية للخدمة المذكورة أعلاه.
                                <br /> لمزيد من الاستفسارات تواصل مع الدعم الفني عبر المنصة.
                            </p>
                        </div>
                    </div>

                    {/* Bottom accent bar */}
                    <div className="h-3 bg-gradient-to-l from-primary via-indigo-600 to-indigo-900 print:hidden" />
                </div>

                {/* PDF/Download Tip - Hidden on print */}
                <div className="flex items-center justify-center gap-2 text-muted-foreground text-xs print:hidden mb-10">
                    <Shield className="w-4 h-4" />
                    <span>يمكنك طباعة هذه الصفحة كملف PDF لحفظها بشكل دائم على جهازك.</span>
                </div>
            </main>

            <style jsx global>{`
                @media print {
                    @page {
                        margin: 20mm;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                    }
                    .pt-32 {
                        padding-top: 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}
