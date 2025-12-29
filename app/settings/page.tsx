"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, User, Mail, Shield, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import AvatarSelector from "@/components/ui/AvatarSelector";
import Link from "next/link";

export default function SettingsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        nickname: "",
        email: "",
        avatar: "",
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

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const updatedUser = {
                ...user,
                nickname: formData.nickname,
                // Email is usually read-only or requires verification, but we'll allow edit for mock
                email: formData.email,
                avatar: formData.avatar,
            };

            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Dispatch event to update Header
            window.dispatchEvent(new Event("user-login"));

            toast.success("تم تحديث البيانات بنجاح");

            // Update local state
            setUser(updatedUser);
        } catch (error) {
            toast.error("حدث خطأ أثناء الحفظ");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null; // Or a loading spinner

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

                <div className="card-love p-8 animate-in fade-in slide-in-from-bottom-4">
                    <form onSubmit={handleSave} className="space-y-8">

                        {/* Avatar Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">الصورة الشخصية</h3>
                            <AvatarSelector
                                onSelect={(url) => setFormData(prev => ({ ...prev, avatar: url }))}
                                selectedAvatar={formData.avatar}
                            />
                        </div>

                        {/* Info Section */}
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
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-4 pr-10 py-3 rounded-xl border border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none dir-ltr text-right"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="pt-4 border-t border-border flex justify-end">
                            <button
                                type="submit"
                                className="btn-primary px-8 py-3 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span>جاري الحفظ...</span>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>حفظ التغييرات</span>
                                    </>
                                )}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
