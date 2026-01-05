"use client";

import Link from "next/link";
import { useState, use, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
    Copy,
    Check,
    CreditCard,
    ArrowLeft,
    Smartphone,
    Building2,
    Wallet,
    Loader2
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Course {
    id: string;
    title: string;
    price: number;
}

interface PageProps {
    params: Promise<{ courseId: string }>;
}

export default function PaymentPage({ params }: PageProps) {
    const router = useRouter();
    const { courseId } = use(params);

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [confirmed, setConfirmed] = useState(false);
    // These MUST be before any early returns
    const [paymentCode] = useState(() =>
        `EWA-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    );
    const [submitting, setSubmitting] = useState(false);

    // Auth Gate + Fetch Course
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.replace(`/login?redirect=/payment/${courseId}`);
            return;
        }

        // Fetch course from API
        fetchCourse();
    }, [router, courseId]);

    const fetchCourse = async () => {
        try {
            const res = await fetch(`${API_URL}/api/courses/${courseId}`);
            if (res.ok) {
                const data = await res.json();
                setCourse(data.course);
            } else {
                router.push('/courses');
            }
        } catch (err) {
            console.error('Failed to fetch course:', err);
            router.push('/courses');
        } finally {
            setLoading(false);
        }
    };

    // Show loading
    if (loading || !course) {
        return (
            <div className="min-h-screen bg-warm-mesh flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    const copyCode = () => {
        navigator.clipboard.writeText(paymentCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleConfirmPayment = async () => {
        if (!selectedMethod) return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/courses/${courseId}/payment`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    payment_method: selectedMethod,
                    payment_code: paymentCode,
                    amount: course.price
                })
            });

            if (res.ok) {
                setConfirmed(true);
            } else {
                const data = await res.json();
                alert(data.error || 'حدث خطأ');
            }
        } catch (err) {
            alert('حدث خطأ في الاتصال');
        } finally {
            setSubmitting(false);
        }
    };

    const paymentMethods = [
        { id: "vodafone", name: "فودافون كاش", icon: Smartphone, number: "01012345678" },
        { id: "fawry", name: "فوري", icon: Building2, code: "7823456" },
        { id: "instapay", name: "InstaPay", icon: Wallet, username: "@sakina_pay" },
    ];

    return (
        <div className="bg-warm-mesh min-h-screen" dir="rtl">
            <Header />

            <main className="pt-32 pb-20 px-4">
                <div className="container mx-auto max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* Breadcrumb */}
                    <div className="mb-8">
                        <Link
                            href={`/courses/${courseId}`}
                            className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                            العودة لتفاصيل الكورس
                        </Link>
                    </div>

                    {/* Page Header */}
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
                            <CreditCard className="w-10 h-10 text-primary" />
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                            إتمام الدفع
                        </h1>
                        <p className="text-muted-foreground">
                            كورس: <span className="font-semibold text-primary">{course.title}</span>
                        </p>
                    </div>

                    {/* Payment Code */}
                    <div className="card-love p-8 mb-8">
                        <h2 className="text-lg font-bold text-foreground mb-4 text-center">
                            كود الدفع الخاص بك
                        </h2>
                        <div className="bg-secondary/50 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 border border-border">
                            <span className="text-2xl font-mono font-bold text-primary tracking-wider">
                                {paymentCode}
                            </span>
                            <button
                                onClick={copyCode}
                                className="flex items-center gap-2 btn-outline py-2 px-6 w-full md:w-auto justify-center"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? "تم النسخ" : "نسخ الكود"}
                            </button>
                        </div>
                        <p className="text-sm text-muted-foreground text-center mt-4">
                            احفظ هذا الكود واستخدمه في وصف التحويل
                        </p>
                    </div>

                    {/* Amount */}
                    <div className="card-love p-6 mb-8 flex items-center justify-between">
                        <span className="text-muted-foreground font-medium">المبلغ المطلوب</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-foreground">{course.price}</span>
                            <span className="text-sm font-medium text-muted-foreground">ج.م</span>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="card-love p-8 mb-8">
                        <h2 className="text-lg font-bold text-foreground mb-6">
                            اختر طريقة الدفع
                        </h2>
                        <div className="space-y-4">
                            {paymentMethods.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method.id)}
                                    className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 group ${selectedMethod === method.id
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "border-border bg-background hover:border-primary/50 hover:bg-secondary/50"
                                        }`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${selectedMethod === method.id ? "bg-primary text-white" : "bg-secondary text-muted-foreground group-hover:text-primary"
                                        }`}>
                                        <method.icon className="w-6 h-6" />
                                    </div>
                                    <div className="text-right flex-1">
                                        <p className={`font-bold transition-colors ${selectedMethod === method.id ? "text-primary" : "text-foreground"}`}>{method.name}</p>
                                        <p className="text-sm text-muted-foreground font-mono mt-0.5">
                                            {method.number || method.code || method.username}
                                        </p>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedMethod === method.id
                                        ? "border-primary bg-primary text-white"
                                        : "border-muted-foreground/30"
                                        }`}>
                                        {selectedMethod === method.id && <Check className="w-3 h-3" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Instructions */}
                    {selectedMethod && (
                        <div className="card-love p-8 mb-8 animate-in fade-in slide-in-from-bottom-2">
                            <h2 className="text-lg font-bold text-foreground mb-4">
                                خطوات الدفع
                            </h2>
                            <ol className="space-y-4">
                                <li className="flex items-start gap-4">
                                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 mt-0.5 border border-primary/20">1</span>
                                    <span className="text-foreground leading-relaxed pt-1">افتح تطبيق <span className="font-bold text-primary">{paymentMethods.find(m => m.id === selectedMethod)?.name}</span></span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 mt-0.5 border border-primary/20">2</span>
                                    <span className="text-foreground leading-relaxed pt-1">حوّل مبلغ <span className="font-bold">{course.price} ج.م</span> للرقم/الحساب المذكور أعلاه</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 mt-0.5 border border-primary/20">3</span>
                                    <span className="text-foreground leading-relaxed pt-1">اكتب كود الدفع <span className="bg-secondary px-2 py-0.5 rounded font-mono font-bold text-primary mx-1">{paymentCode}</span> في الوصف أو الملاحظات</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 mt-0.5 border border-primary/20">4</span>
                                    <span className="text-foreground leading-relaxed pt-1">اضغط "أكدت الدفع" بالأسفل بعد إتمام التحويل</span>
                                </li>
                            </ol>
                        </div>
                    )}

                    {/* Confirm Button */}
                    <button
                        onClick={handleConfirmPayment}
                        disabled={!selectedMethod || submitting}
                        className={`btn-primary w-full text-lg py-4 justify-center shadow-lg shadow-primary/25 mb-8 ${!selectedMethod || submitting ? "opacity-50 cursor-not-allowed shadow-none" : ""
                            }`}
                    >
                        {submitting ? <><Loader2 className="w-5 h-5 animate-spin ml-2" /> جاري التسجيل...</> : "✅ أكدت الدفع"}
                    </button>

                    {/* Confirmation Message */}
                    {confirmed && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="card-love p-8 text-center max-w-md w-full shadow-2xl scale-100 animate-in zoom-in-95 duration-300 border-green-500/20">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                                    <Check className="w-10 h-10 text-green-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-3 font-serif">
                                    شكراً لك!
                                </h3>
                                <p className="text-muted-foreground mb-8 leading-relaxed">
                                    تم استلام طلبك بنجاح. سيتم تفعيل اشتراكك خلال ساعات قليلة بعد التحقق من عملية الدفع.
                                    <br />
                                    ستصلك رسالة تأكيد على بريدك الإلكتروني.
                                </p>
                                <Link href="/dashboard" className="btn-primary w-full justify-center">
                                    الذهاب للوحة التحكم
                                    <ArrowLeft className="w-5 h-5 mr-2" />
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
