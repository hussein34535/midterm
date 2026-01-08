"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Calendar, Settings, LogOut, BookOpen, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
    { name: "لوحة القيادة", icon: LayoutDashboard, href: "/specialist" },
    { name: "الكورسات", icon: BookOpen, href: "/specialist/courses" },
    { name: "الجدول", icon: Calendar, href: "/specialist/schedule" },
    { name: "الطلاب", icon: Users, href: "/specialist/students" },
    { name: "الرسائل", icon: MessageCircle, href: "/messages" },
];

export default function SpecialistSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-white border-l border-border h-screen sticky top-0 hidden md:flex flex-col shadow-sm z-40">
            <div className="p-6 flex items-center gap-3 border-b border-border/50">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <LayoutDashboard className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="font-bold text-lg text-foreground">مكتب الأخصائي</h1>
                    <p className="text-xs text-muted-foreground">لوحة التحكم</p>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/specialist");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group",
                                isActive
                                    ? "bg-primary/10 text-primary font-bold shadow-sm"
                                    : "text-muted-foreground hover:bg-gray-50 hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-border/50">
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                    }}
                    className="flex items-center gap-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 rounded-xl text-sm font-bold transition-all"
                >
                    <LogOut className="w-5 h-5" />
                    تسجيل خروج
                </button>
            </div>
        </aside>
    );
}
