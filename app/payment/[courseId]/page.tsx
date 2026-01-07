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
    const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
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
                    amount: course.price,
                    payment_screenshot: screenshotPreview // Send as base64
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
                            إتمام الدفع
                        </h1>
                        <p className="text-muted-foreground">
                            كورس: <span className="font-semibold text-primary">{course.title}</span>
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
                                            <p className="text-foreground leading-relaxed">حوّل مبلغ <span className="font-bold">{course.price} ج.م</span> للرقم/الحساب المذكور أعلاه</p>
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
                                            <path strokeLinecap="round" strokeLinejoin="width" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
            </main>

            <Footer />
        </div>
    );
}
