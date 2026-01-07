"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setIsSent(true);
            toast.success("تم إرسال الرابط بنجاح");
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-warm-mesh flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-md">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-8">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">نسيت كلمة المرور؟</h1>
                            <p className="text-gray-500 text-sm">
                                لا تقلق، أدخل بريدك الإلكتروني وسنرسل لك تعليمات إعادة التعيين.
                            </p>
                        </div>

                        {!isSent ? (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                                    <div className="relative">
                                        <Mail className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all dir-ltr text-right"
                                            placeholder="name@example.com"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-primary text-white py-3 rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium shadow-lg shadow-primary/20"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <span>إرسال الرابط</span>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-6 space-y-4">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">تم الإرسال!</h3>
                                <p className="text-gray-600">
                                    لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى
                                    <span className="block font-medium text-gray-800 mt-1 dir-ltr">{email}</span>
                                </p>
                                <p className="text-sm text-gray-500">
                                    يرجى التحقق من صندوق الوارد (أو الرسائل غير المرغوب فيها).
                                </p>
                            </div>
                        )}

                        <div className="mt-8 text-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors"
                            >
                                <ArrowRight className="w-4 h-4" />
                                <span>العودة لتسجيل الدخول</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
