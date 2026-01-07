'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Users,
    Search,
    Plus,
    UserPlus,
    Loader2,
    Eye,
    X,
    Trash2,
    ArrowRight
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

    // View Members State
    const [isViewingMembers, setIsViewingMembers] = useState(false);
    const [viewingGroup, setViewingGroup] = useState<Group | null>(null);
    const [groupMembers, setGroupMembers] = useState<User[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [deletingMember, setDeletingMember] = useState<string | null>(null);

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
        // Allow empty query to fetch default users (first 100)
        // if (query.length < 2) return;

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

    const fetchGroupMembers = async (group: Group) => {
        setViewingGroup(group);
        setIsViewingMembers(true);
        setLoadingMembers(true);

        try {
            const token = localStorage.getItem('token');
            // Use group.id to get members for this specific group
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}/members`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                setGroupMembers(data.members || []);
            }
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setLoadingMembers(false);
        }
    };

    const handleDeleteMember = async (userId: string) => {
        if (!viewingGroup) return;

        setDeletingMember(userId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${viewingGroup.id}/members/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();
            if (data.success) {
                setGroupMembers(groupMembers.filter(m => m.id !== userId));
                // Update group member count
                setGroups(groups.map(g =>
                    g.id === viewingGroup.id
                        ? { ...g, member_count: Math.max(0, (g.member_count || 1) - 1) }
                        : g
                ));
            }
        } catch (error) {
            console.error('Delete member error:', error);
        } finally {
            setDeletingMember(null);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen" dir="rtl">
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-medium mb-4"
                >
                    <ArrowRight className="w-5 h-5" />
                    العودة
                </button>
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Users className="w-8 h-8 md:w-10 md:h-10 text-primary" />
                        إدارة المجموعات
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm md:text-base">إدارة مجموعات الكورسات وتعيين الأخصائيين</p>
                </div>

                <div className="flex flex-col-reverse md:flex-row gap-3 md:items-center">
                    <div className="relative w-full md:w-64">
                        <Search className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="بحث عن مجموعة..."
                            className="w-full pr-10 pl-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none shadow-sm transition-all text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-primary w-full md:w-auto py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>مجموعة جديدة</span>
                    </button>
                </div>
            </div>

            {/* Groups Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {groups
                        .filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(group => (
                            <div key={group.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group-card relative">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1 min-w-0 ml-3">
                                            <h3 className="font-bold text-lg text-gray-800 truncate leading-tight">{group.name}</h3>
                                            <p className="text-xs text-muted-foreground mt-1 truncate">
                                                {courses.find(c => c.id === group.course_id)?.title || 'كورس غير معروف'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <button
                                                onClick={() => {
                                                    if (confirm('هل أنت متأكد من حذف هذه المجموعة؟ سيتم إزالة جميع الأعضاء منها.')) {
                                                        const handleDeleteGroup = async () => {
                                                            try {
                                                                const token = localStorage.getItem('token');
                                                                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${group.id}`, {
                                                                    method: 'DELETE',
                                                                    headers: { 'Authorization': `Bearer ${token}` }
                                                                });
                                                                if (res.ok) {
                                                                    setGroups(groups.filter(g => g.id !== group.id));
                                                                } else {
                                                                    alert('فشل حذف المجموعة');
                                                                }
                                                            } catch (err) {
                                                                console.error(err);
                                                                alert('حدث خطأ');
                                                            }
                                                        };
                                                        handleDeleteGroup();
                                                    }
                                                }}
                                                className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 hover:text-red-600 transition-colors"
                                                title="حذف المجموعة"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-wide border ${group.member_count >= group.capacity
                                                ? 'bg-red-50 text-red-600 border-red-100'
                                                : 'bg-green-50 text-green-600 border-green-100'
                                                }`}>
                                                {group.member_count} / {group.capacity}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-xl p-3 mb-4 border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">الأخصائي المسؤول</span>
                                            {group.specialist && (
                                                <button
                                                    onClick={() => { setSelectedGroup(group); setIsAssigning(true); }}
                                                    className="text-[10px] bg-white border border-gray-200 px-2 py-1 rounded text-primary hover:text-primary-dark transition-colors"
                                                >
                                                    تغيير
                                                </button>
                                            )}
                                        </div>

                                        {group.specialist ? (
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold border border-white shadow-sm overflow-hidden">
                                                        {group.specialist.avatar ? (
                                                            <img src={group.specialist.avatar} alt={group.specialist.nickname} className="w-full h-full object-cover" />
                                                        ) : (
                                                            group.specialist.nickname?.charAt(0)
                                                        )}
                                                    </div>
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm text-gray-900 truncate">{group.specialist.nickname}</p>
                                                    <p className="text-[10px] text-gray-500 truncate font-medium">{group.specialist.email}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => { setSelectedGroup(group); setIsAssigning(true); }}
                                                className="w-full py-3 border border-dashed border-primary/30 bg-primary/5 rounded-lg text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 text-xs font-bold"
                                            >
                                                <UserPlus className="w-4 h-4" />
                                                تعيين أخصائي
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => fetchGroupMembers(group)}
                                            className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                        >
                                            <Eye className="w-4 h-4" />
                                            الأعضاء
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedGroupForMember(group);
                                                setIsAddingMember(true);
                                                handleSearchMember('');
                                            }}
                                            className="flex-1 py-2.5 bg-primary/10 text-primary border border-primary/10 rounded-xl text-xs font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                                        >
                                            <Plus className="w-4 h-4" />
                                            إضافة
                                        </button>
                                    </div>
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

            {/* View Members Modal */}
            {isViewingMembers && viewingGroup && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-lg">أعضاء {viewingGroup.name}</h3>
                            <button
                                onClick={() => { setIsViewingMembers(false); setViewingGroup(null); setGroupMembers([]); }}
                                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">
                            {groupMembers.length} عضو من {viewingGroup.capacity}
                        </p>

                        {loadingMembers ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : groupMembers.length > 0 ? (
                            <div className="space-y-3 max-h-[350px] overflow-y-auto">
                                {groupMembers.map((member: User, index: number) => (
                                    <div key={`${member.id}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-primary font-bold">{member.nickname?.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{member.nickname}</p>
                                                <p className="text-xs text-gray-400">{member.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteMember(member.id)}
                                            disabled={deletingMember === member.id}
                                            className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 transition-colors"
                                        >
                                            {deletingMember === member.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-gray-400 py-8">لا يوجد أعضاء في هذه المجموعة</p>
                        )}

                        <button
                            onClick={() => { setIsViewingMembers(false); setViewingGroup(null); setGroupMembers([]); }}
                            className="w-full mt-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
