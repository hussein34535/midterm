"use client";

import { useState, useRef } from "react";
import { Upload, X, Check } from "lucide-react";
import { toast } from "sonner";

interface AvatarSelectorProps {
    onSelect: (avatarUrl: string) => void;
    selectedAvatar?: string;
}

const PRESET_AVATARS = [
    // Using placeholder services or SVG data URIs for demo if no assets
    // For now, I'll use simple colorful placeholders or just dependable online avatars
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Willow",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Garfield",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Midnight",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella",
];

export default function AvatarSelector({ onSelect, selectedAvatar }: AvatarSelectorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(selectedAvatar || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            toast.error("حجم الصورة كبير جداً (أقصى حد 2 ميجا)");
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
            <div className="flex items-center gap-6">
                <div className="relative w-20 h-20 rounded-full border-2 border-primary/20 p-1 flex items-center justify-center bg-secondary/30 shrink-0">
                    {preview ? (
                        <img src={preview} alt="Avatar Preview" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <span className="text-muted-foreground text-xs text-center">لا توجد صورة</span>
                    )}
                    {preview && (
                        <button
                            type="button"
                            onClick={() => { setPreview(null); onSelect(""); }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>

                <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-3">
                        اختر من القائمة أو ارفع صورتك الخاصة
                    </p>

                    {/* Presets */}
                    <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
                        {PRESET_AVATARS.map((avatar, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handlePresetSelect(avatar)}
                                className={`w-10 h-10 rounded-full border-2 shrink-0 transition-all ${preview === avatar ? "border-primary scale-110 shadow-sm" : "border-transparent hover:border-primary/50"
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
