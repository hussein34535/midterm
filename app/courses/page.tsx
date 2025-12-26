'use client';

import React from 'react';
import { Search, Filter, Sparkles, BookOpen } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import CourseCard from '../../components/ui/CourseCard';
import { courses } from '../../lib/data';

export default function CoursesPage() {
    return (
        <div className="bg-noise min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow pt-40 pb-20">
                {/* 🌌 Page Hero */}
                <div className="container-wide mb-16 relative">
                    <div className="max-w-3xl ml-auto text-right relative z-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-6">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-sm font-bold text-purple-300">رحلات التعافي</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
                            اختر مسارك <br />
                            <span className="text-aurora">نحو السكينة</span>
                        </h1>
                        <p className="text-xl text-gray-400 font-light leading-relaxed max-w-2xl border-r-2 border-white/10 pr-6 mr-0">
                            مكتبة متكاملة من الجلسات الصوتية، الكورسات المكثفة، وورش العمل التفاعلية المصممة لمساعدتك على تجاوز التحديات اليومية.
                        </p>
                    </div>
                </div>

                <div className="container-wide">
                    {/* 🔍 Glass Search Bar */}
                    <div className="glass-panel p-2 mb-16 flex flex-col md:flex-row gap-2 max-w-4xl mx-auto -mt-8 relative z-20 shadow-2xl shadow-purple-900/20">
                        <div className="flex-grow relative group">
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                                <Search className="w-5 h-5 text-gray-400 group-focus-within:text-purple-400 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="ابحث عن موضوع، شعور، أو اسم جلسة..."
                                className="w-full bg-transparent border-none rounded-xl py-4 pr-12 pl-6 text-white placeholder-gray-500 focus:ring-0 focus:bg-white/5 transition-all text-lg"
                            />
                        </div>
                        <button className="btn-glow px-8 py-4 whitespace-nowrap rounded-xl flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            <span>تصفية</span>
                        </button>
                    </div>

                    {/* 📦 Floating Grid */}
                    {courses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {courses.map((course) => (
                                <div key={course.id} className="group perspective-1000">
                                    <div className="transform transition-all duration-500 group-hover:-translate-y-2 group-hover:rotate-x-2">
                                        <CourseCard {...course} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-panel py-32 text-center max-w-2xl mx-auto">
                            <BookOpen className="w-16 h-16 text-white/20 mx-auto mb-6" />
                            <h3 className="text-2xl font-bold text-white mb-2">لم نعثر على نتائج</h3>
                            <p className="text-gray-400">حاول البحث بكلمات مختلفة أو تصفح الأقسام الرئيسية.</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
