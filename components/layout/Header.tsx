"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [user, setUser] = useState<any>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20)
        window.addEventListener("scroll", handleScroll)

        // Check local storage for user
        const checkUser = () => {
            const stored = localStorage.getItem('user');
            if (stored) {
                try {
                    setUser(JSON.parse(stored));
                } catch (e) {
                    console.error("Invalid user data");
                }
            } else {
                setUser(null);
            }
        };

        checkUser();
        window.addEventListener('storage', checkUser);
        window.addEventListener('user-login', checkUser);

        // Close menu when clicking outside
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.user-menu-container')) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener('storage', checkUser);
            window.removeEventListener('user-login', checkUser);
            document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        window.location.href = '/';
    };

    const navItems = [
        { name: "الرئيسية", href: "/" },
        { name: "الجلسات", href: "/courses" },
        { name: "قصتنا", href: "/#about" },
        { name: "تواصل معنا", href: "/#contact" },
    ]

    return (
        <header
            dir="rtl"
            className={cn(
                "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-6 py-4",
                isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border py-3" : "bg-transparent",
            )}
        >
            <div className="container mx-auto flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-serif font-bold text-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-primary/20">
                        س
                    </div>
                    <span className="text-3xl font-serif font-bold tracking-tight text-foreground">سكينة</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-12">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="text-base font-bold text-foreground/60 hover:text-primary transition-colors relative group/item"
                        >
                            {item.name}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary/30 transition-all group-hover/item:w-full" />
                        </Link>
                    ))}
                </nav>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-6">
                    {user ? (
                        <div className="relative user-menu-container">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-4 pl-3 pr-6 py-2 rounded-full bg-background/50 hover:bg-secondary transition-all border border-transparent hover:border-primary/20 shadow-sm hover:shadow-md group min-w-[200px] justify-end"
                            >
                                <div className="text-right">
                                    <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors max-w-[140px] truncate leading-tight">
                                        {user.nickname || "المستخدم"}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground font-medium leading-tight opacity-70">
                                        متصل الآن
                                    </p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-colors shrink-0 shadow-sm">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-primary font-bold text-lg">
                                            {(user.nickname || "U").charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </button>

                            {/* Dropdown Menu */}
                            {isUserMenuOpen && (
                                <div className="absolute top-full text-right left-0 mt-3 w-64 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-xl p-2 animate-in fade-in slide-in-from-top-2 z-50">
                                    <div className="px-4 py-3 border-b border-border/50 mb-2">
                                        <p className="text-xs text-muted-foreground mb-1">مسجل باسم</p>
                                        <p className="text-sm font-bold text-foreground truncate" dir="ltr">{user.email}</p>
                                    </div>

                                    <Link
                                        href="/settings"
                                        className="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-primary/5 hover:text-primary rounded-xl transition-colors mb-1"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        <span>⚙️</span> إعدادات الحساب
                                    </Link>
                                    <Link
                                        href="/dashboard"
                                        className="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-primary/5 hover:text-primary rounded-xl transition-colors mb-1"
                                        onClick={() => setIsUserMenuOpen(false)}
                                    >
                                        <span>📊</span> لوحة التحكم
                                    </Link>

                                    <div className="h-px bg-border/50 my-1" />

                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                                    >
                                        <span>🚪</span> تسجيل خروج
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className="text-base font-bold text-foreground/70 hover:text-primary transition-colors">
                                دخول
                            </Link>
                            <Link href="/register" className="btn-primary py-2.5 px-8 text-base shadow-md hover:shadow-lg">
                                انضم إلينا
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button className="md:hidden text-foreground" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-6 space-y-4 animate-in fade-in slide-in-from-top-4">
                    {navItems.map((item) => (
                        <Link key={item.name} href={item.href} className="block text-lg font-bold text-foreground">
                            {item.name}
                        </Link>
                    ))}
                    <div className="flex flex-col gap-3 pt-4 border-t border-border">
                        {user ? (
                            <>
                                <Link href="/settings" className="block text-center text-lg font-bold text-foreground hover:text-primary">
                                    ⚙️ إعدادات الحساب
                                </Link>
                                <button onClick={handleLogout} className="block w-full text-center text-lg font-bold text-red-500 hover:bg-red-50 rounded-xl py-2">
                                    تسجيل خروج
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="block text-center text-lg font-bold text-foreground/80 hover:text-primary">
                                    دخول
                                </Link>
                                <Link href="/register" className="block bg-primary text-white text-center py-3 rounded-full font-bold shadow-md">
                                    انضم إلينا
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}
