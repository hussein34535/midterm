"use client";

import Link from "next/link"
import { ArrowRight, Shield, Sparkles, Heart, Clock } from "lucide-react"
import Header from "../../components/layout/Header"
import Footer from "../../components/layout/Footer"

export default function LandingPage() {
    return (
        <div className="bg-warm-mesh min-h-screen selection:bg-primary/10">
            <Header />

            <main>
                {/* 🌿 Warm Hero Section - Premium Mobile */}
                <section className="relative pt-32 md:pt-28 pb-12 md:pb-20 px-6 md:px-8">
                    <div className="container mx-auto max-w-4xl">
                        <div className="grid md:grid-cols-2 gap-10 md:gap-12 items-center">
                            {/* Text Side */}
                            <div className="text-center md:text-right space-y-6 md:space-y-8">
                                <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-xl shadow-primary/30 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                    <Heart className="w-4 h-4 fill-current" />
                                    <span>مكانك الآمن للحديث</span>
                                </div>

                                <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000">
                                    إيواء
                                    <br />
                                    <span className="text-primary">نحن معك</span>
                                </h1>

                                <p className="text-lg md:text-xl text-foreground/70 leading-[1.8] animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 max-w-md mx-auto md:mx-0">
                                    نحن هنا لنسمعك ونحتويك. تحدث بقلب مطمئن في جلسات دافئة مع أخصائيين يفهمونك.
                                </p>

                                <div className="pt-4 md:pt-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 flex justify-center md:justify-start">
                                    <Link href="/courses" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 md:px-8 md:py-5 bg-gradient-to-r from-primary to-primary/90 text-white font-bold text-sm md:text-lg rounded-2xl shadow-lg md:shadow-xl shadow-primary/20 md:shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                                        <Heart className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                                        <span>ابدأ رحلتك الآن</span>
                                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5 rtl:rotate-180" />
                                    </Link>
                                </div>

                                <div className="pt-8 animate-in fade-in duration-1000 delay-500">
                                    <p className="text-base text-foreground/60 font-medium">
                                        <span className="text-primary font-bold text-lg">+١٠,٠٠٠</span> قلب وجد إيواءه معنا
                                    </p>
                                </div>
                            </div>

                            {/* Image Side - Visible on Mobile now */}
                            <div className="block animate-in fade-in slide-in-from-left-10 duration-1000 delay-300 mt-8 md:mt-0 w-[85%] mx-auto md:w-full">
                                <img
                                    src="/hero.png"
                                    alt="إيواء - مجتمع دافئ"
                                    className="w-full h-auto rounded-3xl shadow-2xl shadow-primary/10 animate-float"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 📈 Friendly Stats - Premium Mobile */}
                <section className="bg-white/40 backdrop-blur-md border-y border-primary/10 shadow-inner">
                    <div className="container mx-auto px-6 md:px-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-x-reverse divide-primary/10">
                            {[
                                { label: "قلب مطمئن", val: "١٠,٠٠٠+", icon: Heart },
                                { label: "جلسة دافئة", val: "١,٢٠٠+", icon: Sparkles },
                                { label: "أخصائي حكيم", val: "٢٥+", icon: Shield },
                                { label: "دعم مستمر", val: "٢٤/٧", icon: Clock },
                            ].map((stat, idx) => (
                                <div key={idx} className="py-10 md:py-20 px-4 md:px-8 text-center group">
                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 md:mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 shadow-sm">
                                        <stat.icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                                    </div>
                                    <h3 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                                        {stat.val}
                                    </h3>
                                    <p className="text-foreground/60 font-bold text-sm md:text-base">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ✨ Features - Premium Mobile */}
                <section className="py-16 md:py-20 px-6 md:px-8">
                    <div className="container mx-auto max-w-2xl">
                        <div className="text-center mb-10 md:mb-14">
                            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3 md:mb-4">
                                لماذا <span className="text-primary">إيواء</span>؟
                            </h2>
                            <p className="text-base md:text-lg text-foreground/60">نعتني بك بكل حب</p>
                        </div>

                        <div className="space-y-4 md:space-y-5">
                            {[
                                {
                                    title: "ستر وأمان",
                                    desc: "خصوصيتك أولويتنا. تحدث بقلب مطمئن",
                                    icon: Shield,
                                },
                                {
                                    title: "صحبة صالحة",
                                    desc: "أخصائيون حكماء ومجتمع داعم",
                                    icon: Heart,
                                },
                                {
                                    title: "متاح دائماً",
                                    desc: "جلسات في أي وقت تحتاجنا",
                                    icon: Sparkles,
                                },
                            ].map((item, idx) => (
                                <div key={idx} className="p-5 md:p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-border/50 shadow-lg shadow-black/5 hover:shadow-xl hover:border-primary/20 transition-all duration-300 group">
                                    <div className="flex items-start gap-4 md:gap-5">
                                        <div className="w-14 h-14 md:w-16 md:h-16 flex-shrink-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                                            <item.icon className="w-7 h-7 md:w-8 md:h-8 text-primary" />
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">{item.title}</h3>
                                            <p className="text-foreground/60 text-base leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 🖼️ Testimonial - Premium Mobile */}
                <section className="py-14 md:py-20 px-6 bg-gradient-to-b from-primary/5 to-primary/10">
                    <div className="container mx-auto max-w-2xl text-center">
                        <Heart className="w-14 h-14 md:w-16 md:h-16 text-primary fill-primary/20 mx-auto mb-6 md:mb-8" />
                        <blockquote className="text-2xl md:text-3xl font-serif text-foreground leading-[1.6] mb-6 md:mb-8 px-4">
                            "في إيواء وجدت أخوة يمسحون عناء الأيام عن قلبي"
                        </blockquote>
                        <cite className="not-italic font-bold text-primary text-lg md:text-xl">— مريم</cite>
                    </div>
                </section>

                {/* 📬 Friendly CTA - Premium Mobile */}
                <section className="py-16 md:py-20 px-6 md:px-8">
                    <div className="container mx-auto max-w-2xl">
                        <div className="text-center space-y-6 md:space-y-8 p-8 md:p-10 bg-white/70 backdrop-blur-md rounded-3xl border border-border/50 shadow-2xl shadow-primary/10">
                            <h3 className="text-3xl md:text-4xl font-serif font-bold text-foreground">ابدأ اليوم</h3>
                            <p className="text-foreground/70 text-lg md:text-xl">نحن نسمعك. لا تتردد في البدء</p>
                            <Link href="/courses" className="inline-flex items-center justify-center gap-3 w-full md:w-auto px-8 py-4 md:py-5 bg-gradient-to-r from-primary to-primary/90 text-white font-bold text-lg rounded-2xl shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                                <Heart className="w-5 h-5 fill-current" />
                                <span>احجز جلستك الأولى</span>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Bottom spacing for mobile chat button */}
                <div className="h-24 md:h-0" />
            </main>

            <Footer />
        </div>
    )
}
