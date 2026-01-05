"use client";

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function RootDispatcher() {
  const router = useRouter();

  useEffect(() => {
    // Check for user session
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      // User is logged in -> Redirect to Dashboard
      try {
        const user = JSON.parse(storedUser);
        if (user.role === 'owner') router.replace('/admin');
        else if (user.role === 'specialist') router.replace('/specialist');
        else router.replace('/dashboard');
      } catch (e) {
        // Invalid data -> Treat as guest -> Show Landing
        router.replace('/home');
      }
    } else {
      // User is Guest -> Show Landing Page
      router.replace('/home');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-warm-mesh flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  )
}
