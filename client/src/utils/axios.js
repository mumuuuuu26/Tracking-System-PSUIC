import axios from 'axios';

const APP_BASE_PREFIX = '/app';

const resolveAppBasePath = () => {
    if (typeof window === 'undefined') return '';
    const pathname = String(window.location?.pathname || '');
    if (pathname === APP_BASE_PREFIX || pathname.startsWith(`${APP_BASE_PREFIX}/`)) {
        return APP_BASE_PREFIX;
    }
    return '';
};

const resolveApiBaseUrl = () => {
    const envApiUrl = String(import.meta.env.VITE_API_URL || '').trim();
    if (envApiUrl) return envApiUrl;
    const appBasePath = resolveAppBasePath();
    return appBasePath ? `${appBasePath}/api` : '/api';
};

const api = axios.create({
    baseURL: resolveApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the auth token if available
api.interceptors.request.use(
    (config) => {
        // Check if Authorization header is already set (by the caller)
        // If so, we don't need to override it, or we rely on the caller.
        if (config.headers.Authorization) {
            return config;
        }

        // Otherwise, try to get from localStorage
        try {
            const storage = localStorage.getItem('auth-store');
            if (storage) {
                const { state } = JSON.parse(storage);
                const token = state?.token;
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
        } catch {
            // Silently ignore localStorage read errors; token won't be attached
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor: handle expired/invalid token globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear stored auth state and redirect to login
            localStorage.removeItem('auth-store');
            if (typeof window !== 'undefined') {
                const appBasePath = resolveAppBasePath();
                const loginPath = appBasePath ? `${appBasePath}/login` : '/login';
                if (window.location.pathname !== loginPath) {
                    window.location.href = loginPath;
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
