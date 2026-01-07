"use client";

import Link from "next/link";
import { ArrowRight, Heart, Shield, Users, Globe } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function AboutPage() {
    return (
        <div className="bg-warm-mesh min-h-screen" dir="rtl">
            <Header />

            <main className="pt-32 pb-20">
                {/* Hero */}
                <section className="container mx-auto px-6 mb-20 text-center max-w-4xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-sm mb-6 animate-in fade-in slide-in-from-bottom-2">
                        <Heart className="w-4 h-4 fill-current" />
                        <span>من نحن</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6 leading-tight animate-in fade-in slide-in-from-bottom-4 duration-700">
                        مساحة دافئة <br /> <span className="text-primary">لقلبك وعقلك</span>
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                        إيواء ليست مجرد منصة، بل هي بيت آمن لكل من يبحث عن السكينة والتوازن النفسي. نجمع بين الخبرة المهنية والاحتواء الإنساني.
                    </p>
                </section>

                {/* Mission & Vision */}
                <section className="bg-white/50 backdrop-blur-sm border-y border-primary/10 py-20 px-6">
                    <div className="container mx-auto max-w-5xl grid md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <h2 className="text-3xl font-serif font-bold text-foreground">
                                رسالتنا
                            </h2>
                            <p className="text-lg text-foreground/80 leading-relaxed">
                                نسعى لتقديم خدمات الدعم النفسي والمهارات الحياتية بجودة عالية وخصوصية تامة. نؤمن بأن الصحة النفسية حق للجميع، وهدفنا هو تيسير الوصول إلى متخصصين موثوقين في بيئة داعمة وخالية من الأحكام.
                            </p>
                            <Link href="/courses" className="btn-primary inline-flex gap-2">
                                استكشف خدماتنا
                                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="card-love p-6 text-center">
                                <Shield className="w-10 h-10 text-primary mx-auto mb-4" />
                                <h3 className="font-bold text-foreground">أمان وخصوصية</h3>
                            </div>
                            <div className="card-love p-6 text-center transform translate-y-8">
                                <Users className="w-10 h-10 text-primary mx-auto mb-4" />
                                <h3 className="font-bold text-foreground">نخبة المختصين</h3>
                            </div>
                            <div className="card-love p-6 text-center">
                                <Heart className="w-10 h-10 text-primary mx-auto mb-4" />
                                <h3 className="font-bold text-foreground">دعم مستمر</h3>
                            </div>
                            <div className="card-love p-6 text-center transform translate-y-8">
                                <Globe className="w-10 h-10 text-primary mx-auto mb-4" />
                                <h3 className="font-bold text-foreground">متاح للجميع</h3>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Team / Values */}
                <section className="container mx-auto px-6 py-20 text-center max-w-3xl">
                    <h2 className="text-3xl font-serif font-bold text-foreground mb-8">
                        لماذا إيواء؟
                    </h2>
                    <p className="text-muted-foreground leading-relaxed mb-12">
                        لأننا ندرك أن الرحلة قد تكون شاقة، فنحن هنا لنحمل عنك ونسير معك. منصة إيواء تأسست على مبادئ التعاطف، المهنية، والسرية المطلقة. نحن هنا لنسمعك، لنفهمك، ولنساعدك على العبور إلى بر الأمان.
                    </p>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                </section>
            </main>

            <Footer />
        </div>
    );
}
