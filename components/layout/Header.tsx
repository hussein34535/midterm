'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Menu, LogIn, Sparkles } from 'lucide-react';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);

    // Scroll Effect
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'py-4' : 'py-6'}`}>
            <nav className="container-wide">
                <div className={`
                    flex items-center justify-between px-6 py-3 rounded-full transition-all duration-500
                    ${scrolled
                        ? 'bg-[#030014]/80 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]'
                        : 'bg-transparent border border-transparent'}
                `}>

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-rose-500 rounded-xl rotate-3 group-hover:rotate-6 transition-transform shadow-lg flex items-center justify-center">
                                <Heart className="w-6 h-6 text-white fill-white/20" />
                            </div>
                            <div className="absolute inset-0 bg-white/20 blur-lg rounded-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-2xl font-black text-white tracking-tight">
                            سكينة
                            <span className="text-purple-400">.</span>
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8 bg-white/5 px-8 py-2.5 rounded-full border border-white/5 backdrop-blur-sm">
                        <Link href="/" className="text-white/80 hover:text-white font-medium transition-colors relative group">
                            الرئيسية
                            <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-gradient-to-l from-purple-500 to-rose-500 group-hover:w-full transition-all duration-300" />
                        </Link>
                        <Link href="/courses" className="text-white/80 hover:text-white font-medium transition-colors relative group">
                            الجلسات
                            <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-gradient-to-l from-purple-500 to-rose-500 group-hover:w-full transition-all duration-300" />
                        </Link>
                        <Link href="/dashboard" className="text-white/80 hover:text-white font-medium transition-colors relative group">
                            مساحتي
                            <span className="absolute -bottom-1 right-0 w-0 h-0.5 bg-gradient-to-l from-purple-500 to-rose-500 group-hover:w-full transition-all duration-300" />
                        </Link>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hidden sm:flex items-center gap-2 text-white/70 hover:text-white font-medium transition-colors">
                            <span>تسجيل دخول</span>
                        </Link>
                        <Link href="/register" className="btn-glow px-6 py-2.5 text-sm rounded-full flex items-center gap-2">
                            <span>ابدأ الرحلة</span>
                            <Sparkles className="w-4 h-4" />
                        </Link>
                    </div>

                </div>
            </nav>
        </header>
    );
}
