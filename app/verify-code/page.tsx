'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

function VerifyCodeContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email');

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        // Focus first input on mount
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Move to next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto submit if filled
        if (newOtp.every(digit => digit !== '') && index === 5) {
            handleVerify(newOtp.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
        if (pastedData.every(digit => !isNaN(Number(digit)))) {
            const newOtp = [...otp];
            pastedData.forEach((digit, i) => {
                if (i < 6) newOtp[i] = digit;
            });
            setOtp(newOtp);
            if (pastedData.length === 6) {
                handleVerify(pastedData.join(''));
            }
        }
    };

    const handleVerify = async (code: string) => {
        if (!code || code.length !== 6) return;
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: code }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('تم التفعيل بنجاح! جاري الدخول...');

                // Auto-Login
                if (data.token && data.user) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    window.dispatchEvent(new Event('user-login'));

                    setTimeout(() => {
                        if (data.user.role === 'owner') router.replace('/admin');
                        else if (data.user.role === 'specialist') router.replace('/specialist');
                        else router.replace('/dashboard');
                    }, 1000);
                } else {
                    router.push('/login');
                }
            } else {
                toast.error(data.error || 'رمز غير صحيح');
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (error) {
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDF8F6] flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-[#E85C3F]/10">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-[#1F2937] mb-2">تفعيل الحساب</h2>
                    <p className="text-gray-500 text-sm">
                        أدخل الرمز المكون من 6 أرقام المرسل إلى <br />
                        <span className="font-bold text-[#E85C3F]">{email}</span>
                    </p>
                </div>

                <div className="flex gap-2 justify-center mb-8" dir="ltr">
                    {otp.map((digit, index) => (
                        <input
                            key={index}
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="text"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            onPaste={handlePaste}
                            className="w-12 h-14 border-2 border-gray-200 rounded-xl text-center text-2xl font-bold focus:border-[#E85C3F] focus:ring-4 focus:ring-[#E85C3F]/10 outline-none transition-all"
                            disabled={loading}
                        />
                    ))}
                </div>

                <button
                    onClick={() => handleVerify(otp.join(''))}
                    disabled={loading || otp.join('').length !== 6}
                    className="w-full bg-[#E85C3F] hover:bg-[#D44B30] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-[#E85C3F]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            جاري التحقق...
                        </>
                    ) : (
                        'تأكيد وتفعيل'
                    )}
                </button>

                <div className="mt-6 space-y-3">
                    <button
                        onClick={async () => {
                            if (!email) return;
                            try {
                                toast.loading('جاري إرسال رمز جديد...');
                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/resend-otp`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ email }),
                                });
                                const data = await res.json();
                                if (res.ok) {
                                    toast.dismiss();
                                    toast.success('تم إرسال رمز جديد إلى بريدك');
                                } else {
                                    toast.dismiss();
                                    toast.error(data.error);
                                }
                            } catch (e) {
                                toast.dismiss();
                                toast.error('فشل الإرسال');
                            }
                        }}
                        className="text-[#E85C3F] font-bold text-sm hover:underline block w-full"
                    >
                        لم يصلك الرمز؟ إعادة إرسال
                    </button>

                    <button
                        onClick={() => router.push('/register')}
                        className="text-gray-400 hover:text-gray-600 text-sm flex items-center justify-center gap-1 mx-auto transition-colors w-full"
                    >
                        <ArrowRight className="w-4 h-4 ml-1" />
                        العودة للتسجيل
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function VerifyCodePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#FDF8F6]" />}>
            <VerifyCodeContent />
        </Suspense>
    );
}
