'use client';

import React from 'react';
import Link from 'next/link';
import { Sun, Heart, MessageSquare, Shield, Users, ArrowRight, ArrowLeft, Sparkles, Clock, Mic } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

export default function LandingPage() {
  return (
    <div className="bg-[var(--bg-dark)] min-h-screen">
      <Header />

      <main>
        {/* HERO SECTION */}
        {/* 🌌 Hero Section */}
        <section className="relative min-h-[110vh] flex items-center overflow-hidden bg-noise pt-32 pb-20">

          {/* Background Ambience */}
          <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-purple-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4 animate-pulse-glow" />
          <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-rose-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4" />

          <div className="container-wide relative z-10 grid lg:grid-cols-2 gap-16 items-center">

            {/* Content */}
            <div className="text-right space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md animate-fade-in">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-sm font-medium text-white/80">انضم لأكثر من 10,000 مستفيد</span>
              </div>

              <h1 className="text-6xl lg:text-8xl font-black leading-[1.1] tracking-tight">
                <span className="block text-white">استعيد</span>
                <span className="text-aurora block">سكينتك الداخلية</span>
              </h1>

              <p className="text-xl text-gray-300 max-w-xl border-r-2 border-purple-500/50 pr-6 mr-0 leading-relaxed">
                مساحة آمنة تماماً تجمع بين الخصوصية والدعم الجماعي. تحدث بحرية، استمع لغيرك، وتعلم من الخبراء في بيئة خالية من الأحكام.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link href="/courses" className="btn-glow px-8 py-4 text-lg">
                  <span>ابدأ الجلسات الآن</span>
                  <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </Link>
                <Link href="/about" className="btn-ghost px-8 py-4 text-lg">
                  كيف نعمل؟
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="pt-8 flex items-center gap-8 border-t border-white/5">
                <div className="flex -space-x-3 space-x-reverse">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#030014] bg-white/10 backdrop-blur flex items-center justify-center text-xs font-bold text-white">
                      {i === 4 ? '+99' : '👤'}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <p className="font-bold text-white">مجتمع داعم 24/7</p>
                  <p className="text-white/40">جلسات صوتية وكتابية</p>
                </div>
              </div>
            </div>

            {/* Visual abstract */}
            <div className="relative h-[600px] hidden lg:block perspective-1000">
              {/* Main Card - Floating */}
              <div className="absolute inset-4 bg-gradient-to-br from-purple-500/10 to-transparent backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-2xl animate-float-slow p-8">
                {/* Inner Decoration */}
                <div className="absolute top-10 right-10 w-24 h-24 bg-rose-500 rounded-2xl rotate-12 blur-2xl opacity-40 mix-blend-screen" />
                <div className="absolute bottom-10 left-10 w-32 h-32 bg-purple-600 rounded-full blur-3xl opacity-40 mix-blend-screen" />

                {/* Session Card Example */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] glass-panel p-6 transform hover:scale-105 transition-transform duration-500">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">جلسة تفريغ نفسي</h3>
                      <p className="text-xs text-white/50">بدأت منذ 5 دقائق • 42 مستمع</p>
                    </div>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-purple-500 to-rose-500" />
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 glass-panel p-4 flex items-center gap-3 animate-float-delay">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-bold text-white text-sm">خصوصية تامة</span>
                </div>

                <div className="absolute -bottom-8 -left-4 glass-panel p-4 flex items-center gap-3 animate-float-delay" style={{ animationDelay: '1.5s' }}>
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <div className="text-right">
                    <p className="text-xs text-white/50">تقييم الجلسات</p>
                    <p className="font-bold text-white text-sm">4.9/5 ممتاز</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 📊 Premium Stats Bar */}
        <div className="border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
          <div className="container-wide">
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-x-reverse divide-white/5">
              {[
                { label: 'مستفيد', val: '10k+', icon: Users },
                { label: 'جلسة علاجية', val: '500+', icon: Sparkles },
                { label: 'أخصائي معتمد', val: '50+', icon: Shield },
                { label: 'دعم فوري', val: '24/7', icon: Clock },
              ].map((stat, idx) => (
                <div key={idx} className="py-12 px-6 text-center group hover:bg-white/[0.02] transition-colors">
                  <stat.icon className="w-8 h-8 text-purple-400 mx-auto mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                  <h3 className="text-3xl font-black text-white mb-1 group-hover:scale-110 transition-transform">{stat.val}</h3>
                  <p className="text-white/40 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ✨ Features - Bento Grid Style */}
        <section className="py-32 relative">
          <div className="container-wide">
            <div className="text-center mb-20">
              <span className="text-purple-400 font-bold tracking-wider uppercase text-sm">لماذا سكينة؟</span>
              <h2 className="text-4xl md:text-5xl font-black text-white mt-4 mb-6">صممناها لراحتك <span className="text-aurora">النفسية</span></h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">كل ميزة في التطبيق تم بناؤها بعناية لتوفير أقصى درجات الأمان والراحة.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Large Feature */}
              <div className="md:col-span-2 glass-panel p-10 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                < Shield className="w-12 h-12 text-rose-400 mb-6 relative z-10" />
                <h3 className="text-2xl font-bold text-white mb-4 relative z-10">هوية مجهولة بالكامل</h3>
                <p className="text-gray-400 text-lg relative z-10 max-w-md">لا نطلب اسمك الحقيقي، ولا صورتك، ولا أي بيانات شخصية. تواصل مع الجميع باسم مستعار تختاره بنفسك.</p>
                <div className="absolute top-1/2 left-10 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform" />
              </div>

              {/* Tall Feature */}
              <div className="glass-panel p-10 relative overflow-hidden md:row-span-2 group">
                <Users className="w-12 h-12 text-purple-400 mb-6 relative z-10" />
                <h3 className="text-2xl font-bold text-white mb-4 relative z-10">مجتمع متفهم</h3>
                <p className="text-gray-400 text-lg relative z-10">غرف صوتية وجلسات جماعية مع أشخاص يمرون بنفس تجربتك. لست وحدك في هذا العالم.</p>
                <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/50 to-transparent" />
              </div>

              {/* Standard Feature */}
              <div className="glass-panel p-10 group hover:border-purple-500/30 transition-colors">
                <Sparkles className="w-10 h-10 text-amber-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">أخصائيين معتمدين</h3>
                <p className="text-gray-400">جلسات إرشادية يقودها نخبة من الأطباء النفسيين.</p>
              </div>

              {/* Standard Feature */}
              <div className="glass-panel p-10 group hover:border-blue-500/30 transition-colors">
                <Clock className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">متاح 24/7</h3>
                <p className="text-gray-400">في أي وقت تشعر فيه بالحاجة للحديث، ستجد من يسمعك.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container-custom">
            <div className="bg-gradient-to-br from-[var(--primary)]/20 to-[var(--secondary)]/10 border border-[var(--glass-border)] rounded-3xl p-12 text-center relative overflow-hidden">
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">جاهز للبدء في رحلة التغيير؟</h2>
                <p className="text-lg text-[var(--text-muted)] mb-8">
                  أكثر من مجرد منصة، نحن مجتمع ينتظرك. ابدأ اليوم أولى خطواتك نحو السكينة النفسية.
                </p>
                <Link href="/courses" className="btn-primary py-4 px-10 text-lg shadow-lg shadow-[var(--primary)]/20">
                  تصفح الكورسات المتاحة
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
