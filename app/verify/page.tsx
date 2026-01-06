'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('جاري التحقق من حسابك...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('رابط التفعيل غير صالح أو مفقود.');
            return;
        }

        const verifyEmail = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token }),
                });

                const data = await res.json();

                if (res.ok) {
                    setStatus('success');
                    setMessage(data.message || 'تم تفعيل الحساب بنجاح! جاري الدخول...');

                    // Auto-Login Logic
                    if (data.token && data.user) {
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        window.dispatchEvent(new Event('user-login'));

                        setTimeout(() => {
                            // Redirect based on role
                            if (data.user.role === 'owner') router.replace('/admin');
                            else if (data.user.role === 'specialist') router.replace('/specialist');
                            else router.replace('/dashboard');
                        }, 1500);
                    } else {
                        // Fallback to login if no token returned
                        setTimeout(() => {
                            router.push('/login');
                        }, 2000);
                    }
                } else {
                    setStatus('error');
                    setMessage(data.error || 'حدث خطأ أثناء التفعيل.');
                }
            } catch (error) {
                setStatus('error');
                setMessage('حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.');
            }
        };

        verifyEmail();
    }, [token]);

    return (
        <div className="min-h-screen bg-[#FDF8F6] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center border border-[#E85C3F]/10">
                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-16 h-16 text-[#E85C3F] animate-spin" />
                        <h2 className="text-2xl font-bold text-[#1F2937]">جاري التفعيل...</h2>
                        <p className="text-gray-500">{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4">
                        <CheckCircle className="w-16 h-16 text-green-500" />
                        <h2 className="text-2xl font-bold text-[#1F2937]">تم التفعيل!</h2>
                        <p className="text-gray-600">{message}</p>
                        <Button
                            onClick={() => router.push('/login')}
                            className="bg-[#E85C3F] hover:bg-[#D44B30] text-white w-full mt-4"
                        >
                            تسجيل الدخول الآن
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-4">
                        <XCircle className="w-16 h-16 text-red-500" />
                        <h2 className="text-2xl font-bold text-[#1F2937]">خطأ في التفعيل</h2>
                        <p className="text-red-500 bg-red-50 p-3 rounded-lg w-full text-sm">
                            {message}
                        </p>
                        <Button
                            onClick={() => router.push('/register')}
                            variant="outline"
                            className="w-full mt-4"
                        >
                            العودة للتسجيل
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FDF8F6]" />}>
            <VerifyContent />
        </Suspense>
    );
}
