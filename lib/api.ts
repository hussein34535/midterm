/**
 * API Service
 * Handles all communication with the backend
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Helper to get auth token
const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token');
    }
    return null;
};

// Helper to make authenticated requests
const authFetch = async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        // Build-in Maintenance Redirect
        if (response.status === 503 && typeof window !== 'undefined') {
            // Only redirect if not already there to avoid loops
            if (window.location.pathname !== '/maintenance') {
                window.location.href = '/maintenance';
            }
        }
        throw new Error(data.error || 'حدث خطأ');
    }

    return data;
};

// ============ AUTH ============

export const authAPI = {
    /**
     * Register new user
     */
    register: async (userData: {
        nickname: string;
        email: string;
        password: string;
        avatar?: string;
        guestToken?: string;
    }) => {
        const data = await authFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        // Save token and user
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.dispatchEvent(new Event('user-login'));
        }

        return data;
    },

    /**
     * Login user
     */
    login: async (credentials: { email: string; password: string }) => {
        const data = await authFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        // Save token and user
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.dispatchEvent(new Event('user-login'));
        }

        return data;
    },

    /**
     * Verify token and get current user
     */
    verify: async () => {
        return await authFetch('/auth/verify', {
            method: 'POST',
        });
    },

    /**
     * Logout user
     */
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    },
};

// ============ USERS ============

export const userAPI = {
    /**
     * Get current user profile
     */
    getProfile: async () => {
        return await authFetch('/users/me');
    },

    /**
     * Update user profile
     */
    updateProfile: async (data: { nickname?: string; avatar?: string }) => {
        return await authFetch('/users/me', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
};

// ============ SESSIONS ============

export const sessionAPI = {
    /**
     * Create new voice session
     */
    create: async (data: { title?: string; type?: 'individual' | 'group' }) => {
        return await authFetch('/sessions/create', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get session details
     */
    get: async (id: string) => {
        return await authFetch(`/sessions/${id}`);
    },

    /**
     * Join a session
     */
    join: async (id: string) => {
        return await authFetch(`/sessions/${id}/join`, {
            method: 'POST',
        });
    },

    /**
     * End a session
     */
    end: async (id: string) => {
        return await authFetch(`/sessions/${id}/end`, {
            method: 'POST',
        });
    },

    /**
     * Get all active sessions
     */
    getAll: async () => {
        return await authFetch('/sessions');
    },
};

export default {
    auth: authAPI,
    user: userAPI,
    session: sessionAPI,
};
