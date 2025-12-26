"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, User, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        nickname: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Register:", formData);
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
                        إنشاء حساب جديد
                    </h1>
                    <p className="text-[var(--text-secondary)] text-center mb-8">
                        انضم لمجتمع الدعم النفسي الآمن
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Nickname */}
                        <div>
                            <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                الاسم المستعار
                            </label>
                            <div className="relative flex items-center">
                                <span className="absolute right-4 text-[var(--text-muted)] pointer-events-none">
                                    <User className="w-5 h-5" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="مثال: نجمة الصباح"
                                    className="input-field pl-4 pr-12 text-left"
                                    dir="ltr"
                                    value={formData.nickname}
                                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                    required
                                />
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-2">
                                هذا الاسم سيظهر للآخرين في الجلسات
                            </p>
                        </div>

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
                            <p className="text-xs text-[var(--text-muted)] mt-2">
                                للإشعارات واسترجاع الحساب فقط - لن يظهر لأي شخص
                            </p>
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

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm text-[var(--text-secondary)] mb-2">
                                تأكيد كلمة السر
                            </label>
                            <div className="relative flex items-center">
                                <span className="absolute right-4 text-[var(--text-muted)] pointer-events-none">
                                    <Lock className="w-5 h-5" />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="input-field pl-4 pr-12 text-left"
                                    dir="ltr"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Privacy Notice */}
                        <div className="bg-[var(--bg-darker)] rounded-xl p-4 border border-[var(--glass-border)] flex items-start gap-3">
                            <Lock className="w-5 h-5 text-[var(--primary)] shrink-0 mt-0.5" />
                            <p className="text-sm text-[var(--text-secondary)]">
                                هويتك ستبقى مجهولة تماماً. الأخصائي والمشاركين يرون فقط اسمك المستعار.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button type="submit" className="btn-primary w-full text-lg">
                            إنشاء حساب
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center text-[var(--text-secondary)] mt-6">
                        لديك حساب بالفعل؟{" "}
                        <Link href="/login" className="text-[var(--primary)] hover:underline font-semibold">
                            سجل دخول
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
