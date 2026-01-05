"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Shield, Crown, User, MessageCircle, BookOpen, Home, Settings, LogOut, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [user, setUser] = useState<any>(null);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20)
        window.addEventListener("scroll", handleScroll)

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

        // Fetch unread count
        const fetchUnread = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await fetch(`${API_URL}/api/messages/unread-count`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setUnreadCount(data.unreadCount || 0);
                    }
                } catch (e) { /* ignore */ }
            }
        };
        fetchUnread();
        const unreadInterval = setInterval(fetchUnread, 30000);

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
            clearInterval(unreadInterval);
        }
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setIsUserMenuOpen(false);
        window.location.href = '/';
    };

    const getRoleInfo = (role: string) => {
        switch (role) {
            case 'owner':
                return { label: 'مالك', color: 'bg-yellow-500 text-yellow-900', icon: Crown, link: '/admin' };
            case 'specialist':
                return { label: 'أخصائي', color: 'bg-primary text-primary-foreground', icon: Shield, link: '/specialist' };
            default:
                return { label: 'مستخدم', color: 'bg-muted text-muted-foreground', icon: User, link: '/dashboard' };
        }
    };

    const roleInfo = user?.role ? getRoleInfo(user.role) : null;

    // Dynamic nav items based on login state
    const navItems = user ? [
        // Admin/Specialist links first (appear on right in RTL)
        ...(user.role === 'owner' ? [
            { name: "الإدارة", href: "/admin", icon: Crown },
        ] : []),
        ...(user.role === 'specialist' || user.role === 'owner' ? [
            { name: "الأخصائي", href: "/specialist", icon: Shield }
        ] : []),
        // Regular nav items
        { name: "جلساتي", href: "/dashboard", badge: 0, icon: Home },
        { name: "الرسائل", href: "/messages", badge: unreadCount, icon: MessageCircle },
        { name: "الكورسات", href: "/courses", icon: BookOpen },
    ] : [
        { name: "الرئيسية", href: "/home", icon: Home },
        { name: "الكورسات", href: "/courses", icon: BookOpen },
        { name: "من نحن", href: "/#about" },
        { name: "تواصل معنا", href: "/#contact" },
    ];

    return (
        <>
            <header
                dir="rtl"
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-5 md:px-6 py-4 md:py-4",
                    isScrolled ? "bg-background/90 backdrop-blur-xl border-b border-border/50 py-3 md:py-3 shadow-sm" : "bg-transparent",
                )}
            >
                <div className="container mx-auto flex items-center justify-between">
                    {/* User Profile - Right side in RTL (appears first in DOM) */}
                    <div className="flex items-center gap-2 md:gap-3 user-menu-container relative">
                        {user ? (
                            /* User Profile Button */
                            <>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center gap-1.5 md:gap-2 p-1.5 md:p-2 rounded-full bg-white/70 hover:bg-white transition-all border border-border/40 hover:border-primary/30 shadow-md hover:shadow-lg group backdrop-blur-sm"
                                >
                                    {/* Dropdown Arrow */}
                                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />

                                    {/* Avatar with Crown for Owner/Specialist */}
                                    <div className="relative">
                                        {/* Crown/Shield Badge for special roles */}
                                        {roleInfo && (user.role === 'owner' || user.role === 'specialist') && (
                                            <div className={`absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center z-10 shadow-md ${user.role === 'owner'
                                                ? 'bg-gradient-to-br from-yellow-400 to-amber-500'
                                                : 'bg-gradient-to-br from-primary to-indigo-600'
                                                }`}>
                                                <roleInfo.icon className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" />
                                            </div>
                                        )}
                                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center overflow-hidden border-2 border-primary/30 group-hover:border-primary transition-all duration-300 shrink-0 shadow-sm group-hover:scale-105">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-primary font-bold text-base md:text-lg">
                                                    {(user.nickname || "U").charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>

                                {/* Dropdown Menu */}
                                {isUserMenuOpen && (
                                    <div className="absolute top-full right-0 mt-2 md:mt-3 w-72 md:w-80 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-2 animate-in fade-in slide-in-from-top-2 z-50" dir="rtl">
                                        {/* User Info Header */}
                                        <div className="px-4 py-3 border-b border-border/50 mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20 shrink-0">
                                                    {user.avatar ? (
                                                        <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-primary font-bold text-lg">
                                                            {(user.nickname || "U").charAt(0).toUpperCase()}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-base text-foreground truncate">{user.nickname || "المستخدم"}</p>
                                                    <p className="text-xs text-muted-foreground truncate" dir="ltr">{user.email}</p>
                                                    {roleInfo && (
                                                        <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${roleInfo.color}`}>
                                                            <roleInfo.icon className="w-2.5 h-2.5" />
                                                            {roleInfo.label}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Navigation Links */}
                                        <div className="py-1 border-b border-border/50 mb-1">
                                            {navItems.map((item) => (
                                                <Link
                                                    key={item.name}
                                                    href={item.href}
                                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-primary/5 hover:text-primary rounded-xl transition-colors relative"
                                                    onClick={() => setIsUserMenuOpen(false)}
                                                >
                                                    {'icon' in item && item.icon && <item.icon className="w-4 h-4 text-muted-foreground" />}
                                                    <span>{item.name}</span>
                                                    {'badge' in item && item.badge > 0 && (
                                                        <span className="mr-auto min-w-[20px] h-5 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                            {item.badge > 9 ? '9+' : item.badge}
                                                        </span>
                                                    )}
                                                </Link>
                                            ))}
                                        </div>

                                        {/* Settings */}
                                        <Link
                                            href="/settings"
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-foreground hover:bg-primary/5 hover:text-primary rounded-xl transition-colors"
                                            onClick={() => setIsUserMenuOpen(false)}
                                        >
                                            <Settings className="w-4 h-4" />
                                            إعدادات الحساب
                                        </Link>

                                        <div className="h-px bg-border/50 my-1" />

                                        {/* Logout */}
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            تسجيل خروج
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            /* Guest - Login/Register buttons */
                            <div className="flex items-center gap-2 md:gap-3">
                                <Link href="/login" className="text-sm md:text-base font-bold text-foreground/70 hover:text-primary transition-colors px-2 md:px-3 py-2">
                                    دخول
                                </Link>
                                <Link href="/register" className="btn-primary py-2 md:py-2.5 px-4 md:px-6 text-xs md:text-sm shadow-md hover:shadow-lg">
                                    انضم إلينا
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Logo - Left side in RTL (appears last in DOM) */}
                    <Link href="/" className="group shrink-0">
                        <img
                            src="/logo.png"
                            alt="إيواء"
                            className="w-11 h-11 md:w-12 md:h-12 rounded-xl md:rounded-2xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-lg shadow-primary/30 group-hover:shadow-xl group-hover:shadow-primary/40"
                        />
                    </Link>

                    {/* Desktop Nav - Floating Capsule Style (hidden on mobile) */}
                    <nav className="hidden md:flex items-center gap-1 p-1.5 bg-background/60 backdrop-blur-xl border border-border/40 rounded-full shadow-lg shadow-black/5 absolute left-1/2 transform -translate-x-1/2">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="px-5 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300 relative group"
                            >
                                <span className="relative z-10">{item.name}</span>
                                {'badge' in item && item.badge > 0 && (
                                    <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse z-20">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}
                                <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
                            </Link>
                        ))}

                        {/* Admin/Specialist buttons inside nav bar */}
                        {user && roleInfo && (user.role === 'owner' || user.role === 'specialist') && (
                            <Link
                                href={roleInfo.link}
                                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${user.role === 'owner'
                                    ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-sm'
                                    : 'bg-gradient-to-r from-primary to-indigo-600 text-white shadow-sm'
                                    }`}
                            >
                                <span className="flex items-center gap-1.5">
                                    <roleInfo.icon className="w-3.5 h-3.5" />
                                    {user.role === 'owner' ? 'لوحة الإدارة' : 'مكتب الأخصائي'}
                                </span>
                            </Link>
                        )}
                    </nav>
                </div>
            </header>

            {/* Overlay for dropdown (clicks outside close it) */}
            {isUserMenuOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                />
            )}
        </>
    )
}
