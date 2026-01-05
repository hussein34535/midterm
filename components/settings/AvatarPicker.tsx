"use client";

import { useState } from "react";
import { Check, Camera, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Preset avatar options - warm and friendly
const PRESET_AVATARS = [
    "🌸", "🌿", "🌻", "🦋", "🌙", "⭐", "🌊", "🔥",
    "🦁", "🐻", "🦊", "🐰", "🐱", "🐶", "🦉", "🐬",
    "💜", "💙", "💚", "💛", "🧡", "❤️", "🤍", "🖤",
];

// Avatar background colors
const AVATAR_COLORS = [
    "bg-rose-100", "bg-amber-100", "bg-emerald-100", "bg-sky-100",
    "bg-violet-100", "bg-pink-100", "bg-teal-100", "bg-orange-100",
];

interface AvatarPickerProps {
    currentAvatar?: string;
    onAvatarChange: (avatar: string) => void;
}

export default function AvatarPicker({ currentAvatar, onAvatarChange }: AvatarPickerProps) {
    const [selectedEmoji, setSelectedEmoji] = useState<string>(currentAvatar || "🌸");
    const [selectedColor, setSelectedColor] = useState<string>("bg-rose-100");
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const avatarValue = `${selectedEmoji}|${selectedColor}`;

            const res = await fetch(`${API_URL}/api/user/avatar`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ avatar: avatarValue })
            });

            if (res.ok) {
                // Update local storage
                const userData = JSON.parse(localStorage.getItem('user') || '{}');
                userData.avatar = avatarValue;
                localStorage.setItem('user', JSON.stringify(userData));

                onAvatarChange(avatarValue);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        } catch (err) {
            console.error('Failed to save avatar:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Preview */}
            <div className="flex justify-center">
                <div className={`w-24 h-24 rounded-full ${selectedColor} flex items-center justify-center text-5xl shadow-lg border-4 border-white transition-all duration-300`}>
                    {selectedEmoji}
                </div>
            </div>

            {/* Emoji Selection */}
            <div>
                <h4 className="text-sm font-bold text-foreground mb-3">اختر الرمز</h4>
                <div className="grid grid-cols-8 gap-2">
                    {PRESET_AVATARS.map((emoji) => (
                        <button
                            key={emoji}
                            onClick={() => setSelectedEmoji(emoji)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${selectedEmoji === emoji
                                    ? 'bg-primary/20 ring-2 ring-primary scale-110'
                                    : 'bg-muted hover:bg-muted/80'
                                }`}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </div>

            {/* Color Selection */}
            <div>
                <h4 className="text-sm font-bold text-foreground mb-3">اختر اللون</h4>
                <div className="flex gap-3 flex-wrap">
                    {AVATAR_COLORS.map((color) => (
                        <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-10 h-10 rounded-full ${color} transition-all ${selectedColor === color
                                    ? 'ring-2 ring-primary ring-offset-2 scale-110'
                                    : 'hover:scale-105'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Save Button */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full btn-primary justify-center"
            >
                {saving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : saved ? (
                    <>
                        <Check className="w-5 h-5" />
                        <span>تم الحفظ!</span>
                    </>
                ) : (
                    <>
                        <Camera className="w-5 h-5" />
                        <span>حفظ الأفاتار</span>
                    </>
                )}
            </button>
        </div>
    );
}

// Helper function to render avatar from stored value
export function renderAvatar(avatarValue: string | undefined, size: 'sm' | 'md' | 'lg' = 'md') {
    const sizes = {
        sm: 'w-8 h-8 text-lg',
        md: 'w-12 h-12 text-2xl',
        lg: 'w-20 h-20 text-4xl'
    };

    if (!avatarValue) {
        return (
            <div className={`${sizes[size]} rounded-full bg-muted flex items-center justify-center`}>
                👤
            </div>
        );
    }

    // Check if it's emoji|color format
    if (avatarValue.includes('|')) {
        const [emoji, color] = avatarValue.split('|');
        return (
            <div className={`${sizes[size]} rounded-full ${color || 'bg-rose-100'} flex items-center justify-center`}>
                {emoji}
            </div>
        );
    }

    // Check if it's a URL
    if (avatarValue.startsWith('http')) {
        return (
            <img src={avatarValue} alt="Avatar" className={`${sizes[size]} rounded-full object-cover`} />
        );
    }

    // Default emoji
    return (
        <div className={`${sizes[size]} rounded-full bg-rose-100 flex items-center justify-center`}>
            {avatarValue}
        </div>
    );
}
