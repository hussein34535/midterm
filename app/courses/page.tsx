'use client';

import React from 'react';
import { Search, Filter, Sparkles, BookOpen } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import CourseCard from '../../components/ui/CourseCard';
import { courses } from '../../lib/data';

export default function CoursesPage() {
    return (
        <div className="bg-warm-mesh min-h-screen flex flex-col" dir="rtl">
            <Header />

            <main className="flex-grow pt-40 pb-20">
                {/* 🌌 Page Hero */}
                <div className="container mx-auto px-6 mb-16 relative">
                    <div className="max-w-3xl ml-auto text-right relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-sm font-bold text-primary">رحلات التعافي</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-serif font-black text-foreground mb-6 leading-tight">
                            اختر مسارك <br />
                            <span className="text-primary">نحو السكينة</span>
                        </h1>
                        <p className="text-xl text-muted-foreground font-light leading-relaxed max-w-2xl border-r-4 border-primary/20 pr-6 mr-0">
                            مكتبة متكاملة من الجلسات الصوتية، الكورسات المكثفة، وورش العمل التفاعلية المصممة لمساعدتك على تجاوز التحديات اليومية.
                        </p>
                    </div>
                </div>

                <div className="container mx-auto px-6">
                    {/* 🔍 Search Bar */}
                    <div className="card-love p-2 mb-16 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto -mt-8 relative z-20 shadow-xl shadow-primary/5 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
                        <div className="flex-grow relative group">
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="ابحث عن موضوع، شعور، أو اسم جلسة..."
                                className="w-full bg-transparent border-none rounded-xl py-4 pr-12 pl-6 text-foreground placeholder:text-muted-foreground/70 focus:bg-secondary/50 transition-all text-lg outline-none"
                            />
                        </div>
                        <button className="btn-primary px-8 py-4 whitespace-nowrap rounded-xl flex items-center gap-2 shadow-none">
                            <Filter className="w-5 h-5" />
                            <span>تصفية</span>
                        </button>
                    </div>

                    {/* 📦 Grid */}
                    {courses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            {courses.map((course) => (
                                <div key={course.id} className="group">
                                    <CourseCard {...course} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card-love py-32 text-center max-w-2xl mx-auto">
                            <BookOpen className="w-16 h-16 text-muted-foreground/20 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-foreground mb-2">لم نعثر على نتائج</h3>
                            <p className="text-muted-foreground">حاول البحث بكلمات مختلفة أو تصفح الأقسام الرئيسية.</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
