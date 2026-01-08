"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Ticket, Plus, Trash2, Loader2, Save, X, Calendar, Percent, Coins } from "lucide-react";
import Header from "@/components/layout/Header";
import { toast } from "sonner";
import { format } from "date-fns";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed';
    value: number;
    usage_limit: number | null;
    times_used: number;
    expires_at: string | null;
    is_active: boolean;
}

export default function AdminCouponsPage() {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percentage', // percentage | fixed
        value: '',
        usage_limit: '',
        expires_at: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/coupons`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCoupons(data.coupons || []);
            }
        } catch (error) {
            console.error(error);
            toast.error('فشل في جلب الكوبونات');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا الكوبون نهائياً؟')) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/coupons/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('تم حذف الكوبون');
                fetchCoupons();
            } else {
                toast.error('حدث خطأ');
            }
        } catch (error) {
            toast.error('حدث خطأ');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.code || !formData.value) return;

        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/coupons`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    code: formData.code.toUpperCase()
                })
            });

            if (res.ok) {
                toast.success('تم إنشاء الكوبون');
                setShowForm(false);
                setFormData({
                    code: '',
                    discount_type: 'percentage',
                    value: '',
                    usage_limit: '',
                    expires_at: ''
                });
                fetchCoupons();
            } else {
                const data = await res.json();
                toast.error(data.error || 'فشل إنشاء الكوبون');
            }
        } catch (error) {
            toast.error('حدث خطأ');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-warm-mesh min-h-screen flex flex-col" dir="rtl">
            <Header />

            <main className="flex-grow pb-20 pt-32">
                <div className="container mx-auto px-6 max-w-5xl">

                    {/* Breadcrumb */}
                    <div className="mb-8">
                        <Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 font-medium">
                            <ArrowRight className="w-4 h-4" />
                            العودة للوحة الإدارة
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-foreground mb-2 flex items-center gap-3">
                                <Ticket className="w-8 h-8 text-primary" />
                                كبونات الخصم
                            </h1>
                            <p className="text-muted-foreground">إنشاء وإدارة أكواد الخصم</p>
                        </div>
                        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            كوبون جديد
                        </button>
                    </div>

                    {/* Form Modal */}
                    {showForm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
                            <div className="card-love p-8 max-w-lg w-full scale-100 animate-in zoom-in-95 duration-200">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-foreground">إنشاء كوبون جديد</h2>
                                    <button onClick={() => setShowForm(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-foreground mb-2">كود الكوبون</label>
                                        <input
                                            type="text"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none font-mono uppercase"
                                            placeholder="IWAA10"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-foreground mb-2">نوع الخصم</label>
                                            <div className="flex bg-secondary/50 p-1 rounded-xl">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, discount_type: 'percentage' })}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.discount_type === 'percentage'
                                                        ? 'bg-background shadow-sm text-primary'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                        }`}
                                                >
                                                    <Percent className="w-4 h-4" />
                                                    نسبة %
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, discount_type: 'fixed' })}
                                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${formData.discount_type === 'fixed'
                                                        ? 'bg-background shadow-sm text-primary'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                        }`}
                                                >
                                                    <Coins className="w-4 h-4" />
                                                    مبلغ ثابت
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-foreground mb-2">قيمة الخصم</label>
                                            <input
                                                type="number"
                                                value={formData.value}
                                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
                                                placeholder={formData.discount_type === 'percentage' ? "10" : "50"}
                                                min="1"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-foreground mb-2">حد الاستخدام (اختياري)</label>
                                            <input
                                                type="number"
                                                value={formData.usage_limit}
                                                onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
                                                placeholder="لا محدود"
                                                min="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-foreground mb-2">تاريخ الانتهاء (اختياري)</label>
                                            <input
                                                type="date"
                                                value={formData.expires_at}
                                                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border focus:border-primary outline-none"
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="btn-primary w-full justify-center mt-6 py-4 text-lg"
                                    >
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5 ml-2" />}
                                        حفظ الكوبون
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Coupons List */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : coupons.length === 0 ? (
                        <div className="card-love p-12 text-center">
                            <Ticket className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-foreground mb-2">لا توجد كوبونات</h3>
                            <p className="text-muted-foreground mb-6">أنشئ أول كوبون خصم لعملائك</p>
                            <button onClick={() => setShowForm(true)} className="btn-primary">
                                <Plus className="w-5 h-5" />
                                إنشاء كوبون
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {coupons.map((coupon) => (
                                <div key={coupon.id} className={`card-love p-6 relative group ${!coupon.is_active ? 'opacity-60 grayscale' : ''}`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
                                            <span className="font-mono font-bold text-lg text-primary tracking-wider">
                                                {coupon.code}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {coupon.is_active && (
                                                <button
                                                    onClick={() => handleDelete(coupon.id)}
                                                    className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors"
                                                    title="تعطيل"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-baseline gap-1 mb-4">
                                        <span className="text-3xl font-black text-foreground">
                                            {coupon.value}
                                        </span>
                                        <span className="text-sm font-bold text-muted-foreground">
                                            {coupon.discount_type === 'percentage' ? '%' : 'ج.م'}
                                        </span>
                                        <span className="text-sm text-green-600 mr-2 font-medium">خصم</span>
                                    </div>

                                    <div className="space-y-2 text-sm text-muted-foreground border-t border-border/50 pt-4 mt-4">
                                        <div className="flex justify-between">
                                            <span>الاستخدامات:</span>
                                            <span className="font-mono text-foreground">
                                                {coupon.times_used} / {coupon.usage_limit || '∞'}
                                            </span>
                                        </div>
                                        {coupon.expires_at && (
                                            <div className="flex justify-between">
                                                <span>ينتهي في:</span>
                                                <span className="text-foreground">
                                                    {format(new Date(coupon.expires_at), 'yyyy/MM/dd')}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Decoration Circles */}
                                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-warm-mesh"></div>
                                    <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-warm-mesh"></div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
