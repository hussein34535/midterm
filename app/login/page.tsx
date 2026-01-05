"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Heart, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { authAPI } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectUrl = searchParams.get('redirect'); // Get redirect param if exists

    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    // Auto-redirect if already logged in
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                // If there's a redirect URL, use it
                if (redirectUrl) {
                    router.push(redirectUrl);
                } else if (user.role === 'owner') router.push('/admin');
                else if (user.role === 'specialist') router.push('/specialist');
                else router.push('/dashboard');
            } catch (e) {
                // Invalid data, proceed to login
            }
        }
    }, [router, redirectUrl]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Call real API
            const response = await authAPI.login({
                email: formData.email,
                password: formData.password,
            });

            toast.success("تم تسجيل الدخول بنجاح");

            // Check for redirect URL first
            if (redirectUrl) {
                router.push(redirectUrl);
                return;
            }

            // Default: Redirect based on role
            const userRole = response.user?.role || 'user';
            if (userRole === 'owner') {
                router.push('/admin');
            } else if (userRole === 'specialist') {
                router.push('/specialist');
            } else {
                router.push('/dashboard');
            }
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ أثناء تسجيل الدخول");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-warm-mesh min-h-screen flex items-center justify-center px-4 md:px-6 py-8 md:py-12 safe-area-top safe-area-bottom" dir="rtl">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center mb-6 md:mb-8 group">
                    <img
                        src="/logo.png"
                        alt="إيواء"
                        className="h-20 md:h-28 w-auto rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20"
                    />
                </Link>

                {/* Form Card */}
                <div className="card-mobile md:card-love p-6 md:p-8">
                    <div className="text-center mb-6 md:mb-8">
                        <h1 className="text-mobile-title md:text-2xl font-serif font-bold text-foreground mb-2">
                            مرحباً بعودتك
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground">
                            سجل دخول للمتابعة
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground">
                                البريد الإلكتروني
                            </label>
                            <div className="relative">
                                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    placeholder="example@email.com"
                                    className="input-mobile pr-12 text-left"
                                    dir="ltr"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-foreground">
                                كلمة السـر
                            </label>
                            <div className="relative">
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="input-mobile px-12 text-left"
                                    dir="ltr"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors touch-feedback"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password */}
                        <div className="text-left">
                            <Link href="/forgot-password" className="text-sm font-bold text-primary hover:underline touch-target inline-flex items-center">
                                نسيت كلمة السر؟
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn-mobile-primary disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2 justify-center">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    جاري الدخول...
                                </span>
                            ) : (
                                <>
                                    <span className="font-bold">تسجيل الدخول</span>
                                    <ArrowLeft className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <p className="text-center text-sm md:text-base text-muted-foreground mt-6 md:mt-8">
                        ليس لديك حساب؟{" "}
                        <Link href="/register" className="text-primary font-bold hover:underline">
                            سجل الآن
                        </Link>
                    </p>
                </div>

                {/* Bottom spacing for mobile */}
                <div className="h-20 md:h-0" />
            </div>
        </div>
    );
}
