'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Search,
    Plus,
    UserPlus,
    Loader2
} from 'lucide-react';

// Interfaces
interface User {
    id: string;
    nickname: string;
    email: string;
    avatar?: string;
    role?: string;
    created_at?: string;
}

interface Group {
    id: string;
    name: string;
    course_id: string;
    capacity: number;
    member_count: number;
    specialist_id?: string;
    specialist?: User;
}

interface Course {
    id: string;
    title: string;
}

interface NewGroupData {
    name: string;
    course_id: string;
    capacity: number;
}

export default function GroupsManagementPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState('all');

    // For assigning specialist modal
    const [isAssigning, setIsAssigning] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
    const [specialistSearch, setSpecialistSearch] = useState('');
    const [specialistResults, setSpecialistResults] = useState<User[]>([]);
    const [allSpecialists, setAllSpecialists] = useState<User[]>([]);

    // Add Member State
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [selectedGroupForMember, setSelectedGroupForMember] = useState<Group | null>(null);
    const [memberSearch, setMemberSearch] = useState('');
    const [memberResults, setMemberResults] = useState<User[]>([]);
    const [addingMember, setAddingMember] = useState(false);

    // Create Group State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [courses, setCourses] = useState<Course[]>([]);
    const [newGroupData, setNewGroupData] = useState<NewGroupData>({
        name: '',
        course_id: '',
        capacity: 4
    });

    const router = useRouter();

    useEffect(() => {
        fetchGroups();
        fetchCourses();
        fetchSpecialists();
    }, [selectedCourse]);

    const fetchGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const url = selectedCourse === 'all'
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/groups`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/groups?course_id=${selectedCourse}`;

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                setGroups(data.groups);
            }
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setCourses(data.courses || []);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const fetchSpecialists = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/specialists`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.specialists) {
                setAllSpecialists(data.specialists);
                setSpecialistResults(data.specialists); // Initial display
            }
        } catch (error) {
            console.error('Error fetching specialists:', error);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupData.name || !newGroupData.course_id) return;

        setCreating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newGroupData)
            });

            const data = await res.json();
            if (data.success) {
                setGroups([...groups, { ...data.group, member_count: 0 }]);
                setShowCreateModal(false);
                setNewGroupData({ name: '', course_id: '', capacity: 4 });
            }
        } catch (error) {
            console.error('Create error:', error);
        } finally {
            setCreating(false);
        }
    };

    const handleSearchSpecialist = (query: string) => {
        setSpecialistSearch(query);
        if (!query) {
            setSpecialistResults(allSpecialists);
            return;
        }
        const filtered = allSpecialists.filter(s =>
            s.nickname?.toLowerCase().includes(query.toLowerCase()) ||
            s.email?.toLowerCase().includes(query.toLowerCase())
        );
        setSpecialistResults(filtered);
    };

    const handleSearchMember = async (query: string) => {
        setMemberSearch(query);
        if (query.length < 2) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/search?q=${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            setMemberResults(data.users || []);
        } catch (error) {
            console.error('Search error:', error);
        }
    };

    const handleAddMember = async (userId: string) => {
        if (!selectedGroupForMember) return;

        setAddingMember(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${selectedGroupForMember.id}/add-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ user_id: userId })
            });

            const data = await res.json();

            if (data.success) {
                setGroups(groups.map(g =>
                    g.id === selectedGroupForMember.id
                        ? { ...g, member_count: (g.member_count || 0) + 1 }
                        : g
                ));

                setIsAddingMember(false);
                setSelectedGroupForMember(null);
                setMemberSearch('');
                setMemberResults([]);
            } else {
                alert(data.error || 'فشل إضافة العضو');
            }
        } catch (error) {
            console.error('Add member error:', error);
            alert('حدث خطأ أثناء إضافة العضو');
        } finally {
            setAddingMember(false);
        }
    };

    const assignSpecialist = async (specialistId: string) => {
        if (!selectedGroup) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${selectedGroup.id}/assign-specialist`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ specialist_id: specialistId })
            });

            const data = await res.json();
            if (data.success) {
                const updatedSpecialist = allSpecialists.find(s => s.id === specialistId);
                setGroups(groups.map(g =>
                    g.id === selectedGroup.id
                        ? { ...g, specialist_id: specialistId, specialist: updatedSpecialist }
                        : g
                ));
                setIsAssigning(false);
                setSelectedGroup(null);
                setSpecialistSearch('');
                setSpecialistResults(allSpecialists);
            }
        } catch (error) {
            console.error('Assignment error:', error);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Users className="w-8 h-8 text-primary" />
                        إدارة المجموعات
                    </h1>
                    <p className="text-gray-500 mt-1">إدارة مجموعات الكورسات وتعيين الأخصائيين</p>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    مجموعة جديدة
                </button>
            </div>

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="font-bold text-lg mb-4">إنشاء مجموعة جديدة</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">الكورس</label>
                                <select
                                    value={newGroupData.course_id}
                                    onChange={(e) => setNewGroupData({ ...newGroupData, course_id: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:border-primary"
                                >
                                    <option value="">-- اختر الكورس --</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">اسم المجموعة</label>
                                <input
                                    type="text"
                                    value={newGroupData.name}
                                    onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                                    placeholder="مثال: مجموعة التعافي 1"
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">السعة (عدد الأعضاء)</label>
                                <input
                                    type="number"
                                    value={newGroupData.capacity}
                                    onChange={(e) => setNewGroupData({ ...newGroupData, capacity: Number(e.target.value) })}
                                    className="w-full px-4 py-2 border rounded-lg outline-none focus:border-primary"
                                    min="1"
                                    max="50"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleCreateGroup}
                                disabled={creating}
                                className="flex-1 btn-primary justify-center"
                            >
                                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إنشاء'}
                            </button>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4">
                <div className="flex-1 relative">
                    <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="بحث عن مجموعة..."
                        className="w-full pr-10 pl-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Groups Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups
                        .filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(group => (
                            <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-800">{group.name}</h3>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${group.member_count >= group.capacity
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-green-100 text-green-600'
                                            }`}>
                                            {group.member_count} / {group.capacity}
                                        </span>
                                    </div>

                                    <div className="border-t pt-4">
                                        <p className="text-xs text-gray-500 mb-2">الأخصائي المسؤول:</p>

                                        {group.specialist ? (
                                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                                                        {group.specialist.nickname?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm">{group.specialist.nickname}</p>
                                                        <p className="text-[10px] text-gray-500">{group.specialist.email}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => { setSelectedGroup(group); setIsAssigning(true); }}
                                                    className="text-primary text-xs hover:underline"
                                                >
                                                    تغيير
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setSelectedGroup(group); setIsAssigning(true); }}
                                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                                تعيين أخصائي
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => { setSelectedGroupForMember(group); setIsAddingMember(true); }}
                                        className="w-full mt-2 py-2 border border-primary/20 bg-primary/5 text-primary rounded-lg text-sm font-bold hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        إضافة عضو
                                    </button>
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {/* Add Member Modal */}
            {isAddingMember && selectedGroupForMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="font-bold text-lg mb-4">
                            إضافة عضو لـ {selectedGroupForMember.name}
                        </h3>

                        <div className="relative mb-4">
                            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="ابحث بالاسم، البريد أو ID..."
                                className="w-full pr-10 pl-4 py-2 border rounded-lg outline-none focus:border-primary"
                                value={memberSearch}
                                onChange={(e) => handleSearchMember(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                            {memberResults.map(user => (
                                <button
                                    key={user.id}
                                    onClick={() => handleAddMember(user.id)}
                                    disabled={addingMember}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-right disabled:opacity-50"
                                >
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold shrink-0">
                                        {user.nickname?.charAt(0)}
                                    </div>
                                    <div className="mr-8">
                                        <p className="font-bold text-sm text-gray-800">{user.nickname}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </button>
                            ))}
                            {memberSearch.length > 2 && memberResults.length === 0 && (
                                <p className="text-center text-gray-500 text-sm py-4">لاتوجد نتائج</p>
                            )}
                            {memberSearch.length < 2 && (
                                <p className="text-center text-gray-400 text-xs py-2">ابحث عن الطالب للإضافة</p>
                            )}
                        </div>

                        <button
                            onClick={() => { setIsAddingMember(false); setSelectedGroupForMember(null); setMemberResults([]); setMemberSearch(''); }}
                            className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            )}

            {/* Assign Specialist Modal */}
            {isAssigning && selectedGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <h3 className="font-bold text-lg mb-4">
                            تعيين أخصائي لـ {selectedGroup.name}
                        </h3>

                        <div className="relative mb-4">
                            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="ابحث بالاسم أو البريد..."
                                className="w-full pr-10 pl-4 py-2 border rounded-lg outline-none focus:border-primary"
                                value={specialistSearch}
                                onChange={(e) => handleSearchSpecialist(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="max-h-60 overflow-y-auto space-y-2 mb-4">
                            {specialistResults.map(specialist => (
                                <button
                                    key={specialist.id}
                                    onClick={() => assignSpecialist(specialist.id)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-right"
                                >
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold shrink-0">
                                        {specialist.nickname?.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-800">{specialist.nickname}</p>
                                        <p className="text-xs text-gray-500">{specialist.email}</p>
                                    </div>
                                    {specialist.id === selectedGroup.specialist_id && (
                                        <span className="mr-auto text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">الحالي</span>
                                    )}
                                </button>
                            ))}
                            {specialistResults.length === 0 && (
                                <p className="text-center text-gray-500 text-sm py-4">لاتوجد نتائج</p>
                            )}
                        </div>

                        <button
                            onClick={() => { setIsAssigning(false); setSelectedGroup(null); setSpecialistResults(allSpecialists); setSpecialistSearch(''); }}
                            className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            إلغاء
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
