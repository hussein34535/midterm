"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Mock Login Logic
        try {
            // Check if user exists in localStorage (optional, but good for demo)
            const storedUser = localStorage.getItem('user');

            // If no user found, create a mock one for this session to ensure they can proceed
            if (!storedUser) {
                const mockUser = {
                    id: "mock-id-123",
                    nickname: formData.email.split('@')[0],
                    email: formData.email
                };
                localStorage.setItem('user', JSON.stringify(mockUser));
            }

            toast.success("تم تسجيل الدخول بنجاح");
            router.push('/dashboard');
        } catch (error) {
            toast.error("حدث خطأ أثناء تسجيل الدخول");
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
                            مرحباً بعودتك
                        </h1>
                        <p className="text-muted-foreground">
                            سجل دخول للمتابعة
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
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
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                                كلمة السـر
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

                        {/* Forgot Password */}
                        <div className="text-left">
                            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                                نسيت كلمة السر؟
                            </Link>
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
                    <p className="text-center text-muted-foreground mt-8">
                        ليس لديك حساب؟{" "}
                        <Link href="/register" className="text-primary font-bold hover:underline">
                            سجل الآن
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
