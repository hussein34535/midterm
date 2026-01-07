"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Heart, User, Mail, Lock, Eye, EyeOff, ArrowLeft, Shield } from "lucide-react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AvatarSelector from "@/components/ui/AvatarSelector";
import { authAPI } from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [registrationAllowed, setRegistrationAllowed] = useState(true);
    const [checkingSettings, setCheckingSettings] = useState(true);
    const [formData, setFormData] = useState({
        nickname: "",
        email: "",
        password: "",
        confirmPassword: "",
        avatar: "",
    });

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    // Check settings and auto-redirect if already logged in
    useEffect(() => {
        const checkSettings = async () => {
            try {
                const res = await fetch(`${API_URL}/api/settings`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.settings?.allow_registration === false) {
                        setRegistrationAllowed(false);
                        toast.error('التسجيل مغلق حالياً');
                        router.push('/login');
                        return;
                    }
                }
            } catch (err) {
                console.error('Failed to check settings');
            } finally {
                setCheckingSettings(false);
            }
        };

        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user.role === 'owner') router.push('/admin');
                else if (user.role === 'specialist') router.push('/specialist');
                else router.push('/dashboard');
            } catch (e) {
                // Invalid data, proceed to register
            }
        }

        checkSettings();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Validation
        if (formData.password.length < 6) {
            toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
            setIsLoading(false);
            return;
        }

        try {
            // Get guest token if exists
            const guestToken = localStorage.getItem('iwaa_guest_token');

            // Call real API
            await authAPI.register({
                nickname: formData.nickname,
                email: formData.email,
                password: formData.password,
                avatar: formData.avatar,
                guestToken: guestToken || undefined
            });

            // Backend handles verification automatically now
            toast.success("تم إنشاء الحساب بنجاح! جاري الدخول...");

            // Allow token save in api.ts to propagate
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ ما، يرجى المحاولة مرة أخرى");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-warm-mesh min-h-screen px-4 md:px-6 pt-12 pb-8 md:py-16 safe-area-top safe-area-bottom" dir="rtl">
            <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center mb-8 mt-4 group">
                    <img
                        src="/logo.png"
                        alt="إيواء"
                        className="h-16 md:h-24 w-auto rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20"
                    />
                </Link>

                {/* Form Card */}
                <div className="card-mobile md:card-love p-5 md:p-8">
                    <div className="text-center mb-5 md:mb-8">
                        <h1 className="text-lg md:text-2xl font-serif font-bold text-foreground mb-1.5">
                            إنشاء حساب جديد
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground">
                            انضم لمجتمع الدعم النفسي الآمن
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                        {/* Avatar Selector */}
                        <AvatarSelector
                            onSelect={(url) => setFormData(prev => ({ ...prev, avatar: url }))}
                            selectedAvatar={formData.avatar}
                        />

                        {/* Nickname */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground">
                                الاسم المستعار
                            </label>
                            <div className="relative">
                                <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="مثال: نجمة الصباح"
                                    className="input-mobile pr-14"
                                    value={formData.nickname}
                                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground pr-1">
                                هذا الاسم سيظهر للآخرين في الجلسات
                            </p>
                        </div>

                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground">
                                البريد الإلكتروني
                            </label>
                            <div className="relative">
                                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    placeholder="example@email.com"
                                    className="input-mobile pr-14 text-left"
                                    dir="ltr"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground pr-1">
                                للإشعارات واسترجاع الحساب فقط
                            </p>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-foreground">
                                كلمة السر
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

                        {/* Privacy Notice */}
                        <div className="bg-primary/5 rounded-xl p-3 md:p-4 border border-primary/10 flex items-start gap-3">
                            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                                هويتك ستبقى مجهولة. الأخصائي يرى فقط اسمك المستعار وصورة الأفاتار.
                            </p>
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
                                    جاري إنشاء الحساب...
                                </span>
                            ) : (
                                <>
                                    <span className="font-bold">إنشاء حساب</span>
                                    <ArrowLeft className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center text-sm md:text-base text-muted-foreground mt-5 md:mt-8">
                        لديك حساب بالفعل؟{" "}
                        <Link href="/login" className="text-primary font-bold hover:underline">
                            سجل دخول
                        </Link>
                    </p>
                </div>

                {/* Bottom spacing for mobile (for chat button clearance) */}
                <div className="h-24 md:h-0" />
            </div>
        </div>
    );
}

