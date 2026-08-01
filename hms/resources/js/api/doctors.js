import axios from './axios';

export const doctorsApi = {
    getDoctors: async (params = {}) => {
        const response = await axios.get('/doctors', { params });
        return response.data;
    },

    getDoctor: async (id) => {
        const response = await axios.get(`/doctors/${id}`);
        return response.data;
    },

    getDoctorSlots: async (doctorId, date) => {
        const response = await axios.get(`/doctors/${doctorId}/slots`, { params: { date } });
        return response.data;
    },

    createDoctor: async (data) => {
        const response = await axios.post('/doctors', data);
        return response.data;
    },

    updateDoctor: async (id, data) => {
        const response = await axios.patch(`/doctors/${id}`, data);
        return response.data;
    },

    updateSchedule: async (id, data) => {
        const response = await axios.patch(`/doctors/${id}/schedule`, data);
        return response.data;
    },
};
