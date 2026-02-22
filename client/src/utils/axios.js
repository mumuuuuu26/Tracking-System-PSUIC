import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
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
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
