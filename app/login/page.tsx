"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Login:", formData);
    };

    const inputStyle = {
        paddingRight: '3rem',
        paddingLeft: '1rem',
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem',
    };

    const inputWithEyeStyle = {
        paddingRight: '3rem',
        paddingLeft: '3rem',
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem',
    };

    return (
        <div className="gradient-bg min-h-screen flex items-center justify-center px-6 py-12" style={{ direction: 'rtl' }}>
            <div className="w-full max-w-md">
                {/* Logo */}
                <Link href="/" className="flex items-center justify-center gap-3 mb-8">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] flex items-center justify-center">
                        <Heart className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-3xl font-bold bg-gradient-to-l from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
                        سكينة
                    </span>
                </Link>

                {/* Form Card */}
                <div className="glass-card p-8">
                    <h1 className="text-2xl font-bold text-white text-center mb-2">
                        مرحباً بعودتك
                    </h1>
                    <p className="text-[var(--text-secondary)] text-center mb-8">
                        سجل دخول للمتابعة
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                البريد الإلكتروني
                            </label>
                            <div className="relative flex items-center">
                                <span className="absolute right-4 text-[var(--text-muted)] pointer-events-none">
                                    <Mail className="w-5 h-5" />
                                </span>
                                <input
                                    type="email"
                                    placeholder="example@email.com"
                                    className="input-field pl-4 pr-12 text-left"
                                    dir="ltr"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                كلمة السر
                            </label>
                            <div className="relative flex items-center">
                                <span className="absolute right-4 text-[var(--text-muted)] pointer-events-none">
                                    <Lock className="w-5 h-5" />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="input-field pl-12 pr-12 text-left"
                                    dir="ltr"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute left-4 text-[var(--text-muted)] hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Forgot Password */}
                        <div className="text-left">
                            <Link href="/forgot-password" className="text-sm text-[var(--primary)] hover:underline">
                                نسيت كلمة السر؟
                            </Link>
                        </div>

                        {/* Submit Button */}
                        <button type="submit" className="btn-primary w-full text-lg">
                            تسجيل الدخول
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </form>

                    {/* Register Link */}
                    <p className="text-center text-[var(--text-secondary)] mt-6">
                        ليس لديك حساب؟{" "}
                        <Link href="/register" className="text-[var(--primary)] hover:underline font-semibold">
                            سجل الآن
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
