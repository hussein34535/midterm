'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Sparkles, BookOpen, Loader2 } from 'lucide-react';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import CourseCard from '../../components/ui/CourseCard';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Course {
    id: string;
    title: string;
    description: string;
    price: number;
    total_sessions: number;
    specialist?: {
        nickname: string;
    };
}

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await fetch(`${API_URL}/api/courses`);
            if (res.ok) {
                const data = await res.json();
                setCourses(data.courses || []);
            }
        } catch (err) {
            console.error('Failed to fetch courses:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter courses by search query
    const filteredCourses = courses.filter(course =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

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
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-none rounded-xl py-4 pr-12 pl-6 text-foreground placeholder:text-muted-foreground/70 focus:bg-secondary/50 transition-all text-lg outline-none"
                            />
                        </div>
                        <button className="btn-primary px-8 py-4 whitespace-nowrap rounded-xl flex items-center gap-2 shadow-none">
                            <Filter className="w-5 h-5" />
                            <span>تصفية</span>
                        </button>
                    </div>

                    {/* 📦 Grid */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredCourses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            {filteredCourses.map((course) => (
                                <div key={course.id} className="group">
                                    <CourseCard
                                        id={course.id}
                                        title={course.title}
                                        description={course.description}
                                        sessionsCount={course.total_sessions}
                                        seatsRemaining={10}
                                        price={course.price}
                                        specialist={{
                                            nickname: course.specialist?.nickname || 'أخصائي',
                                            title: 'أخصائي نفسي'
                                        }}
                                        color="#8B5CF6"
                                    />
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
