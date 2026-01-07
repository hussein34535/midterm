"use client";

import { useState } from "react";
import { ArrowRight, Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        // Simulate API call
        setTimeout(() => {
            setSending(false);
            toast.success('تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.');
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 1500);
    };

    return (
        <div className="bg-warm-mesh min-h-screen" dir="rtl">
            <Header />

            <main className="pt-32 pb-20">
                <section className="container mx-auto px-6 max-w-6xl">
                    <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
                        {/* Make Contact Info */}
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
                                    تواصل معنا
                                </h1>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    نحن هنا للإجابة على استفساراتك. لا تتردد في مراسلتنا في أي وقت وسنكون سعداء بمساعدتك.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <div className="card-love p-6 flex items-start gap-4 hover:border-primary/40 transition-colors">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground mb-1">البريد الإلكتروني</h3>
                                        <p className="text-muted-foreground text-sm font-sans mb-1">support@ewaa.com</p>
                                        <p className="text-xs text-primary font-medium">نرد عادةً خلال 24 ساعة</p>
                                    </div>
                                </div>

                                <div className="card-love p-6 flex items-start gap-4 hover:border-primary/40 transition-colors">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground mb-1">الهاتف</h3>
                                        <p className="text-muted-foreground text-sm font-sans mb-1">+20 100 000 0000</p>
                                        <p className="text-xs text-primary font-medium">متاح من 9 صباحاً - 5 مساءً</p>
                                    </div>
                                </div>

                                <div className="card-love p-6 flex items-start gap-4 hover:border-primary/40 transition-colors">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <MapPin className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-foreground mb-1">المقر الرئيسي</h3>
                                        <p className="text-muted-foreground text-sm">القاهرة، مصر</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="animate-in fade-in slide-in-from-left-4 duration-700 delay-200">
                            <div className="card-love p-8 md:p-10 shadow-xl border-primary/10">
                                <h2 className="text-2xl font-bold text-foreground mb-6">أرسل لنا رسالة</h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-foreground mb-2">الاسم</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none transition-all"
                                            placeholder="اسمك الكريم"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-foreground mb-2">البريد الإلكتروني</label>
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none transition-all"
                                            placeholder="ex. name@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-foreground mb-2">الموضوع</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none transition-all"
                                            placeholder="بخصوص ماذا تتواصل معنا؟"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-foreground mb-2">الرسالة</label>
                                        <textarea
                                            required
                                            rows={5}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none transition-all resize-none"
                                            placeholder="اكتب رسالتك هنا..."
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="btn-primary w-full py-4 justify-center text-lg mt-4 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                                    >
                                        {sending ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                            <>
                                                إرسال الرسالة
                                                <Send className="w-5 h-5 mr-2 rtl:rotate-180" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
