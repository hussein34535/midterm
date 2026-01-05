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

    // Build nav items - max 4 items for clean look
    const navItems: NavItem[] = [
        { name: "الرئيسية", href: "/dashboard", icon: Home },
        { name: "الرسائل", href: "/messages", icon: MessageCircle },
        { name: "الكورسات", href: "/courses", icon: BookOpen },
    ];

    // Add role-specific item (only one)
    if (user.role === 'owner') {
        navItems.push({ name: "الإدارة", href: "/admin", icon: Crown });
    } else if (user.role === 'specialist') {
        navItems.push({ name: "مكتبي", href: "/specialist", icon: Shield });
    } else {
        navItems.push({ name: "الإعدادات", href: "/settings", icon: Settings });
    }

    return (
        <>
            {/* Spacer to prevent content from being hidden behind nav */}
            <div className="md:hidden h-24" />

            {/* Bottom Navigation - iOS Style */}
            <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
                <nav className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/10 border border-gray-200/50 px-2 py-1">
                    <div className="flex items-center justify-around">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            const showBadge = item.badge && item.badge > 0;

                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className="flex flex-col items-center justify-center py-2 px-4 relative"
                                >
                                    {/* Icon */}
                                    <div className="relative">
                                        <item.icon className={`w-6 h-6 transition-colors ${isActive ? 'text-primary' : 'text-gray-400'
                                            }`} />

                                        {/* Badge - only show if > 0 */}
                                        {showBadge && (
                                            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm border-2 border-white">
                                                {item.badge! > 99 ? '99+' : item.badge}
                                            </span>
                                        )}
                                    </div>

                                    {/* Label */}
                                    <span className={`text-[10px] mt-1 ${isActive
                                        ? 'text-primary font-bold'
                                        : 'text-gray-400'
                                        }`}>
                                        {item.name}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </>
    );
}
