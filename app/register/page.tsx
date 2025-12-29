"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, User, Mail, Lock, Eye, EyeOff, ArrowLeft, Shield } from "lucide-react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AvatarSelector from "@/components/ui/AvatarSelector";

export default function RegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        nickname: "",
        email: "",
        password: "",
        confirmPassword: "",
        avatar: "", // New field
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock Validation
        if (formData.password.length < 6) {
            toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
            setIsLoading(false);
            return;
        }

        // Mock Registration Logic
        try {
            // Save to localStorage (Simulating Backend)
            const user = {
                id: Date.now().toString(),
                nickname: formData.nickname,
                email: formData.email,
                avatar: formData.avatar, // Save avatar
            };
            localStorage.setItem('user', JSON.stringify(user));

            // Dispatch event to update Header immediately
            window.dispatchEvent(new Event("user-login"));

            toast.success("تم إنشاء الحساب بنجاح! أهلاً بك في سكينة");
            router.push('/dashboard');
        } catch (error) {
            toast.error("حدث خطأ ما، يرجى المحاولة مرة أخرى");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-warm-mesh min-h-screen flex items-center justify-center px-4 py-12" dir="rtl">
            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-8 group">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-serif font-bold text-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20">
                        س
                    </div>
                    <span className="text-3xl font-serif font-bold tracking-tight text-foreground">سكينة</span>
                </Link>

                {/* Form Card */}
                <div className="card-love p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-serif font-bold text-foreground mb-2">
                            إنشاء حساب جديد
                        </h1>
                        <p className="text-muted-foreground">
                            انضم لمجتمع الدعم النفسي الآمن
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Avatar Selector */}
                        <AvatarSelector
                            onSelect={(url) => setFormData(prev => ({ ...prev, avatar: url }))}
                            selectedAvatar={formData.avatar}
                        />

                        {/* Nickname */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                الاسم المستعار
                            </label>
                            <div className="relative">
                                <User className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="مثال: نجمة الصباح"
                                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none text-left"
                                    dir="ltr"
                                    value={formData.nickname}
                                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                هذا الاسم سيظهر للآخرين في الجلسات
                            </p>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                البريد الإلكتروني
                            </label>
                            <div className="relative">
                                <Mail className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="email"
                                    placeholder="example@email.com"
                                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none text-left"
                                    dir="ltr"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                للإشعارات واسترجاع الحساب فقط - لن يظهر لأي شخص
                            </p>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                كلمة السر
                            </label>
                            <div className="relative">
                                <Lock className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-3 rounded-xl border border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none text-left"
                                    dir="ltr"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Privacy Notice */}
                        <div className="bg-primary/5 rounded-xl p-4 border border-primary/10 flex items-start gap-3">
                            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                هويتك ستبقى مجهولة تماماً. الأخصائي والمشاركين يرون فقط اسمك المستعار الذي اخترته وصورة الأفاتار.
                            </p>
                        </div>

                        {/* Submit Button */}
                        {/* Submit Button */}
                        <button
                            type="submit"
                            className="btn-primary w-full shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2 justify-center">
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
                    <p className="text-center text-muted-foreground mt-8">
                        لديك حساب بالفعل؟{" "}
                        <Link href="/login" className="text-primary font-bold hover:underline">
                            سجل دخول
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
