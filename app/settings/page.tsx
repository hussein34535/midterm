"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, User, Mail, Shield, ArrowLeft, Lock, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import AvatarSelector from "@/components/ui/AvatarSelector";
import Link from "next/link";
import { userAPI } from "@/lib/api"; // Ensure userAPI is exported or use fetch directly

export default function SettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isPassLoading, setIsPassLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Profile Form State
    const [formData, setFormData] = useState({
        nickname: "",
        email: "",
        avatar: "",
    });

    // Password Form State
    const [isChangingPass, setIsChangingPass] = useState(false);
    const [passData, setPassData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    useEffect(() => {
        // Load user data
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                const userData = JSON.parse(stored);
                setUser(userData);
                setFormData({
                    nickname: userData.nickname || "",
                    email: userData.email || "",
                    avatar: userData.avatar || "",
                });
            } catch (e) {
                console.error("Error loading user data");
            }
        } else {
            router.push('/login');
        }
    }, [router]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    nickname: formData.nickname,
                    avatar: formData.avatar
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            const updatedUser = { ...user, ...data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event("user-login"));
            setUser(updatedUser);
            toast.success("تم تحديث البيانات بنجاح");
        } catch (error: any) {
            toast.error(error.message || "حدث خطأ أثناء الحفظ");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passData.newPassword !== passData.confirmPassword) {
            return toast.error("كلمة المرور غير متطابقة");
        }
        if (passData.newPassword.length < 6) {
            return toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
        }

        setIsPassLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: passData.currentPassword,
                    newPassword: passData.newPassword
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            toast.success("تم تغيير كلمة المرور بنجاح");
            setIsChangingPass(false);
            setPassData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (error: any) {
            toast.error(error.message || "فشل تغيير كلمة المرور");
        } finally {
            setIsPassLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="bg-warm-mesh min-h-screen pt-24 pb-12 px-4" dir="rtl">
            <div className="container mx-auto max-w-2xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard" className="p-2 rounded-xl hover:bg-white/50 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-foreground" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-serif font-bold text-foreground">إعدادات الحساب</h1>
                        <p className="text-muted-foreground">قم بتخصيص ملفك الشخصي</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Profile Section */}
                    <div className="card-love p-8 animate-in fade-in slide-in-from-bottom-4">
                        <form onSubmit={handleSaveProfile} className="space-y-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">الصورة الشخصية</h3>
                                <AvatarSelector
                                    onSelect={(url) => setFormData(prev => ({ ...prev, avatar: url }))}
                                    selectedAvatar={formData.avatar}
                                />
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">البيانات الأساسية</h3>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">الاسم المستعار</label>
                                    <div className="relative">
                                        <User className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={formData.nickname}
                                            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">البريد الإلكتروني</label>
                                    <div className="relative">
                                        <Mail className="absolute right-3 top-3 w-5 h-5 text-muted-foreground" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            readOnly // Email usually immutable
                                            className="w-full pl-4 pr-10 py-3 rounded-xl border border-input bg-gray-50 text-gray-500 cursor-not-allowed outline-none dir-ltr text-right"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">لا يمكن تغيير البريد الإلكتروني</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-border flex justify-end">
                                <button
                                    type="submit"
                                    className="btn-primary px-8 py-3 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    <span>حفظ التغييرات</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Password Section */}
                    <div className="card-love p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Shield className="w-5 h-5 text-primary" />
                                <span>الأمان وكلمة المرور</span>
                            </h3>
                        </div>

                        {!isChangingPass ? (
                            <button
                                onClick={() => setIsChangingPass(true)}
                                className="w-full py-4 border-2 border-dashed border-primary/20 rounded-xl flex items-center justify-center gap-3 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all font-medium"
                            >
                                <Lock className="w-5 h-5" />
                                <span>تغيير كلمة المرور</span>
                            </button>
                        ) : (
                            <form onSubmit={handleSavePassword} className="space-y-6 bg-gray-50/50 p-6 rounded-xl border border-primary/10">
                                <div className="space-y-4">
                                    {/* Current Password */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-medium text-foreground">كلمة المرور الحالية</label>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    try {
                                                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`, {
                                                            method: 'POST',
                                                            headers: { 'Content-Type': 'application/json' },
                                                            body: JSON.stringify({ email: formData.email })
                                                        });
                                                        if (res.ok) toast.success("تم إرسال رابط إعادة التعيين إلى بريدك");
                                                        else toast.error("فشل الإرسال");
                                                    } catch (error) {
                                                        toast.error("حدث خطأ في الاتصال");
                                                        console.error("Forgot password error:", error);
                                                    }
                                                }}
                                                className="text-xs text-primary hover:underline hover:text-primary/80"
                                            >
                                                نسيت كلمة المرور؟
                                            </button>
                                        </div>
                                        <input
                                            type="password"
                                            value={passData.currentPassword}
                                            onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-input bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                            required
                                        />
                                    </div>

                                    {/* New Password */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">كلمة المرور الجديدة</label>
                                        <input
                                            type="password"
                                            value={passData.newPassword}
                                            onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-input bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                            placeholder="6 أحرف على الأقل"
                                            required
                                        />
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-foreground">تأكيد كلمة المرور</label>
                                        <input
                                            type="password"
                                            value={passData.confirmPassword}
                                            onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-input bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <button
                                        type="submit"
                                        className="flex-1 btn-primary py-3 shadow-md flex items-center justify-center gap-2"
                                        disabled={isPassLoading}
                                    >
                                        {isPassLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        <span>تحديث كلمة المرور</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsChangingPass(false);
                                            setPassData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                        }}
                                        className="px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
