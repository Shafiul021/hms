import axios from './axios';

export const adminApi = {
    getStats: async () => {
        const response = await axios.get('/admin/stats');
        return response.data;
    },

    getAppointmentTrend: async () => {
        const response = await axios.get('/admin/appointments/trend');
        return response.data;
    },

    getRevenueTrend: async () => {
        const response = await axios.get('/admin/revenue/trend');
        return response.data;
    },

    getBedOccupancy: async () => {
        const response = await axios.get('/admin/bed-occupancy');
        return response.data;
    },

    getActivityLogs: async () => {
        const response = await axios.get('/admin/activity-log');
        return response.data;
    },

    getUsers: async () => {
        const response = await axios.get('/admin/users');
        return response.data;
    },

    createUser: async (data) => {
        const response = await axios.post('/admin/users', data);
        return response.data;
    },

    updateUserRole: async (id, role) => {
        const response = await axios.patch(`/admin/users/${id}/role`, { role });
        return response.data;
    },

    updateUser: async (id, data) => {
        const response = await axios.put(`/admin/users/${id}`, data);
        return response.data;
    },

    deleteUser: async (id) => {
        const response = await axios.delete(`/admin/users/${id}`);
        return response.data;
    },
};
