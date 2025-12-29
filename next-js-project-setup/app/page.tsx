"use cache"
import Link from "next/link"
import { ArrowRight, Shield, Sparkles, Heart, Clock } from "lucide-react"
import Header from "../components/layout/Header"
import Footer from "../components/layout/Footer"

export default async function LandingPage() {
  // Sakina: A sanctuary for the heart
  return (
    <div className="bg-warm-mesh min-h-screen selection:bg-primary/10">
      <Header />

      <main>
        {/* 🌿 Warm Hero Section */}
        <section className="relative pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-2xl">
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Heart className="w-4 h-4 fill-current" />
                <span>مكانك الآمن للحديث</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000">
                سكينة
                <br />
                <span className="text-primary">نحن معك</span>
              </h1>

              <p className="text-lg md:text-xl text-foreground/70 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 px-4">
                نحن هنا لنسمعك ونحتويك. تحدث بقلب مطمئن في جلسات دافئة مع أخصائيين يفهمونك.
              </p>

              <div className="pt-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                <Link href="/sessions" className="btn-primary w-full md:w-auto md:px-12">
                  <Heart className="w-5 h-5 fill-current" />
                  <span>ابدأ رحلتك الآن</span>
                  <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                </Link>
              </div>

              <div className="pt-8 animate-in fade-in duration-1000 delay-500">
                <p className="text-sm text-foreground/60 font-medium">
                  <span className="text-primary font-bold">+١٠,٠٠٠</span> قلب وجد سكينته معنا
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 📈 Friendly Stats */}
        <section className="bg-white/30 backdrop-blur-sm border-y border-primary/10">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-x-reverse divide-primary/10">
              {[
                { label: "قلب مطمئن", val: "١٠,٠٠٠+", icon: Heart },
                { label: "جلسة دافئة", val: "١,٢٠٠+", icon: Sparkles },
                { label: "أخصائي حكيم", val: "٢٥+", icon: Shield },
                { label: "دعم مستمر", val: "٢٤/٢٢", icon: Clock },
              ].map((stat, idx) => (
                <div key={idx} className="py-20 px-8 text-center group">
                  <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 transition-colors">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-4xl font-serif font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {stat.val}
                  </h3>
                  <p className="text-foreground/60 font-bold text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ✨ Features - Organic List */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-2xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                لماذا <span className="text-primary">سكينة</span>؟
              </h2>
              <p className="text-foreground/60">نعتني بك بكل حب</p>
            </div>

            <div className="space-y-4">
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
                <div key={idx} className="card-love">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 flex-shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-2">{item.title}</h3>
                      <p className="text-foreground/60 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 🖼️ Testimonial */}
        <section className="py-16 px-4 bg-primary/5">
          <div className="container mx-auto max-w-2xl text-center">
            <Heart className="w-12 h-12 text-primary fill-primary/10 mx-auto mb-6" />
            <blockquote className="text-2xl md:text-3xl font-serif text-foreground leading-relaxed mb-6 px-4">
              "في سكينة وجدت أخوة يمسحون عناء الأيام عن قلبي"
            </blockquote>
            <cite className="not-italic font-bold text-primary">— مريم</cite>
          </div>
        </section>

        {/* 📬 Friendly CTA */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-2xl">
            {/* Ensured proper spacing in classNames to avoid concatenation errors */}
            <div className="card-love text-center space-y-6 p-8">
              <h3 className="text-3xl md:text-4xl font-serif font-bold text-foreground">ابدأ اليوم</h3>
              <p className="text-foreground/70 text-lg">نحن نسمعك. لا تتردد في البدء</p>
              <Link href="/sessions" className="btn-primary w-full md:w-auto md:px-12">
                <Heart className="w-5 h-5 fill-current" />
                <span>احجز جلستك الأولى</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
