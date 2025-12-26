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
        <div className="glass-panel p-6 h-full flex flex-col relative overflow-hidden group hover:border-purple-500/50 transition-all duration-300">

            {/* Glow Effect on Hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="bg-purple-500/10 border border-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{duration}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-bold text-white">{rating}</span>
                    <span className="text-xs text-gray-500">({reviews})</span>
                </div>
            </div>

            {/* Content */}
            <div className="mb-4 relative z-10">
                <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors line-clamp-2">{title}</h3>
                <p className="text-sm text-gray-400 mb-2 font-medium">د. {instructor}</p>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{description}</p>
            </div>

            {/* Footer / Price */}
            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                <div className="text-right">
                    <p className="text-xs text-gray-500 mb-0.5">سعر الجلسة</p>
                    <p className="text-lg font-black text-white">{price} <span className="text-xs font-normal text-gray-500">ج.م</span></p>
                </div>

                <Link href={`/payment/${id}`} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-purple-600 hover:border-purple-600 transition-all group/btn">
                    <ArrowRight className="w-5 h-5 group-hover/btn:-translate-x-0.5 transition-transform" />
                </Link>
            </div>
        </div>
    );
}
