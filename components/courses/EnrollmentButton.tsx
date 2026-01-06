"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface EnrollmentButtonProps {
    courseId: string;
    coursePrice: number;
}

export default function EnrollmentButton({ courseId, coursePrice }: EnrollmentButtonProps) {
    const [loading, setLoading] = useState(true);
    const [isEnrolled, setIsEnrolled] = useState(false);
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
            const res = await fetch(`${API_URL}/api/courses/${courseId}/enrollment-status`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setIsEnrolled(data.isEnrolled || false);
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

    return (
        <Link
            href={`/payment/${courseId}`}
            className="btn-primary w-full text-lg py-4 justify-center shadow-lg shadow-primary/20 hover:scale-105"
        >
            سجل مكانك
            <ArrowLeft className="w-5 h-5 mr-2" />
        </Link>
    );
}
