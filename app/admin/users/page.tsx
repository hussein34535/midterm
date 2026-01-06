"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Shield, ShieldOff, ShieldAlert, Trash2, Loader2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { toast } from "sonner";

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

    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = users.filter(user =>
        user.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
            toast.error('فشل في جلب المستخدمين');
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
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (res.ok) {
                toast.success('تم تغيير الرتبة بنجاح');
                setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            } else {
                const data = await res.json();
                toast.error(data.error || 'حدث خطأ');
            }
        } catch (error) {
            toast.error('حدث خطأ في الاتصال');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (userId: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.')) return;

        setActionLoading(userId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                toast.success('تم حذف المستخدم بنجاح');
                setUsers(users.filter(u => u.id !== userId));
            } else {
                toast.error('فشل في حذف المستخدم');
            }
        } catch (error) {
            toast.error('حدث خطأ');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="bg-warm-mesh min-h-screen flex flex-col" dir="rtl">
            <Header />

            <main className="flex-grow pb-20 pt-32">
                <div className="container mx-auto px-6 max-w-5xl">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="p-2 hover:bg-primary/10 rounded-full transition-colors">
                                <ArrowRight className="w-6 h-6 text-foreground" />
                            </Link>
                            <h1 className="text-2xl font-bold text-foreground">إدارة المستخدمين</h1>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-96">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pr-10 pl-3 py-2 border border-border rounded-lg leading-5 bg-background placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary sm:text-sm transition-all shadow-sm"
                                placeholder="بحث باسم المستخدم أو البريد الإلكتروني..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
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
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="h-24 text-center">
                                            <div className="flex justify-center items-center h-full">
                                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                            </div>
                                        </td>
                                    </tr>
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                            لا يوجد مستخدمين حالياً
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-muted-foreground">
                                            عذراً، لا يوجد مستخدمين مطابقين للبحث 🔍
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-primary/5 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                        {user.nickname?.charAt(0).toUpperCase() || 'U'}
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
