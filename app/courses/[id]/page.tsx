import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SessionList from "@/components/courses/SessionList";
import CourseClientWrapper from "@/components/courses/CourseClientWrapper";
import {
    Clock,
    Users,
    Calendar,
    ArrowLeft,
    CheckCircle,
    Mic,
    Shield,
    Sparkles,
} from "lucide-react";

interface PageProps {
    params: Promise<{ id: string }>;
}

async function getCourse(id: string) {
    try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_URL}/api/courses/${id}`, {
            cache: 'no-store'
        });

        if (!res.ok) return null;

        const data = await res.json();
        return data.course; // returns course object with sessions included
    } catch (error) {
        console.error("Failed to fetch course:", error);
        return null;
    }
}

export default async function CourseDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const course = await getCourse(id);

    if (!course) {
        notFound();
    }

    // Adapt DB structure to UI needs
    // DB: course = { title, description, price, total_sessions, specialist: {...}, sessions: [...] }
    const sessions = course.sessions || [];
    const isAvailable = true; // For now assuming available, or check enrollment logic later

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
                                    {course.description}
                                </p>

                                {/* Quick Stats */}
                                <div className="flex flex-wrap gap-6 mt-8">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">المدة</p>
                                            <p className="font-bold text-foreground text-sm">{course.total_sessions} جلسات</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Users className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">المشاركين</p>
                                            <p className="font-bold text-foreground text-sm">متاح</p>
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
                                                {isAvailable ? `التسجيل متاح` : 'كتمل العدد'}
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
                                    <Users className="w-5 h-5 text-primary" />
                                    جدول الجلسات
                                </h2>

                                <SessionList
                                    sessions={sessions}
                                    courseId={course.id}
                                    specialistId={course.specialist_id}
                                />
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
                            {course.specialist && (
                                <div className="card-love p-8 text-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent" />
                                    <div className="relative z-10">
                                        <div className="w-24 h-24 rounded-full bg-white p-1 mx-auto mb-4 shadow-lg">
                                            {course.specialist.avatar ? (
                                                <img src={course.specialist.avatar} alt={course.specialist.nickname} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-secondary flex items-center justify-center text-4xl">
                                                    👩‍⚕️
                                                </div>
                                            )}
                                        </div>
                                        <h2 className="text-xl font-bold text-foreground mb-1">د. {course.specialist.nickname}</h2>
                                        <p className="text-primary font-medium text-sm mb-6">أخصائي نفسي</p>

                                        <div className="bg-background rounded-xl p-4 border border-border text-right text-sm text-muted-foreground leading-relaxed">
                                            "أتطلع لمشاركتكم هذه الرحلة نحو التعافي."
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {/* Floating Chat for Enrolled Users */}
            <CourseClientWrapper courseId={course.id} courseTitle={course.title} />

            <Footer />
        </div>
    );
}
