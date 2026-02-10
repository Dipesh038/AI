import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
    baseURL: API_URL,
});

// Add a request interceptor to include the token
api.interceptors.request.use(
    (config) => {
        // Check for admin token first, then fallback to user token
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: gracefully handle cancelled requests
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isCancel(error)) {
            // Silently swallow cancelled requests — they're intentional
            return Promise.reject(error);
        }
        return Promise.reject(error);
    }
);

// Request deduplication map (prevents identical concurrent requests)
const pendingRequests = new Map();

/**
 * Deduplicated GET request. If an identical GET is already in flight,
 * return the same promise instead of firing a duplicate request.
 */
export const deduplicatedGet = (url, config = {}) => {
    const key = `${url}${JSON.stringify(config.params || {})}`;

    if (pendingRequests.has(key)) {
        return pendingRequests.get(key);
    }

    const request = api.get(url, config).finally(() => {
        pendingRequests.delete(key);
    });

    pendingRequests.set(key, request);
    return request;
};

export default api;
