"use client";

import { BookOpen } from "lucide-react";

export default function SpecialistCoursesPage() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h1 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
                <BookOpen className="w-8 h-8 text-primary" />
                الكورسات
            </h1>

            <div className="bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-sm p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-foreground">قريباً</h2>
                <p className="text-muted-foreground mt-2">صفحة إدارة الكورسات التفصيلية قيد التطوير.</p>
                <p className="text-sm text-muted-foreground mt-4">يمكنك حالياً إدارة الجلسات من الصفحة الرئيسية.</p>
            </div>
        </div>
    );
}
