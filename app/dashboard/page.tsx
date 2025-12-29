'use client';

import React from 'react';
import Link from 'next/link';
import { Sun, Calendar, Clock, User, LogOut, Settings, Bell, BookOpen, Activity, Heart, Sparkles, Shield } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

export default function DashboardPage() {
    const user = { nickname: 'نجمة الصباح' };

    return (
        <div className="bg-warm-mesh min-h-screen flex flex-col" dir="rtl">
            <Header />

            <main className="flex-grow pb-20 pt-32">
                <div className="container mx-auto px-6">

                    {/* 👋 Welcome Section */}
                    <div className="mb-12 text-center md:text-right animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                            <Sparkles className="w-4 h-4 fill-current" />
                            <span>يوم جديد، بداية جديدة</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-3">
                            مرحباً بك، <span className="text-primary">{user.nickname}</span>
                        </h1>
                        <p className="text-muted-foreground text-lg">استكمل رحلة التعافي الخاصة بك 🌿</p>
                    </div>

                    {/* 🌟 Hero Dashboard Card */}
                    <div className="card-love p-8 md:p-12 mb-12 relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex-grow flex flex-col md:flex-row items-center gap-8 text-center md:text-right">
                                <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary shadow-lg shadow-primary/10 rotate-3 transform hover:rotate-6 transition-transform">
                                    <Heart className="w-10 h-10 fill-current" />
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold mb-3 border border-green-200">
                                        <Activity className="w-3 h-3" />
                                        <span>نشط الآن</span>
                                    </div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">جلسة: التعامل مع القلق</h2>
                                    <p className="text-muted-foreground text-lg max-w-md">تبدأ الجلسة خلال 15 دقيقة. هل أنت مستعد؟</p>
                                </div>
                            </div>

                            <Link href="/courses" className="btn-primary px-8 py-4 text-lg shadow-xl shadow-primary/20 hover:scale-105">
                                <Sun className="w-5 h-5 ml-2" />
                                الدخول للجلسة
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* 👉 Main Content Column (8) */}
                        <div className="lg:col-span-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">

                            {/* 📅 Upcoming Session Item */}
                            <div className="card-love p-8 group hover:border-primary/30 transition-all">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="w-20 h-20 bg-primary/5 rounded-2xl flex flex-col items-center justify-center border border-primary/10 group-hover:bg-primary/10 transition-colors">
                                        <span className="text-primary font-black text-2xl">25</span>
                                        <span className="text-muted-foreground text-xs font-bold uppercase">يناير</span>
                                    </div>

                                    <div className="flex-1 text-center md:text-right">
                                        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">العيش في اللحظة</h3>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Clock className="w-4 h-4 text-primary" />
                                                <span>8:00 مساءً</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <User className="w-4 h-4 text-primary" />
                                                <span>د. سارة احمد</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="btn-outline px-6 py-3 text-sm">
                                        التفاصيل
                                    </button>
                                </div>
                            </div>

                            {/* 📚 My Courses */}
                            <div className="card-love p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                                        <BookOpen className="w-5 h-5 text-primary" />
                                        رحلاتي الحالية
                                    </h2>
                                    <Link href="/courses" className="text-primary text-sm font-bold hover:underline transition-colors">عرض الكل</Link>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-secondary/30 rounded-2xl p-6 border border-border hover:bg-secondary/50 transition-colors">
                                        <div className="flex items-center justify-between gap-4 mb-4">
                                            <h4 className="font-bold text-foreground">التعامل مع القلق</h4>
                                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg">3/8 جلسات</span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: '37%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* 👉 Sidebar Column (4) */}
                        <div className="lg:col-span-4 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">

                            {/* 👤 Profile Card */}
                            <div className="card-love p-8 text-center relative overflow-hidden">
                                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-primary/5 to-transparent" />

                                <div className="relative z-10">
                                    <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center text-4xl mb-4 border-4 border-white shadow-xl">🌸</div>
                                    <h3 className="text-xl font-bold text-foreground mb-1">{user.nickname}</h3>
                                    <p className="text-muted-foreground text-sm mb-8">عضو مميز منذ 2024</p>

                                    <nav className="space-y-2">
                                        <button className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all text-right group">
                                            <Settings className="w-5 h-5 group-hover:text-primary transition-colors" />
                                            إعدادات الحساب
                                        </button>
                                        <button className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all text-right group">
                                            <Bell className="w-5 h-5 group-hover:text-primary transition-colors" />
                                            التنبيهات
                                        </button>
                                        <div className="h-px bg-border my-2" />
                                        <button className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-destructive/5 text-muted-foreground hover:text-destructive transition-all text-right">
                                            <LogOut className="w-5 h-5" />
                                            تسجيل خروج
                                        </button>
                                    </nav>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
