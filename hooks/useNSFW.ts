"use client";

import { useState, useEffect, useRef } from 'react';
import * as nsfwjs from 'nsfwjs';
import * as tf from '@tensorflow/tfjs';

// Ensure backend is set (CPU is safest for broad compatibility client-side without WebGL issues, though WebGL is faster)
// Often tfjs automatically selects the best backend.

export const useNSFW = () => {
    const [model, setModel] = useState<nsfwjs.NSFWJS | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize model
    useEffect(() => {
        const loadModel = async () => {
            try {
                // Check if already loading or loaded
                if (model) return;

                setLoading(true);
                const loadedModel = await nsfwjs.load();
                setModel(loadedModel);
                setLoading(false);
                console.log("NSFWJS Model loaded");
            } catch (err: any) {
                console.error("Failed to load NSFWJS model:", err);
                setError("فشل في تحميل نظام الحماية");
                setLoading(false);
            }
        };

        // Load lazily or immediately? prefer immediate but async to be ready
        loadModel();
    }, []);

    const checkImage = async (file: File): Promise<{ isSafe: boolean; reason?: string }> => {
        if (!model) {
            // Try reload or wait? For now reject if not ready
            return { isSafe: true }; // Allow if model fails? Or block? Safe fail: Allow but warn logs.
            // Better: If model failed to load, we can't block users forever.
        }

        try {
            // Create an HTMLImageElement to verify
            const img = document.createElement('img');
            const objectUrl = URL.createObjectURL(file);
            img.src = objectUrl;

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const predictions = await model.classify(img);
            URL.revokeObjectURL(objectUrl);

            // Check predictions
            // Predictions are array of { className: "Porn" | "Hentai" | "Sexy" | "Neutral" | "Drawing", probability: number }

            // Thresholds
            const UNSAFE_THRESHOLD = 0.60; // 60% confidence

            const unsafeCategories = predictions.filter(p =>
                ['Porn', 'Hentai', 'Sexy'].includes(p.className) && p.probability > UNSAFE_THRESHOLD
            );

            if (unsafeCategories.length > 0) {
                const reason = unsafeCategories.map(c => `${c.className} (${Math.round(c.probability * 100)}%)`).join(', ');
                console.warn("NSFW Content Blocked:", reason);
                return { isSafe: false, reason: 'تم اكتشاف محتوى غير لائق في الصورة.' };
            }

            return { isSafe: true };

        } catch (err) {
            console.error("Error checking image:", err);
            return { isSafe: true }; // Fail open
        }
    };

    return { checkImage, loading, error };
};
