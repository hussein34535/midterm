"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SpecialistGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const userStr = localStorage.getItem('user');

            if (!token || !userStr) {
                router.push('/login');
                return;
            }

            try {
                const user = JSON.parse(userStr);
                if (user.role !== 'specialist' && user.role !== 'owner') {
                    router.push('/dashboard'); // Redirect unauthorized users
                    return;
                }
                setAuthorized(true);
            } catch (e) {
                router.push('/login');
            }
        };

        checkAuth();
    }, [router]);

    if (!authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return <>{children}</>;
}
