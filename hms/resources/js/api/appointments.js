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

    cancel: async (id) => {
        const response = await axios.delete(`/appointments/${id}`);
        return response.data;
    },
};
