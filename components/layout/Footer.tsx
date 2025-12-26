import Link from "next/link";
import { Heart, Mail, Phone, MapPin, ArrowRight, Instagram, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
    return (
        <footer className="relative mt-32 border-t border-white/5 pt-20 pb-10 overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-rose-500/5 rounded-full blur-[100px] translate-y-1/3 pointer-events-none" />

            <div className="container-wide relative z-10">

                {/* 🚀 Pre-Footer CTA */}
                <div className="relative mb-24 p-12 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#1e1b2e] to-[#13111C] border border-white/10 text-center">
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />

                    <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                        <h2 className="text-4xl md:text-5xl font-black text-white">هل أنت مستعد <span className="text-aurora">للبداية؟</span></h2>
                        <p className="text-lg text-gray-400 leading-relaxed">انضم الآن إلى مجتمع سكينة وابدأ رحلة التعافي مع نخبة من الخبراء والمتخصصين في بيئة آمنة وداعمة.</p>
                        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                            <Link href="/register" className="btn-glow px-8 py-4 text-lg">
                                انشئ حساب مجاني
                                <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            </Link>
                            <Link href="/about" className="btn-ghost px-8 py-4">
                                تعرف علينا أكثر
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
                    {/* Brand */}
                    <div className="lg:col-span-4 space-y-6">
                        <Link href="/" className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                                <Heart className="w-6 h-6 text-white fill-white/20" />
                            </div>
                            <span className="text-3xl font-black text-white tracking-tight">سكينة.</span>
                        </Link>
                        <p className="text-gray-400 leading-relaxed max-w-sm">
                            المنصة العربية الأولى للدعم النفسي الجماعي. نؤمن بأن التعافي رحلة لا يجب أن تقطعها وحدك.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            {[Twitter, Instagram, Linkedin].map((Icon, idx) => (
                                <a key={idx} href="#" className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:scale-110 transition-all">
                                    <Icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links Groups */}
                    <div className="lg:col-span-2 space-y-6">
                        <h4 className="text-white font-bold text-lg">المنصة</h4>
                        <ul className="space-y-4">
                            {['عن سكينة', 'كيف نعمل', 'الأطباء', 'الأسعار'].map(item => (
                                <li key={item}><Link href="#" className="text-gray-400 hover:text-purple-400 transition-colors text-sm font-medium">{item}</Link></li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <h4 className="text-white font-bold text-lg">المصادر</h4>
                        <ul className="space-y-4">
                            {['المقالات', 'الدليل الشامل', 'البودكاست', 'اختبارات نفسية'].map(item => (
                                <li key={item}><Link href="#" className="text-gray-400 hover:text-purple-400 transition-colors text-sm font-medium">{item}</Link></li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <h4 className="text-white font-bold text-lg">قانوني</h4>
                        <ul className="space-y-4">
                            {['الشروط والأحكام', 'سياسة الخصوصية', 'ملفات تعريف الارتباط'].map(item => (
                                <li key={item}><Link href="#" className="text-gray-400 hover:text-purple-400 transition-colors text-sm font-medium">{item}</Link></li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                    <p>© 2024 سكينة. جميع الحقوق محفوظة.</p>
                    <div className="flex items-center gap-6">
                        <span>صنع بـ ❤️ في الوطن العربي</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
