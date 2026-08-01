import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const instance = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Request Interceptor: Attach bearer token if it exists
instance.interceptors.request.use(
    (config) => {
        const token = useAuthStore.getState().token;
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Catch 401 errors and log out
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Trigger logout action in the auth store to clear the session
            useAuthStore.getState().logout();
        }
        return Promise.reject(error);
    }
);

export default instance;
