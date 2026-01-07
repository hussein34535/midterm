'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MessageCircle, BookOpen, Crown, Shield, Settings } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    isSpecial?: boolean;
    colorClass?: string;
    activeColorClass?: string;
}

export default function MobileBottomNav() {
    const pathname = usePathname();
    const [user, setUser] = useState<any>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [chatOpen, setChatOpen] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) { }
        }

        // Fetch unread count
        const fetchUnread = async () => {
            const token = localStorage.getItem('token');
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

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
        const unreadInterval = setInterval(fetchUnread, 1500);

        const handleUnreadUpdate = (e: CustomEvent) => {
            setUnreadCount(e.detail?.count || 0);
        };

        // Listen for chat open/close events
        const handleChatOpen = () => setChatOpen(true);
        const handleChatClose = () => setChatOpen(false);

        window.addEventListener('unreadCountUpdated', handleUnreadUpdate as EventListener);
        window.addEventListener('chatOpened', handleChatOpen);
        window.addEventListener('chatClosed', handleChatClose);

        return () => {
            clearInterval(unreadInterval);
            window.removeEventListener('unreadCountUpdated', handleUnreadUpdate as EventListener);
            window.removeEventListener('chatOpened', handleChatOpen);
            window.removeEventListener('chatClosed', handleChatClose);
        };
    }, []);

    // Don't show if not logged in or on certain pages or if chat is open
    if (!user) return null;
    if (pathname === '/login' || pathname === '/register' || pathname === '/' || pathname === '/home') return null;
    if (pathname.startsWith('/session')) return null; // Hide on voice room pages
    if (chatOpen && pathname === '/messages') return null;

    // Build nav items based on requirements
    // Order: Admin (if owner) -> Specialist (if owner/specialist) -> My Sessions -> Messages -> Courses
    let navItems: NavItem[] = [];

    // 1. Admin (Rightmost - first in visual RTL)
    if (user.role === 'owner') {
        navItems.push({
            name: "الإدارة",
            href: "/admin",
            icon: Crown,
            isSpecial: true,
            colorClass: "text-amber-600 bg-amber-50 border-amber-100",
            activeColorClass: "bg-amber-500 text-white shadow-lg shadow-amber-500/25 border-transparent"
        });
    }

    // 2. Specialist
    if (user.role === 'owner' || user.role === 'specialist') {
        navItems.push({
            name: "مكتبي",
            href: "/specialist",
            icon: Shield,
            isSpecial: true,
            colorClass: "text-indigo-600 bg-indigo-50 border-indigo-100",
            activeColorClass: "bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border-transparent"
        });
    }

    // 3. Standard Items
    navItems.push(
        { name: "جلساتي", href: "/dashboard", icon: Home },
        { name: "الرسائل", href: "/messages", icon: MessageCircle, badge: unreadCount },
        { name: "الكورسات", href: "/courses", icon: BookOpen }
    );

    return (
        <>
            {/* Spacer to prevent content from being hidden behind nav */}
            <div className="md:hidden h-24" />

            {/* Bottom Navigation - iOS Style */}
            <div className="md:hidden fixed bottom-4 left-4 right-4 z-[9999]">
                <nav className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl shadow-black/10 border border-white/50 px-2 py-2">
                    <div className="flex items-center justify-between gap-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (pathname.startsWith(item.href + '/') && item.href !== '/');
                            const showBadge = (item.badge || 0) > 0;
                            const isSpecial = item.isSpecial;

                            // Determine classes based on state
                            let containerClass = "hover:bg-gray-50 text-gray-400"; // Default inactive

                            if (isSpecial) {
                                if (isActive) {
                                    containerClass = item.activeColorClass || "";
                                } else {
                                    containerClass = item.colorClass || "";
                                }
                            } else {
                                if (isActive) {
                                    containerClass = "bg-primary/10 text-primary";
                                }
                            }

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex-1 flex flex-col items-center justify-center py-2 relative rounded-xl transition-all duration-300 ${isSpecial ? 'mx-1' : ''} ${containerClass}`}
                                >
                                    {/* Icon */}
                                    <div className="relative">
                                        <item.icon className="w-6 h-6 transition-colors currentColor" />
                                    </div>

                                    {/* Label */}
                                    <span className="text-[9px] mt-1 font-bold currentColor">
                                        {item.name}
                                    </span>

                                    {/* Badge - Positioned ABOVE the bar container */}
                                    {showBadge && (
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white animate-bounce z-20">
                                            {item.badge! > 99 ? '99+' : item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </>
    );
}
