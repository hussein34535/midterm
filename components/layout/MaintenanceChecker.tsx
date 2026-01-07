"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function MaintenanceChecker() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Skip check for Admin, Login, and Maintenance pages
        if (pathname.startsWith('/admin') ||
            pathname.startsWith('/login') ||
            pathname.startsWith('/register') ||
            pathname === '/maintenance') {
            return;
        }

        const checkMaintenance = async () => {
            try {
                // Check local user role first to avoid unnecessary requests for admins
                if (typeof window !== 'undefined') {
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        const user = JSON.parse(userStr);
                        if (user.role === 'admin' || user.role === 'owner') {
                            return; // Admins bypass
                        }
                    }
                }

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/settings`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.settings?.maintenance_mode) {
                        router.push('/maintenance');
                    }
                }
            } catch (error) {
                // Silently fail or warn for network errors (common with ad-blockers or connection drops)
                console.warn("Maintenance check skipped:", error instanceof Error ? error.message : "Network error");
            }
        };

        checkMaintenance();

        // Check periodically (every minute)
        const interval = setInterval(checkMaintenance, 60000);
        return () => clearInterval(interval);

    }, [pathname, router]);

    return null;
}
