"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowRight,
    Settings,
    Save,
    Loader2,
    Globe,
    Mail,
    MessageSquare,
    ToggleLeft,
    CreditCard
} from "lucide-react";
import Header from "@/components/layout/Header";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface SettingsState {
    platform_name: string;
    platform_description: string;
    welcome_message: string;
    support_email: string;
    maintenance_mode: boolean;
    allow_registration: boolean;
    payment_methods: string[];
}

export default function SettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<SettingsState>({
        platform_name: 'إيواء',
        platform_description: 'منصة الدعم والإرشاد النفسي',
        welcome_message: 'مرحباً بك في إيواء! نحن هنا لدعمك.',
        support_email: 'support@eiwa.com',
        maintenance_mode: false,
        allow_registration: true,
        payment_methods: ['bank_transfer', 'vodafone_cash']
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userRole, setUserRole] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            router.push('/login');
            return;
        }
        const user = JSON.parse(storedUser);
        setUserRole(user.role);
        if (user.role !== 'owner') {
            toast.error('هذه الصفحة للمالك فقط');
            router.push('/admin');
            return;
        }
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.settings) {
                    setSettings({
                        platform_name: data.settings.platform_name || 'إيواء',
                        platform_description: data.settings.platform_description || '',
                        welcome_message: data.settings.welcome_message || '',
                        support_email: data.settings.support_email || '',
                        maintenance_mode: data.settings.maintenance_mode === true,
                        allow_registration: data.settings.allow_registration !== false,
                        payment_methods: data.settings.payment_methods || ['bank_transfer']
                    });
                }
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/settings`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ settings })
            });

            if (res.ok) {
                toast.success('تم حفظ الإعدادات بنجاح');
            } else {
                const data = await res.json();
                toast.error(data.error || 'حدث خطأ');
            }
        } catch (error) {
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setSaving(false);
        }
    };

    const togglePaymentMethod = (method: string) => {
        if (settings.payment_methods.includes(method)) {
            setSettings({
                ...settings,
                payment_methods: settings.payment_methods.filter(m => m !== method)
            });
        } else {
            setSettings({
                ...settings,
                payment_methods: [...settings.payment_methods, method]
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="container mx-auto px-4 py-6 pt-24 max-w-2xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-200 rounded-full">
                        <ArrowRight className="w-5 h-5" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">إعدادات المنصة</h1>
                        <p className="text-gray-500">تخصيص إعدادات المنصة (المالك فقط)</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        حفظ
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Contact */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <Mail className="w-5 h-5 text-primary" />
                            التواصل
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">وصف المنصة</label>
                                <textarea
                                    value={settings.platform_description}
                                    onChange={(e) => setSettings({ ...settings, platform_description: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none h-20"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني للدعم</label>
                                <input
                                    type="email"
                                    value={settings.support_email}
                                    onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">رسالة الترحيب</label>
                                <textarea
                                    value={settings.welcome_message}
                                    onChange={(e) => setSettings({ ...settings, welcome_message: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none h-20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <ToggleLeft className="w-5 h-5 text-primary" />
                            التحكم
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">وضع الصيانة</p>
                                    <p className="text-sm text-gray-500">إيقاف الموقع مؤقتاً للصيانة</p>
                                </div>
                                <button
                                    onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.maintenance_mode ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">السماح بالتسجيل</p>
                                    <p className="text-sm text-gray-500">السماح للمستخدمين الجدد بالتسجيل</p>
                                </div>
                                <button
                                    onClick={() => setSettings({ ...settings, allow_registration: !settings.allow_registration })}
                                    className={`w-12 h-6 rounded-full relative transition-colors ${settings.allow_registration ? 'bg-green-500' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.allow_registration ? 'right-1' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="bg-white rounded-xl p-6 shadow-sm">
                        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-primary" />
                            طرق الدفع
                        </h2>
                        <div className="space-y-3">
                            {[
                                { id: 'bank_transfer', name: 'تحويل بنكي' },
                                { id: 'vodafone_cash', name: 'فودافون كاش' },
                                { id: 'instapay', name: 'انستاباي' },
                                { id: 'fawry', name: 'فوري' }
                            ].map(method => (
                                <label key={method.id} className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.payment_methods.includes(method.id)}
                                        onChange={() => togglePaymentMethod(method.id)}
                                        className="w-5 h-5 rounded text-primary focus:ring-primary"
                                    />
                                    <span>{method.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
