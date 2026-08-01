import axios from './axios';

export const billingApi = {
    getBills: async (params = {}) => {
        const response = await axios.get('/bills', { params });
        return response.data;
    },

    getBill: async (id) => {
        const response = await axios.get(`/bills/${id}`);
        return response.data;
    },

    generateBill: async (appointmentId) => {
        const response = await axios.post('/bills/generate', { appointment_id: appointmentId });
        return response.data;
    },

    recordPayment: async (data) => {
        const response = await axios.post('/payments', data);
        return response.data;
    },

    downloadPdf: async (id) => {
        const response = await axios.get(`/bills/${id}/pdf`, {
            responseType: 'blob',
        });
        return response.data;
    },
};
