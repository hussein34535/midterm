'use client';

import React from 'react';
import Link from 'next/link';
import { Sun, Calendar, Clock, User, LogOut, Settings, Bell, BookOpen, Sparkles, Activity } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';

export default function DashboardPage() {
    const user = { nickname: 'نجمة الصباح' };

    return (
        <div className="bg-noise min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow pt-40 pb-20">
                <div className="container-wide">

                    {/* 👋 Welcome Section */}
                    <div className="mb-12 relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[60px] -translate-y-1/2" />
                        <h1 className="text-4xl font-black text-white mb-2 relative z-10">
                            مرحباً، <span className="text-aurora">{user.nickname}</span>
                        </h1>
                        <p className="text-gray-400 text-lg relative z-10">استكمل رحلة التعافي الخاصة بك 🌿</p>
                    </div>

                    {/* 🌟 Hero Dashboard Card */}
                    <div className="glass-panel p-1 rounded-[2.5rem] mb-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 to-transparent opacity-50" />

                        <div className="bg-[#13111C]/60 rounded-[2.2rem] p-8 md:p-12 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-sm">
                            <div className="flex-grow flex items-center gap-8">
                                <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-rose-500 rounded-3xl flex items-center justify-center text-4xl shadow-xl shadow-purple-500/20 rotate-3 transform hover:rotate-6 transition-transform">
                                    🦋
                                </div>
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold mb-3">
                                        <Activity className="w-3 h-3" />
                                        <span>نشط الآن</span>
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-2">جلسة: التعامل مع القلق</h2>
                                    <p className="text-gray-400 text-lg max-w-md">تبدأ الجلسة خلال 15 دقيقة. هل أنت مستعد؟</p>
                                </div>
                            </div>

                            <Link href="/courses" className="btn-glow px-10 py-5 text-lg shadow-2xl hover:scale-105">
                                <Sun className="w-5 h-5 mr-1" />
                                الدخول للجلسة
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* 👉 Main Content Column (8) */}
                        <div className="lg:col-span-8 space-y-8">

                            {/* 📅 Upcoming Session Item */}
                            <div className="glass-panel p-8 group hover:border-purple-500/30 transition-all">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                    <div className="w-20 h-20 bg-white/5 rounded-2xl flex flex-col items-center justify-center border border-white/10 group-hover:border-purple-500/30 transition-colors">
                                        <span className="text-purple-400 font-black text-2xl">25</span>
                                        <span className="text-gray-500 text-xs font-bold uppercase">يناير</span>
                                    </div>

                                    <div className="flex-1 text-center md:text-right">
                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">العيش في اللحظة</h3>
                                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <Clock className="w-4 h-4 text-purple-400" />
                                                <span>8:00 مساءً</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-400">
                                                <User className="w-4 h-4 text-purple-400" />
                                                <span>د. سارة احمد</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="btn-ghost px-6 py-3 text-sm">
                                        التفاصيل
                                    </button>
                                </div>
                            </div>

                            {/* 📚 My Courses */}
                            <div className="glass-panel p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                        <BookOpen className="w-5 h-5 text-purple-400" />
                                        رحلاتي الحالية
                                    </h2>
                                    <Link href="/courses" className="text-purple-400 text-sm font-bold hover:text-purple-300 transition-colors">عرض الكل</Link>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/5 rounded-2xl p-6 border border-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center justify-between gap-4 mb-4">
                                            <h4 className="font-bold text-white">التعامل مع القلق</h4>
                                            <span className="text-xs font-bold text-purple-300 bg-purple-500/10 px-2 py-1 rounded-lg">3/8 جلسات</span>
                                        </div>
                                        <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-purple-500 to-rose-500" style={{ width: '37%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* 👉 Sidebar Column (4) */}
                        <div className="lg:col-span-4 space-y-8">

                            {/* 👤 Profile Card */}
                            <div className="glass-panel p-8 text-center relative overflow-hidden">
                                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-purple-500/10 to-transparent" />

                                <div className="relative z-10">
                                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#2a253a] to-[#1a1725] rounded-full flex items-center justify-center text-4xl mb-4 border border-white/10 shadow-xl">🌸</div>
                                    <h3 className="text-xl font-bold text-white mb-1">{user.nickname}</h3>
                                    <p className="text-gray-500 text-sm mb-8">عضو مميز منذ 2024</p>

                                    <nav className="space-y-2">
                                        <button className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/5 text-right">
                                            <Settings className="w-5 h-5" />
                                            إعدادات الحساب
                                        </button>
                                        <button className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all border border-transparent hover:border-white/5 text-right">
                                            <Bell className="w-5 h-5" />
                                            التنبيهات
                                        </button>
                                        <div className="h-px bg-white/5 my-2" />
                                        <button className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all border border-transparent hover:border-red-500/20 text-right">
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
