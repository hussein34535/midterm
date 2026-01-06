'use client';

import { useEffect, useState } from 'react';
import { Wrench, RefreshCw } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function MaintenancePage() {
    const [retrying, setRetrying] = useState(false);

    const checkMaintenance = async () => {
        setRetrying(true);
        try {
            const res = await fetch(`${API_URL}/api/settings`);
            if (res.ok) {
                const data = await res.json();
                if (!data.settings?.maintenance_mode) {
                    window.location.href = '/';
                }
            }
        } catch (error) {
            console.error('Maintenance check failed:', error);
        } finally {
            setTimeout(() => setRetrying(false), 1000);
        }
    };

    useEffect(() => {
        // Auto check every 30 seconds
        const interval = setInterval(checkMaintenance, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <Wrench className="w-12 h-12 text-white" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                        جاري الصيانة
                    </h1>

                    <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                        نعمل حالياً على تحسين المنصة لتقديم أفضل تجربة لك.
                        <br />
                        سنعود قريباً! 🌸
                    </p>

                    <button
                        onClick={checkMaintenance}
                        disabled={retrying}
                        className="btn-primary px-8 py-3 text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {retrying ? (
                            <>
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                                جاري التحقق...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-5 h-5 mr-2" />
                                إعادة المحاولة
                            </>
                        )}
                    </button>

                    <p className="text-sm text-gray-400 mt-6">
                        سيتم التحقق تلقائياً كل 30 ثانية
                    </p>
                </div>
            </div>
        </div>
    );
}
