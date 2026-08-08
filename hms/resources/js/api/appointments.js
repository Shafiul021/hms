import axios from './axios';

export const appointmentsApi = {
    getAppointments: async (params = {}) => {
        const response = await axios.get('/appointments', { params });
        return response.data;
    },

    bookAppointment: async (data) => {
        const response = await axios.post('/appointments', data);
        return response.data;
    },

    getAppointmentDetails: async (id) => {
        const response = await axios.get(`/appointments/${id}`);
        return response.data;
    },

    updateStatus: async (id, status) => {
        const response = await axios.patch(`/appointments/${id}/status`, { status });
        return response.data;
    },

    instantBook: async (data) => {
        const response = await axios.post('/appointments/instant', data);
        return response.data;
    },

    reschedule: async (id, data) => {
        const response = await axios.post(`/appointments/${id}/reschedule`, data);
        return response.data;
    },

    cancelWithReason: async (id, reason) => {
        const response = await axios.post(`/appointments/${id}/cancel`, { cancellation_reason: reason });
        return response.data;
    },

    cancel: async (id) => {
        // legacy soft delete
        const response = await axios.delete(`/appointments/${id}`);
        return response.data;
    },

    downloadPrescription: async (id) => {
        const response = await axios.get(`/appointments/${id}/download-prescription`, { responseType: 'blob' });
        return response.data;
    },

    downloadBill: async (id) => {
        const response = await axios.get(`/appointments/${id}/download-bill`, { responseType: 'blob' });
        return response.data;
    },

    downloadMedicalHistory: async (id) => {
        const response = await axios.get(`/appointments/${id}/download-medical-history`, { responseType: 'blob' });
        return response.data;
    },
};
