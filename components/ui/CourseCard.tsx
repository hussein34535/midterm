
import Link from 'next/link';
import { Clock, Star, ArrowRight, User } from 'lucide-react';

interface CourseCardProps {
    id: string | number;
    title: string;
    description: string;
    price: string | number;
    sessionPrice?: string | number; // سعر الجلسة من قاعدة البيانات
    // Flexible props to support different usages
    instructor?: string;
    duration?: string;
    rating?: number;
    reviews?: number;
    image?: string;
    // New props
    sessionsCount?: number;
    seatsRemaining?: number;
    specialist?: {
        nickname: string;
        title: string;
    };
    color?: string;
}

export default function CourseCard({
    id,
    title,
    instructor,
    duration,
    rating,
    reviews,
    price,
    sessionPrice,
    description,
    sessionsCount,
    specialist
}: CourseCardProps) {
    const displayInstructor = specialist?.nickname || instructor || 'أخصائي ايواء';
    const displayDuration = sessionsCount ? `${sessionsCount} جلسات` : (duration || '4 جلسات');

    return (
        <div className="card-love p-6 h-full flex flex-col relative overflow-hidden group hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-2xl border border-gray-100 shadow-sm">

            {/* Glow Effect on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="bg-secondary/50 text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-primary/10">
                    <Clock className="w-3 h-3" />
                    <span>{displayDuration}</span>
                </div>
            </div>

            {/* Content */}
            <div className="mb-4 relative z-10 flex-grow">
                <h3 className="text-xl font-serif font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">{title}</h3>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="w-3 h-3 text-gray-500" />
                    </div>
                    <p className="text-sm text-gray-600 font-medium">{displayInstructor}</p>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{description}</p>
            </div>

            {/* Footer / Price */}
            <div className="mt-auto pt-4 border-t border-border/50 relative z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {/* سعر الجلسة أولاً */}
                        {Number(sessionPrice) > 0 && (
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground mb-0.5">سعر الجلسة</p>
                                <p className="text-lg font-bold text-primary">{sessionPrice} <span className="text-xs font-normal text-muted-foreground">ج.م</span></p>
                            </div>
                        )}
                        {/* سعر الكورس كامل + التوفير جنبه */}
                        {Number(price) > 0 && (
                            <div className={`text-right ${Number(sessionPrice) > 0 ? 'border-r border-border/50 pr-4' : ''}`}>
                                <p className="text-xs text-muted-foreground mb-0.5">الكورس كامل</p>
                                <div className="flex items-center gap-2">
                                    {/* سعر أكبر لو لوحده */}
                                    <p className={`font-bold text-foreground ${Number(sessionPrice) > 0 ? 'text-sm' : 'text-xl text-primary'}`}>
                                        {price} <span className={`font-normal text-muted-foreground ${Number(sessionPrice) > 0 ? 'text-xs' : 'text-sm'}`}>ج.م</span>
                                    </p>
                                    {/* شارة التوفير بجانب السعر */}
                                    {Number(sessionPrice) > 0 && Number(sessionsCount) > 1 && (Number(sessionPrice) * Number(sessionsCount)) > Number(price) && (
                                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-200">
                                            وفّر {Math.round((Number(sessionPrice) * Number(sessionsCount)) - Number(price))} ج.م
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <Link href={`/courses/${id}`} className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all group/btn shadow-sm">
                        <ArrowRight className="w-5 h-5 group-hover/btn:-translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
