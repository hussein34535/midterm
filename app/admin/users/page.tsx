"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Shield, ShieldOff, ShieldAlert, Trash2, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface User {
    id: string;
    nickname: string;
    email: string;
    avatar?: string;
    role: string;
    created_at: string;
}

export default function UsersManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'فشل في جلب البيانات');
            }

            const data = await res.json();
            setUsers(data.users);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setActionLoading(userId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ role: newRole })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'فشل في تحديث الرتبة');
            }

            // Update local state
            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

        setActionLoading(userId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'فشل في الحذف');
            }

            setUsers(users.filter(u => u.id !== userId));
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-warm-mesh min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="bg-warm-mesh min-h-screen flex flex-col" dir="rtl">
            <Header />

            <main className="flex-grow pb-20 pt-32">
                <div className="container mx-auto px-6 max-w-5xl">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="p-2 hover:bg-primary/10 rounded-full transition-colors">
                                <ArrowRight className="w-6 h-6 text-foreground" />
                            </Link>
                            <h1 className="text-2xl font-bold text-foreground">إدارة المستخدمين</h1>
                        </div>
                    </div>

                    {error && (
                        <div className="card-love p-4 mb-8 bg-destructive/10 border-destructive/20 text-destructive text-center">
                            {error}
                        </div>
                    )}

                    {/* Users Table */}
                    <div className="card-love overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-primary/5 border-b border-border">
                                <tr>
                                    <th className="text-right p-4 font-medium text-muted-foreground">المستخدم</th>
                                    <th className="text-right p-4 font-medium text-muted-foreground">البريد</th>
                                    <th className="text-right p-4 font-medium text-muted-foreground">الرتبة</th>
                                    <th className="text-right p-4 font-medium text-muted-foreground">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-primary/5 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                    {user.nickname?.charAt(0) || 'U'}
                                                </div>
                                                <span className="font-medium text-foreground">{user.nickname}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-muted-foreground">{user.email}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'owner' ? 'bg-yellow-100 text-yellow-800' :
                                                user.role === 'specialist' ? 'bg-primary/10 text-primary' :
                                                    'bg-muted text-muted-foreground'
                                                }`}>
                                                {user.role === 'owner' ? 'مالك' :
                                                    user.role === 'specialist' ? 'أخصائي' : 'مستخدم'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {actionLoading === user.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {user.role === 'user' && (
                                                        <button
                                                            onClick={() => handleRoleChange(user.id, 'specialist')}
                                                            className="p-2 text-primary hover:bg-primary/10 rounded-lg"
                                                            title="ترقية لأخصائي"
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {user.role === 'specialist' && (
                                                        <button
                                                            onClick={() => handleRoleChange(user.id, 'user')}
                                                            className="p-2 text-muted-foreground hover:bg-muted rounded-lg"
                                                            title="إلغاء صفة الأخصائي"
                                                        >
                                                            <ShieldOff className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {user.role !== 'owner' && (
                                                        <button
                                                            onClick={() => handleDelete(user.id)}
                                                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                                                            title="حذف"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                            لا يوجد مستخدمين
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
