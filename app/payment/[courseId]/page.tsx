"use client";

import Link from "next/link";
import { useState, use } from "react";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getCourseById } from "@/lib/data";
import {
    Copy,
    Check,
    CreditCard,
    ArrowLeft,
    Smartphone,
    Building2,
    Wallet
} from "lucide-react";

interface PageProps {
    params: Promise<{ courseId: string }>;
}

export default function PaymentPage({ params }: PageProps) {
    const { courseId } = use(params);
    const course = getCourseById(courseId);

    const [copied, setCopied] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState(false);

    if (!course) {
        notFound();
    }

    // Generate unique payment code
    const paymentCode = `SKN-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const copyCode = () => {
        navigator.clipboard.writeText(paymentCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const paymentMethods = [
        { id: "vodafone", name: "فودافون كاش", icon: Smartphone, number: "01012345678" },
        { id: "fawry", name: "فوري", icon: Building2, code: "7823456" },
        { id: "instapay", name: "InstaPay", icon: Wallet, username: "@sakina_pay" },
    ];

    return (
        <div className="gradient-bg min-h-screen">
            <Header />

            <main className="pt-28 pb-20 px-6">
                <div className="container mx-auto max-w-2xl">
                    {/* Breadcrumb */}
                    <div className="mb-8">
                        <Link
                            href={`/courses/${courseId}`}
                            className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                            العودة لتفاصيل الكورس
                        </Link>
                    </div>

                    {/* Page Header */}
                    <div className="text-center mb-10">
                        <CreditCard className="w-16 h-16 text-[var(--primary)] mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-white mb-2">
                            إتمام الدفع
                        </h1>
                        <p className="text-[var(--text-secondary)]">
                            كورس: {course.title}
                        </p>
                    </div>

                    {/* Payment Code */}
                    <div className="glass-card p-6 mb-8">
                        <h2 className="text-lg font-semibold text-white mb-4 text-center">
                            كود الدفع الخاص بك
                        </h2>
                        <div className="bg-[var(--bg-darker)] rounded-xl p-6 flex items-center justify-between">
                            <span className="text-2xl font-mono font-bold text-[var(--primary)]">
                                {paymentCode}
                            </span>
                            <button
                                onClick={copyCode}
                                className="flex items-center gap-2 btn-secondary py-2 px-4"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? "تم النسخ" : "نسخ"}
                            </button>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] text-center mt-3">
                            احفظ هذا الكود واستخدمه في وصف التحويل
                        </p>
                    </div>

                    {/* Amount */}
                    <div className="glass-card p-6 mb-8">
                        <div className="flex items-center justify-between">
                            <span className="text-[var(--text-secondary)]">المبلغ المطلوب</span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-white">{course.price}</span>
                                <span className="text-[var(--text-muted)]">ج.م</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="glass-card p-6 mb-8">
                        <h2 className="text-lg font-semibold text-white mb-4">
                            اختر طريقة الدفع
                        </h2>
                        <div className="space-y-3">
                            {paymentMethods.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method.id)}
                                    className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 ${selectedMethod === method.id
                                            ? "border-[var(--primary)] bg-[var(--primary)]/10"
                                            : "border-[var(--glass-border)] bg-[var(--bg-darker)] hover:border-[var(--primary)]/50"
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedMethod === method.id ? "bg-[var(--primary)]" : "bg-[var(--bg-card)]"
                                        }`}>
                                        <method.icon className={`w-6 h-6 ${selectedMethod === method.id ? "text-white" : "text-[var(--text-secondary)]"
                                            }`} />
                                    </div>
                                    <div className="text-right flex-1">
                                        <p className="font-semibold text-white">{method.name}</p>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            {method.number || method.code || method.username}
                                        </p>
                                    </div>
                                    {selectedMethod === method.id && (
                                        <Check className="w-5 h-5 text-[var(--primary)]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Instructions */}
                    {selectedMethod && (
                        <div className="glass-card p-6 mb-8">
                            <h2 className="text-lg font-semibold text-white mb-4">
                                خطوات الدفع
                            </h2>
                            <ol className="space-y-3 text-[var(--text-secondary)]">
                                <li className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center text-sm shrink-0">1</span>
                                    <span>افتح تطبيق {paymentMethods.find(m => m.id === selectedMethod)?.name}</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center text-sm shrink-0">2</span>
                                    <span>حوّل مبلغ {course.price} ج.م للرقم/الحساب المذكور أعلاه</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center text-sm shrink-0">3</span>
                                    <span>اكتب كود الدفع <span className="text-[var(--primary)] font-mono">{paymentCode}</span> في الوصف</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="w-6 h-6 rounded-full bg-[var(--primary)]/20 text-[var(--primary)] flex items-center justify-center text-sm shrink-0">4</span>
                                    <span>اضغط "أكدت الدفع" بعد إتمام التحويل</span>
                                </li>
                            </ol>
                        </div>
                    )}

                    {/* Confirm Button */}
                    <button
                        onClick={() => setConfirmed(true)}
                        disabled={!selectedMethod}
                        className={`btn-primary w-full text-lg py-4 justify-center ${!selectedMethod ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                    >
                        ✅ أكدت الدفع
                    </button>

                    {/* Confirmation Message */}
                    {confirmed && (
                        <div className="mt-6 glass-card p-6 border-[var(--success)] text-center">
                            <Check className="w-12 h-12 text-[var(--success)] mx-auto mb-3" />
                            <h3 className="text-xl font-semibold text-white mb-2">
                                شكراً لك!
                            </h3>
                            <p className="text-[var(--text-secondary)]">
                                سيتم تفعيل اشتراكك خلال ساعات قليلة بعد التحقق من الدفع.
                                ستصلك رسالة على إيميلك عند التفعيل.
                            </p>
                            <Link href="/dashboard" className="btn-primary mt-4 inline-flex">
                                الذهاب للوحة التحكم
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
