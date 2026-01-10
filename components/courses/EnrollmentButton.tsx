"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2, CreditCard, Lock, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface EnrollmentButtonProps {
    courseId: string;
    coursePrice: number;
    sessionPrice?: number;
    totalSessions?: number;
}

interface SessionPaymentInfo {
    next_session: number | null;
    price: number;
    total_sessions: number;
    has_pending_payment: boolean;
    paid_sessions?: { session_number: number }[];
    full_course?: boolean;
}

export default function EnrollmentButton({
    courseId,
    coursePrice,
    sessionPrice,
    totalSessions
}: EnrollmentButtonProps) {
    const [loading, setLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [sessionInfo, setSessionInfo] = useState<SessionPaymentInfo | null>(null);
    const router = useRouter();

    useEffect(() => {
        checkEnrollment();
    }, [courseId]);

    const checkEnrollment = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }

            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

            // Check full enrollment
            const res = await fetch(`${API_URL}/api/courses/${courseId}/enrollment-status`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setIsEnrolled(data.isEnrolled || false);

                // If not enrolled, check for session payments
                if (!data.isEnrolled && sessionPrice && sessionPrice > 0) {
                    const sessionRes = await fetch(`${API_URL}/api/courses/${courseId}/next-session-to-pay`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });

                    if (sessionRes.ok) {
                        const sessionData = await sessionRes.json();
                        setSessionInfo(sessionData);
                    }
                }
            }
        } catch (error) {
            console.error("Enrollment check failed:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full py-4 bg-gray-100 rounded-xl flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
        );
    }

    // Fully enrolled
    if (isEnrolled) {
        return (
            <div className="space-y-3">
                <div className="p-4 rounded-xl border bg-green-50/50 border-green-200 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-green-700">أنت مسجل بالفعل</p>
                        <p className="text-xs text-green-600">تابع الجلسات من صفحة لوحتك</p>
                    </div>
                </div>
                <Link
                    href="/dashboard"
                    className="btn-primary w-full text-lg py-4 justify-center shadow-lg shadow-primary/20"
                >
                    اذهب للوحة
                    <ArrowLeft className="w-5 h-5 mr-2" />
                </Link>
            </div>
        );
    }

    // Pending Payment
    if (sessionInfo?.has_pending_payment) {
        return (
            <div className="p-4 rounded-xl border bg-orange-50 border-orange-200 text-center">
                <Lock className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-orange-700">طلب دفع قيد المراجعة</p>
                <p className="text-xs text-orange-600">سيتم تفعيل الجلسة بعد التحقق</p>
            </div>
        );
    }

    // --- PAYMENT OPTIONS Logic ---
    const nextSession = sessionInfo?.next_session || 1;
    const paidSessions = nextSession - 1;
    const hasSessionOption = sessionPrice && sessionPrice > 0;
    const hasCourseOption = coursePrice && coursePrice > 0;

    // Calculate Savings
    let savings = 0;
    if (hasSessionOption && hasCourseOption && totalSessions) {
        savings = (sessionPrice * totalSessions) - coursePrice;
    }

    return (
        <div className="space-y-4">
            {/* Progress Indicator (if started payment per session) */}
            {paidSessions > 0 && (
                <div className="mb-2 p-2 rounded-lg bg-primary/5 border border-primary/10 flex items-center gap-2 text-xs font-semibold text-primary">
                    <CreditCard className="w-4 h-4" />
                    <span>تم دفع {paidSessions} من {totalSessions || '?'} جلسات</span>
                </div>
            )}

            {/* Option 2: Per Session (Top Option) */}
            {hasSessionOption && (
                <Link
                    href={`/payment/${courseId}?type=session&session=${nextSession}`}
                    className="block w-full group"
                >
                    <div className="p-4 rounded-[2rem] border border-border bg-white hover:border-primary/50 hover:bg-secondary/30 transition-all flex items-center justify-between">
                        <div className="flex flex-col items-start gap-1">
                            <span className="font-bold text-foreground">
                                {paidSessions > 0 ? `ادفع الجلسة ${nextSession}` : "ابدأ بالجلسة الأولى"}
                            </span>
                            <span className="text-xs text-muted-foreground mr-1">دفع مرن • جلسة بجلسة</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-lg text-primary">{sessionPrice} ج.م</span>
                            <ArrowLeft className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:-translate-x-1" />
                        </div>
                    </div>
                </Link>
            )}

            {/* Divider */}
            {hasCourseOption && hasSessionOption && (
                <div className="relative flex items-center py-2 opacity-60">
                    <div className="flex-grow border-t border-border"></div>
                    <span className="flex-shrink-0 mx-3 text-xs font-medium text-muted-foreground">أو للأفضل</span>
                    <div className="flex-grow border-t border-border"></div>
                </div>
            )}

            {/* Option 1: Full Course (Slightly Bigger & Clearer Discount) */}
            {hasCourseOption && (
                <Link
                    href={`/payment/${courseId}?type=course`}
                    className="block w-full group relative mt-1"
                >
                    {savings > 0 && (
                        // Increased size and readjusted position as requested
                        <div className="absolute -top-3 left-6 bg-green-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md z-10 animate-pulse border border-green-400">
                            وفر {savings} ج.م
                        </div>
                    )}
                    {/* Increased padding from p-3 to p-5 to make rectangle bigger */}
                    <div className="p-5 rounded-[2rem] border-2 border-primary/20 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all flex items-center justify-between group-hover:shadow-lg">
                        <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2">
                                <span className="font-black text-primary text-xl">اشتراك كامل</span>
                                {savings > 0 && <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                            </div>
                            <span className="text-sm text-muted-foreground font-medium">دفعة واحدة • وصول دائم</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="font-black text-2xl text-foreground">{coursePrice} ج.م</span>
                            <div className="flex items-center gap-1 text-primary text-xs font-bold mt-1">
                                <span>اشترك الآن</span>
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                            </div>
                        </div>
                    </div>
                </Link>
            )}

            {/* Free Option */}
            {!hasCourseOption && !hasSessionOption && (
                <Link
                    href={`/payment/${courseId}?type=free`}
                    className="btn-primary w-full text-lg py-4 justify-center shadow-lg shadow-primary/20 hover:scale-105"
                >
                    سجل مجاناً
                    <ArrowLeft className="w-5 h-5 mr-2" />
                </Link>
            )}
        </div>
    );
}
