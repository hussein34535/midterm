import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getCourseById } from "@/lib/data";
import {
    Clock,
    Users,
    Calendar,
    CreditCard,
    ArrowLeft,
    CheckCircle,
    Mic,
    Shield,
    User
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
        <div className="gradient-bg min-h-screen">
            <Header />

            <main className="pt-28 pb-20 px-6">
                <div className="container mx-auto max-w-4xl">
                    {/* Breadcrumb */}
                    <div className="mb-8">
                        <Link
                            href="/courses"
                            className="text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                            العودة للكورسات
                        </Link>
                    </div>

                    {/* Course Header */}
                    <div className="glass-card p-8 mb-8">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                            <div className="flex-1">
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
                                    style={{ background: `linear-gradient(135deg, ${course.color}40, ${course.color}20)` }}
                                >
                                    💜
                                </div>
                                <h1 className="text-3xl font-bold text-white mb-3">
                                    {course.title}
                                </h1>
                                <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
                                    {course.longDescription}
                                </p>
                            </div>

                            {/* Price Card */}
                            <div className="md:w-72 shrink-0">
                                <div className="bg-[var(--bg-darker)] rounded-2xl p-6 border border-[var(--glass-border)]">
                                    <div className="flex items-baseline gap-2 mb-4">
                                        <span className="text-4xl font-bold text-white">{course.price}</span>
                                        <span className="text-[var(--text-muted)]">ج.م</span>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                            <Clock className="w-4 h-4 text-[var(--primary)]" />
                                            <span>{course.sessionsCount} جلسات</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                            <Users className="w-4 h-4 text-[var(--primary)]" />
                                            <span>{course.seatsTotal} مشاركين كحد أقصى</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                            <Calendar className="w-4 h-4 text-[var(--primary)]" />
                                            <span>{course.schedule}</span>
                                        </div>
                                    </div>

                                    <span className={`block text-center text-sm px-4 py-2 rounded-full mb-4 ${isAvailable
                                            ? 'bg-[var(--success)]/20 text-[var(--success)]'
                                            : 'bg-[var(--warning)]/20 text-[var(--warning)]'
                                        }`}>
                                        {isAvailable ? `${course.seatsRemaining} مقاعد متبقية` : 'قائمة انتظار'}
                                    </span>

                                    <Link
                                        href={`/payment/${course.id}`}
                                        className="btn-primary w-full text-lg py-4 justify-center"
                                    >
                                        {isAvailable ? 'سجل الآن' : 'انضم لقائمة الانتظار'}
                                        <ArrowLeft className="w-5 h-5" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Specialist */}
                    <div className="glass-card p-6 mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4">الأخصائي</h2>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
                                <User className="w-7 h-7 text-[var(--primary)]" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-white">{course.specialist.nickname}</p>
                                <p className="text-[var(--text-secondary)]">{course.specialist.title}</p>
                            </div>
                        </div>
                    </div>

                    {/* Sessions */}
                    <div className="glass-card p-6 mb-8">
                        <h2 className="text-xl font-semibold text-white mb-6">جدول الجلسات</h2>
                        <div className="space-y-4">
                            {course.sessions.map((session) => (
                                <div
                                    key={session.number}
                                    className="flex items-center gap-4 p-4 bg-[var(--bg-darker)] rounded-xl border border-[var(--glass-border)]"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] font-bold">
                                        {session.number}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white font-medium">{session.theme}</p>
                                        <p className="text-sm text-[var(--text-muted)]">
                                            {session.date} - {session.time}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Features */}
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-semibold text-white mb-6">مميزات الكورس</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-[var(--primary)] mt-1" />
                                <div>
                                    <p className="text-white font-medium">خصوصية كاملة</p>
                                    <p className="text-sm text-[var(--text-secondary)]">هويتك مجهولة تماماً</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mic className="w-5 h-5 text-[var(--primary)] mt-1" />
                                <div>
                                    <p className="text-white font-medium">صوت فقط</p>
                                    <p className="text-sm text-[var(--text-secondary)]">لا حاجة لكاميرا</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="w-5 h-5 text-[var(--primary)] mt-1" />
                                <div>
                                    <p className="text-white font-medium">مجموعة داعمة</p>
                                    <p className="text-sm text-[var(--text-secondary)]">نفس الفريق طوال الكورس</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-[var(--primary)] mt-1" />
                                <div>
                                    <p className="text-white font-medium">شهادة إتمام</p>
                                    <p className="text-sm text-[var(--text-secondary)]">عند إكمال الكورس</p>
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
