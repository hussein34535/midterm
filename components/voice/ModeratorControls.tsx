import { ShieldAlert, LogOut } from "lucide-react";

interface ModeratorControlsProps {
    onEndSession: () => void;
    isModerator: boolean;
}

export default function ModeratorControls({ onEndSession, isModerator }: ModeratorControlsProps) {
    if (!isModerator) return null;

    return (
        <div className="w-full max-w-md mx-auto mt-6 p-4 border border-red-200 bg-red-50 rounded-lg dark:bg-red-900/10 dark:border-red-900/50" dir="rtl">
            <div className="flex items-center gap-2 mb-3 text-red-700 dark:text-red-400 font-bold">
                <ShieldAlert className="w-5 h-5" />
                <span>لوحة التحكم بالمشرف</span>
            </div>

            <button
                onClick={onEndSession}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium"
            >
                <LogOut className="w-4 h-4" />
                إنهاء الجلسة للجميع
            </button>
            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-2 text-center">
                تحذير: هذا سيقوم بإنهاء الجلسة وإخراج جميع المشاركين.
            </p>
        </div>
    );
}
