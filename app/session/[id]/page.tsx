"use client";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Users, Clock, Shield, Info, Settings, User, Edit } from "lucide-react";
import VoiceCall from "@/components/voice/VoiceCall";

export default function SessionPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [user, setUser] = useState<any>(null);
    const [isCallEnded, setIsCallEnded] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            setUser(JSON.parse(stored));
        } else {
            router.push('/login');
        }
    }, [router]);

    const handleEndCall = () => {
        setIsCallEnded(true);
    };

    if (!user) return null;

    const isSpecialist = user.role === 'specialist' || user.role === 'owner';

    return (
        <div className="relative min-h-screen overflow-hidden bg-slate-900 text-slate-100 font-sans" dir="rtl">
            {/* Dynamic Aurora Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-500/20 blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[100px] animate-pulse delay-700"></div>
                <div className="absolute top-[40%] left-[20%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[80px] animate-pulse delay-1000"></div>
            </div>

            {/* Glass Overlay Texture */}
            <div className="absolute inset-0 z-0 bg-slate-950/40 backdrop-blur-[1px]"></div>

            {/* Content Container */}
            <div className="relative z-10 flex h-screen">

                {/* Main Voice Area */}
                <div className={`flex-1 flex flex-col transition-all duration-500 ${showSidebar ? 'mr-0' : 'mr-0'}`}>

                    {/* Top Nav (Floating) */}
                    <div className="p-6 flex items-center justify-between">
                        <Link href="/dashboard" className="p-3 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 transition-all group">
                            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-white" />
                        </Link>

                        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/5">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <h1 className="text-sm font-medium text-slate-200">
                                {isSpecialist ? 'لوحة تحكم الأخصائي' : 'جلسة دعم نفسي'}
                            </h1>
                        </div>

                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className={`p-3 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/5 transition-all ${!showSidebar ? 'bg-white/20 text-white' : 'text-slate-300'}`}
                        >
                            <Info className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Central Stage */}
                    <div className="flex-1 flex items-center justify-center p-4">
                        {isCallEnded ? (
                            <div className="text-center animate-in zoom-in duration-500">
                                <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_-12px_rgba(16,185,129,0.5)]">
                                    <span className="text-4xl">✨</span>
                                </div>
                                <h2 className="text-3xl font-light text-white mb-3">انتهت الجلسة</h2>
                                <p className="text-slate-400 mb-8 font-light">نتمنى لك يوماً هادئاً</p>
                                <Link href="/dashboard" className="px-8 py-3 rounded-full bg-white text-slate-900 font-medium hover:bg-slate-200 transition-colors shadow-lg shadow-white/10">
                                    العودة للرئيسية
                                </Link>
                            </div>
                        ) : (
                            <VoiceCall
                                channelName={`iwaa-session-${sessionId}`}
                                userName={user.nickname || "مستخدم"}
                                userAvatar={user.avatar}
                                userRole={user.role}
                                onEndCall={handleEndCall}
                                className="w-full max-w-2xl bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-2xl shadow-black/20 p-8 md:p-12 transition-all duration-500 hover:border-white/20"
                            />
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
