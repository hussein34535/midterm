"use client";

import Link from "next/link";
import { useState, use, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
    Loader2,
    Ticket,
    Sparkles
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Course {
    id: string;
    title: string;
    price: number;
    session_price?: number;
    total_sessions?: number;
}

interface PageProps {
    params: Promise<{ courseId: string }>;
}

export default function PaymentPage({ params }: PageProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { courseId } = use(params);

    // Get payment type and session number from URL
    const urlType = searchParams.get('type');
    const urlSessionNumber = searchParams.get('session');

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
    const [paymentType, setPaymentType] = useState<'full' | 'session'>(urlType === 'session' ? 'session' : 'full');
    const [sessionNumber, setSessionNumber] = useState<number>(urlSessionNumber ? parseInt(urlSessionNumber) : 1);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; value: number; type: 'percentage' | 'fixed' } | null>(null);
    const [checkingCoupon, setCheckingCoupon] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [enabledMethods, setEnabledMethods] = useState<string[]>([]);
    // Payment details from settings (per-method)
    const [vodafoneNumber, setVodafoneNumber] = useState('01012345678');
    const [vodafoneNotes, setVodafoneNotes] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [bankName, setBankName] = useState('');
    const [bankNotes, setBankNotes] = useState('');
    const [instapayUsername, setInstapayUsername] = useState('@eiwa_pay');
    const [instapayNotes, setInstapayNotes] = useState('');
    const [fawryCode, setFawryCode] = useState('7823456');
    const [fawryNotes, setFawryNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
    const [senderNumber, setSenderNumber] = useState('');

    // Auth Gate + Fetch Course + Settings
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.replace(`/login?redirect=/payment/${courseId}`);
            return;
        }

        fetchCourse();
        fetchSettings();
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

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/api/settings`);
            if (res.ok) {
                const data = await res.json();
                const methods = data.settings?.payment_methods || ['bank_transfer', 'vodafone_cash'];
                setEnabledMethods(methods);
                // Update per-method payment details from settings
                if (data.settings?.vodafone_number) setVodafoneNumber(data.settings.vodafone_number);
                if (data.settings?.vodafone_notes) setVodafoneNotes(data.settings.vodafone_notes);
                if (data.settings?.bank_account) setBankAccount(data.settings.bank_account);
                if (data.settings?.bank_name) setBankName(data.settings.bank_name);
                if (data.settings?.bank_notes) setBankNotes(data.settings.bank_notes);
                if (data.settings?.instapay_username) setInstapayUsername(data.settings.instapay_username);
                if (data.settings?.instapay_notes) setInstapayNotes(data.settings.instapay_notes);
                if (data.settings?.fawry_code) setFawryCode(data.settings.fawry_code);
                if (data.settings?.fawry_notes) setFawryNotes(data.settings.fawry_notes);
            }
        } catch (err) {
            console.error('Failed to fetch settings');
            setEnabledMethods(['vodafone_cash', 'fawry', 'instapay']);
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



    const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('يرجى اختيار صورة فقط');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('حجم الصورة كبير جداً (أقصى حد 5 ميجا)');
            return;
        }

        setScreenshot(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setScreenshotPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCheckingCoupon(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/coupons/validate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code: couponCode })
            });
            const data = await res.json();
            if (res.ok && data.valid) {
                setAppliedCoupon({
                    code: data.coupon.code,
                    value: data.coupon.value,
                    type: data.coupon.discount_type
                });
                alert('تم تطبيق الكوبون بنجاح!');
            } else {
                alert(data.error || 'الكوبون غير صالح');
                setAppliedCoupon(null);
            }
        } catch (error) {
            alert('حدث خطأ أثناء التحقق');
        } finally {
            setCheckingCoupon(false);
        }
    };

    const getFinalPrice = () => {
        let price = paymentType === 'full' ? course.price : (course.session_price || 0);
        if (appliedCoupon) {
            if (appliedCoupon.type === 'percentage') {
                price = price - (price * appliedCoupon.value / 100);
            } else {
                price = Math.max(0, price - appliedCoupon.value);
            }
        }
        return price;
    };

    const handleConfirmPayment = async () => {
        if (!selectedMethod) return;

        // Validation for Vodafone Cash
        if (selectedMethod === 'vodafone_cash' && !senderNumber.trim()) {
            alert('يرجى كتابة رقم المحفظة التي تم التحويل منها');
            return;
        }

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
                    amount: getFinalPrice(), // Send discounted price
                    payment_type: paymentType === 'session' ? 'session' : 'course',
                    session_number: paymentType === 'session' ? sessionNumber : null, // For session payments
                    coupon_code: appliedCoupon?.code, // Send coupon code
                    payment_screenshot: screenshotPreview, // Send as base64
                    sender_number: senderNumber // Send sender number
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

    const allPaymentMethods = [
        { id: "bank_transfer", name: "تحويل بنكي", icon: Building2, number: bankAccount, bankName: bankName, notes: bankNotes },
        { id: "vodafone_cash", name: "فودافون كاش", icon: Smartphone, number: vodafoneNumber, notes: vodafoneNotes },
        { id: "fawry", name: "فوري", icon: Building2, code: fawryCode, notes: fawryNotes },
        { id: "instapay", name: "InstaPay", icon: Wallet, username: instapayUsername, notes: instapayNotes },
    ];

    // Filter methods based on settings
    const paymentMethods = allPaymentMethods.filter(m => enabledMethods.includes(m.id));

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
                            {paymentType === 'session' ? `دفع الجلسة ${sessionNumber}` : 'إتمام الدفع'}
                        </h1>
                        <p className="text-muted-foreground">
                            كورس: <span className="font-semibold text-primary">{course.title}</span>
                            {paymentType === 'session' && course.total_sessions && (
                                <span className="text-xs mr-2">(الجلسة {sessionNumber} من {course.total_sessions})</span>
                            )}
                        </p>
                    </div>



                    {/* Amount */}
                    <div className="card-love p-6 mb-8">
                        {/* Payment Type Toggle */}
                        {course.session_price && course.session_price > 0 && (
                            <div className="flex bg-secondary/50 p-1 rounded-xl mb-6">
                                <button
                                    onClick={() => setPaymentType('full')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${paymentType === 'full'
                                        ? 'bg-background shadow-sm text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    سعر الكورس كامل
                                </button>
                                <button
                                    onClick={() => setPaymentType('session')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${paymentType === 'session'
                                        ? 'bg-background shadow-sm text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    سعر الجلسة
                                </button>
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground font-medium">المبلغ المطلوب</span>
                            <div className="flex flex-col items-end">
                                <div className="flex items-baseline gap-2">
                                    <span className={`text-3xl font-black text-foreground ${appliedCoupon ? 'text-green-600' : ''}`}>
                                        {getFinalPrice()}
                                    </span>
                                    <span className="text-sm font-medium text-muted-foreground">ج.م</span>
                                </div>
                                {appliedCoupon && (
                                    <span className="text-sm text-muted-foreground line-through decoration-red-500">
                                        {paymentType === 'full' ? course.price : (course.session_price || 0)} ج.م
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Coupon Input */}
                        <div className="mt-6 pt-6 border-t border-border/50">
                            {!appliedCoupon ? (
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Ticket className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                            placeholder="عندك كوبون خصم؟"
                                            className="w-full pr-10 pl-4 py-2 rounded-lg bg-background border border-border focus:border-primary outline-none font-mono uppercase text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={handleApplyCoupon}
                                        disabled={checkingCoupon || !couponCode}
                                        className="btn-secondary px-4 h-[42px]"
                                    >
                                        {checkingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تطبيق'}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-700 font-medium">
                                        <Ticket className="w-4 h-4" />
                                        <span>كوبون {appliedCoupon.code}</span>
                                        <span className="text-xs bg-green-200 px-2 py-0.5 rounded-full">
                                            {appliedCoupon.type === 'percentage' ? `-${appliedCoupon.value}%` : `-${appliedCoupon.value} ج.م`}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                                        className="text-red-500 hover:text-red-700 text-sm font-bold px-2"
                                    >
                                        إزالة
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Savings Badge */}
                        {paymentType === 'full' && course.session_price && course.session_price > 0 && course.total_sessions && (
                            (() => {
                                const savings = (course.session_price * course.total_sessions) - course.price;
                                if (savings > 0) {
                                    return (
                                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-green-600 fill-green-600" />
                                                <span className="text-sm font-bold text-green-700">لقد وفرت {savings} ج.م بهذا الاختيار!</span>
                                            </div>
                                            <span className="text-xs font-bold text-white bg-green-600 px-2 py-1 rounded-full">
                                                وفر {Math.round((savings / (course.session_price * course.total_sessions)) * 100)}%
                                            </span>
                                        </div>
                                    );
                                }
                                return null;
                            })()
                        )}
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
                                ملاحظات الدفع
                            </h2>
                            <div className="space-y-4">
                                {paymentMethods.find(m => m.id === selectedMethod)?.notes ? (
                                    // Dynamic notes from settings
                                    paymentMethods.find(m => m.id === selectedMethod)?.notes
                                        .split('\n')
                                        .filter(line => line.trim() !== '')
                                        .map((note, index) => (
                                            <div key={index} className="flex items-start gap-4 animate-in fade-in slide-in-from-right-2" style={{ animationDelay: `${index * 50}ms` }}>
                                                <div className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0" />
                                                <p className="text-foreground leading-relaxed font-medium">
                                                    {note}
                                                </p>
                                            </div>
                                        ))
                                ) : (
                                    // Default notes fallback
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0" />
                                            <p className="text-foreground leading-relaxed">افتح تطبيق <span className="font-bold text-primary">{paymentMethods.find(m => m.id === selectedMethod)?.name}</span></p>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0" />
                                            <p className="text-foreground leading-relaxed">حوّل مبلغ <span className="font-bold">{getFinalPrice()} ج.م</span> للرقم/الحساب المذكور أعلاه</p>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-2 h-2 rounded-full bg-primary mt-2.5 shrink-0" />
                                            <p className="text-foreground leading-relaxed">اضغط "أكدت الدفع" بالأسفل بعد إتمام التحويل</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Sender Number Input (Vodafone Cash Only) */}
                    {selectedMethod === 'vodafone_cash' && (
                        <div className="card-love p-8 mb-8 animate-in fade-in slide-in-from-bottom-2">
                            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <Smartphone className="w-5 h-5 text-primary" />
                                رقم المحفظة المحول منها
                            </h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                يرجى كتابة الرقم الذي قمت بالتحويل منه لتسهيل مراجعة العملية.
                            </p>
                            <input
                                type="tel"
                                value={senderNumber}
                                onChange={(e) => setSenderNumber(e.target.value)}
                                placeholder="01xxxxxxxxx"
                                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none font-mono text-left"
                            />
                        </div>
                    )}

                    {/* Screenshot Upload */}
                    {selectedMethod && (
                        <div className="card-love p-8 mb-8 animate-in fade-in slide-in-from-bottom-2">
                            <h2 className="text-lg font-bold text-foreground mb-4">
                                📸 إثبات الدفع (اختياري)
                            </h2>
                            <p className="text-sm text-muted-foreground mb-4">
                                ارفع لقطة شاشة (سكرين شوت) لإيصال الدفع لتسريع عملية التفعيل
                            </p>

                            <input
                                type="file"
                                id="screenshot"
                                accept="image/*"
                                onChange={handleScreenshotChange}
                                className="hidden"
                            />

                            {screenshotPreview ? (
                                <div className="space-y-4">
                                    <div className="relative w-full max-w-md mx-auto rounded-xl overflow-hidden border-2 border-primary/20">
                                        <img src={screenshotPreview} alt="Screenshot" className="w-full h-auto" />
                                        <button
                                            onClick={() => {
                                                setScreenshot(null);
                                                setScreenshotPreview(null);
                                            }}
                                            className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <label htmlFor="screenshot" className="btn-outline w-full py-3 justify-center cursor-pointer">
                                        تغيير الصورة
                                    </label>
                                </div>
                            ) : (
                                <label htmlFor="screenshot" className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <p className="font-medium text-foreground mb-1">اضغط لاختيار الصورة</p>
                                    <p className="text-xs text-muted-foreground">PNG, JPG حتى 5MB</p>
                                </label>
                            )}
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
            </main >

            <Footer />
        </div >
    );
}
