"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export default function SessionChecker() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkSession = () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                // Decode JWT payload (middle part)
                const payload = JSON.parse(atob(token.split('.')[1]));

                // exp is in seconds, convert to ms
                if (payload.exp * 1000 < Date.now()) {
                    // Token expired
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');

                    // Only show toast and redirect if we are NOT already on login/register pages
                    if (!pathname.includes('/login') && !pathname.includes('/register')) {
                        toast.error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
                        setTimeout(() => router.push('/login'), 2000); // Delay for toast
                    }
                }
            } catch (e) {
                // Invalid token structure
                console.error("Invalid token check", e);
                localStorage.removeItem('token');
            }
        };

        checkSession();

        // Optional: Check periodically? No, user said "when I open the site".
        // Just on mount is sufficient for "opening the site".

    }, [pathname, router]);

    return null; // This component handles logic only
}
