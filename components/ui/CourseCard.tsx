
import Link from 'next/link';
import { Clock, Star, ArrowRight } from 'lucide-react';

interface CourseCardProps {
    id: number;
    title: string;
    instructor: string;
    duration: string;
    rating: number;
    reviews: number;
    image: string;
    price: string;
    description: string;
}

export default function CourseCard({ id, title, instructor, duration, rating, reviews, price, description }: CourseCardProps) {
    return (
        <div className="card-love p-6 h-full flex flex-col relative overflow-hidden group hover:border-primary/50 transition-all duration-300 transform hover:-translate-y-1">

            {/* Glow Effect on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="bg-secondary text-primary px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-primary/10">
                    <Clock className="w-3 h-3" />
                    <span>{duration}</span>
                </div>
            </div>

            {/* Content */}
            <div className="mb-4 relative z-10">
                <h3 className="text-xl font-serif font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2">{title}</h3>
                <p className="text-sm text-primary mb-2 font-medium">د. {instructor}</p>
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
            </div>

            {/* Footer / Price */}
            <div className="mt-auto pt-4 border-t border-border flex items-center justify-between relative z-10">
                <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-0.5">سعر الجلسة</p>
                    <p className="text-lg font-black text-foreground">{price} <span className="text-xs font-normal text-muted-foreground">ج.م</span></p>
                </div>

                <Link href={`/courses/${id}`} className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-all group/btn shadow-sm">
                    <ArrowRight className="w-5 h-5 group-hover/btn:-translate-x-0.5 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
