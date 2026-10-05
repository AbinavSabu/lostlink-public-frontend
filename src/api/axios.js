import axios from 'axios';

const getBaseApiUrl = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
        const base = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '');
        return base.endsWith('/api') ? base : `${base}/api`;
    }
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
    }
    const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    return `http://${host}:8081/api`;
};

const api = axios.create({
    baseURL: getBaseApiUrl(),
});

// Attach JWT token to requests dynamically and manage content-types
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            delete config.headers.Authorization;
        }

        // Let the browser set Content-Type with boundary for FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        } else if (!config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Handle session expiration without looping on login/register endpoints
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const isAuthEndpoint = error.config?.url?.includes('/auth/');

            if (!isAuthEndpoint && window.location.pathname !== '/login') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userId');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;