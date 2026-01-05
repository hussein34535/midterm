"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CalendarPlus, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function SpecialistSchedule() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        title: '',
        type: 'individual'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/specialist/sessions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'فشل في إنشاء الجلسة');
            }

            router.push('/specialist');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-warm-mesh min-h-screen flex flex-col" dir="rtl">
            <Header />

            <main className="flex-grow pb-20 pt-32">
                <div className="container mx-auto px-6 max-w-2xl">

                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/specialist" className="p-2 hover:bg-primary/10 rounded-full transition-colors">
                            <ArrowRight className="w-6 h-6 text-foreground" />
                        </Link>
                        <h1 className="text-2xl font-bold text-foreground">إنشاء جلسة جديدة</h1>
                    </div>

                    {error && (
                        <div className="card-love p-4 mb-8 bg-destructive/10 border-destructive/20 text-destructive text-center">
                            {error}
                        </div>
                    )}

                    <div className="card-love p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-foreground">عنوان الجلسة</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-border bg-background text-foreground"
                                    placeholder="مثال: جلسة متابعة أسبوعية"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-foreground">نوع الجلسة</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    className="w-full p-3 rounded-lg border border-border bg-background text-foreground"
                                >
                                    <option value="individual">جلسة فردية (صوتية)</option>
                                    <option value="group">جلسة جماعية</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-4 text-lg"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <CalendarPlus className="w-5 h-5" />
                                        إنشاء الجلسة
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
