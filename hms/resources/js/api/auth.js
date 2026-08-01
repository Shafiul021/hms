import axios from './axios';

export const authApi = {
    register: async (data) => {
        const response = await axios.post('/auth/register', data);
        return response.data;
    },

    login: async (email, password) => {
        const response = await axios.post('/auth/login', { email, password });
        return response.data;
    },

    logout: async () => {
        const response = await axios.post('/auth/logout');
        return response.data;
    },

    getMe: async () => {
        const response = await axios.get('/auth/me');
        return response.data;
    },

    updateProfile: async (data) => {
        const response = await axios.patch('/auth/profile', data);
        return response.data;
    },

    changePassword: async (data) => {
        const response = await axios.patch('/auth/password', data);
        return response.data;
    },
};
