import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getCourseById } from "@/lib/data";
import {
    Clock,
    Users,
    Calendar,
    ArrowLeft,
    CheckCircle,
    Mic,
    Shield,
    User,
    Sparkles,
    Heart
} from "lucide-react";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function CourseDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const course = getCourseById(id);

    if (!course) {
        notFound();
    }

    const isAvailable = course.seatsRemaining > 0;

    return (
        <div className="bg-warm-mesh min-h-screen flex flex-col" dir="rtl">
            <Header />

            <main className="flex-grow pt-32 pb-20 px-4">
                <div className="container mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Breadcrumb */}
                    <div className="mb-8">
                        <Link
                            href="/courses"
                            className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                            العودة للكورسات
                        </Link>
                    </div>

                    {/* Course Header */}
                    <div className="card-love p-8 mb-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-full -translate-x-10 -translate-y-10" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-8">
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-bold text-primary">رحلة تعافي</span>
                                </div>

                                <h1 className="text-3xl md:text-4xl font-serif font-black text-foreground mb-4 leading-tight">
                                    {course.title}
                                </h1>
                                <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl border-r-4 border-primary/20 pr-6">
                                    {course.longDescription}
                                </p>

                                {/* Quick Stats */}
                                <div className="flex flex-wrap gap-6 mt-8">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">المدة الحالية</p>
                                            <p className="font-bold text-foreground text-sm">{course.sessionsCount} جلسات</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">المشاركين</p>
                                            <p className="font-bold text-foreground text-sm">{course.seatsTotal} أفراد</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">الموعد</p>
                                            <p className="font-bold text-foreground text-sm">{course.schedule}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Price Card */}
                            <div className="w-full md:w-80 shrink-0">
                                <div className="bg-secondary/50 rounded-2xl p-6 border border-border">
                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-4xl font-black text-foreground">{course.price}</span>
                                        <span className="text-sm font-medium text-muted-foreground">ج.م</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-6">شامل جميع الجلسات والمتابعة</p>

                                    <div className="space-y-4 mb-6">
                                        <div className={`p-3 rounded-xl border flex items-center gap-3 ${isAvailable ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                                            <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                            <span className={`text-sm font-bold ${isAvailable ? 'text-green-700' : 'text-red-700'}`}>
                                                {isAvailable ? `${course.seatsRemaining} مقاعد متبقية` : 'اكتمل العدد'}
                                            </span>
                                        </div>
                                    </div>

                                    <Link
                                        href={isAvailable ? `/payment/${course.id}` : '#'}
                                        aria-disabled={!isAvailable}
                                        className={`btn-primary w-full text-lg py-4 justify-center shadow-lg shadow-primary/20 ${!isAvailable ? 'opacity-50 cursor-not-allowed pointer-events-none grayscale' : 'hover:scale-105'}`}
                                    >
                                        {isAvailable ? 'سجل مكانك' : 'قائمة الانتظار'}
                                        {isAvailable && <ArrowLeft className="w-5 h-5 mr-2" />}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Sessions */}
                            <div className="card-love p-8">
                                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                                    <Heart className="w-5 h-5 text-primary" />
                                    رحلة التعافي (جدول الجلسات)
                                </h2>
                                <div className="space-y-4">
                                    {course.sessions.map((session) => (
                                        <div
                                            key={session.number}
                                            className="group flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-primary/20 hover:bg-secondary/50 transition-all cursor-default"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold group-hover:scale-110 transition-transform">
                                                {session.number}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-foreground font-bold text-lg mb-1">{session.theme}</p>
                                                <p className="text-sm text-muted-foreground font-mono">
                                                    {session.date} • {session.time}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Features */}
                            <div className="card-love p-8">
                                <h2 className="text-xl font-bold text-foreground mb-6">مميزات الرحلة</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {[
                                        { icon: Shield, title: "خصوصية كاملة", desc: "هويتك مجهولة تماماً" },
                                        { icon: Mic, title: "صوت فقط", desc: "لا حاجة لفتح الكاميرا" },
                                        { icon: Users, title: "صحبة صالحة", desc: "دعم متبادل وآمن" },
                                        { icon: CheckCircle, title: "أدوات عملية", desc: "تمارين وواجبات تطبيقية" },
                                    ].map((feat, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-background border border-border">
                                            <feat.icon className="w-5 h-5 text-primary mt-1" />
                                            <div>
                                                <p className="text-foreground font-bold mb-1">{feat.title}</p>
                                                <p className="text-xs text-muted-foreground">{feat.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Specialist Sidebar */}
                        <div className="space-y-8">
                            <div className="card-love p-8 text-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent" />
                                <div className="relative z-10">
                                    <div className="w-24 h-24 rounded-full bg-white p-1 mx-auto mb-4 shadow-lg">
                                        <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-4xl">
                                            👩‍⚕️
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-foreground mb-1">د. {course.specialist.nickname}</h2>
                                    <p className="text-primary font-medium text-sm mb-6">{course.specialist.title}</p>

                                    <div className="bg-background rounded-xl p-4 border border-border text-right text-sm text-muted-foreground leading-relaxed">
                                        "هدفي في هذه الرحلة أن أكون المرشد الأمين لكم. سنمشي معاً خطوة بخطوة نحو التعافي والسكينة."
                                    </div>
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
