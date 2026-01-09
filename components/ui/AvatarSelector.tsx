"use client";

import { useState, useRef } from "react";
import { Upload, X, Check } from "lucide-react";
import { toast } from "sonner";

interface AvatarSelectorProps {
    onSelect: (avatarUrl: string) => void;
    selectedAvatar?: string;
}

const PRESET_AVATARS = [
    // Custom 3D Pixar-style avatars
    '/avatars/avatar1.png',
    '/avatars/avatar2.png',
    '/avatars/avatar3.png',
    '/avatars/avatar4.png',
    '/avatars/avatar5.png',
    '/avatars/avatar6.png',
    '/avatars/avatar7.png',
    '/avatars/avatar8.png',
    '/avatars/avatar9.png',
    '/avatars/avatar10.png',
    '/avatars/avatar11.png',
    '/avatars/avatar12.png',
    '/avatars/avatar13.png',
    '/avatars/avatar14.png',
    '/avatars/avatar15.png',
    '/avatars/avatar16.png',
    '/avatars/avatar17.png',
    '/avatars/avatar18.png',
    '/avatars/avatar19.png',
    '/avatars/avatar20.png',
    '/avatars/avatar21.png',
    '/avatars/avatar22.png',
];

export default function AvatarSelector({ onSelect, selectedAvatar }: AvatarSelectorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(selectedAvatar || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error("حجم الصورة كبير جداً (أقصى حد 5 ميجا)");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setPreview(result);
            onSelect(result);
        };
        reader.readAsDataURL(file);
    };

    const handlePresetSelect = (url: string) => {
        setPreview(url);
        onSelect(url);
    };

    return (
        <div className="space-y-4">
            <label className="text-sm font-medium text-foreground block mb-2">
                اختر صورة شخصية (أفاتار)
            </label>

            {/* Preview Section */}
            <div className="flex items-center gap-4 md:gap-6">
                <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-primary/20 p-1 flex items-center justify-center bg-secondary/30 shrink-0">
                    {preview ? (
                        <img src={preview} alt="Avatar Preview" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <span className="text-muted-foreground text-xs text-center px-1">لا توجد صورة</span>
                    )}
                    {preview && (
                        <button
                            type="button"
                            onClick={() => { setPreview(null); onSelect(""); }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 shadow-sm hover:bg-red-600 transition-colors"
                        >
                            <X className="w-3 h-3 md:w-4 md:h-4" />
                        </button>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-2 md:mb-3">
                        اختر من القائمة أو ارفع صورتك الخاصة
                    </p>

                    {/* Presets */}
                    <div className="flex gap-3 md:gap-4 overflow-x-auto pb-2 mb-2 md:mb-3 scrollbar-hide px-1 py-1 w-full max-w-full touch-pan-x">
                        {PRESET_AVATARS.map((avatar, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handlePresetSelect(avatar)}
                                className={`w-16 h-16 rounded-full border-2 shrink-0 transition-all ${preview === avatar ? "border-primary scale-110 shadow-sm" : "border-transparent hover:border-primary/50"
                                    }`}
                            >
                                <img src={avatar} alt={`Avatar ${idx}`} className="w-full h-full rounded-full" />
                            </button>
                        ))}
                    </div>

                    {/* Upload Button */}
                    <div className="flex">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 text-xs font-bold text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors border border-primary/20 border-dashed"
                        >
                            <Upload className="w-3 h-3" />
                            رفع صورة
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
