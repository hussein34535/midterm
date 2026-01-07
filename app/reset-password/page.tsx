"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Suspense } from 'react';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [passwords, setPasswords] = useState({ new: "", confirm: "" });
    const [isLoading, setIsLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            return toast.error("رابط غير صالح");
        }
        if (passwords.new !== passwords.confirm) {
            return toast.error("كلمة المرور غير متطابقة");
        }
        if (passwords.new.length < 6) {
            return toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
        }

        setIsLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    newPassword: passwords.new
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("تم تغيير كلمة المرور بنجاح");

            // Redirect to login after 2 seconds
            setTimeout(() => {
                router.push('/login');
            }, 2000);

        } catch (error: any) {
            toast.error(error.message || "حدث خطأ");
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center py-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">رابط غير صالح</h3>
                <p className="text-gray-600 mb-6">الرابط المستخدم غير صالح أو مفقود.</p>
                <Link href="/login" className="text-primary hover:underline">العودة لتسجيل الدخول</Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">كلمة المرور الجديدة</label>
                    <div className="relative">
                        <Lock className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type={showPass ? "text" : "password"}
                            value={passwords.new}
                            onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                            className="w-full px-10 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            placeholder="6 أحرف على الأقل"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPass(!showPass)}
                            className="absolute left-3 top-3 text-gray-400 hover:text-gray-600"
                        >
                            {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">تأكيد كلمة المرور</label>
                    <div className="relative">
                        <Lock className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="password"
                            value={passwords.confirm}
                            onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                            className="w-full px-10 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            required
                        />
                    </div>
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
                    <span>تغيير كلمة المرور</span>
                )}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-warm-mesh flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-md">
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">إعادة تعيين كلمة المرور</h1>
                            <p className="text-gray-500 text-sm">أدخل كلمة المرور الجديدة لحسابك.</p>
                        </div>

                        <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin" /></div>}>
                            <ResetPasswordForm />
                        </Suspense>

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
