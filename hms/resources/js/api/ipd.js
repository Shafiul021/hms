import axios from './axios';

export const ipdApi = {
    getWards: async () => {
        const response = await axios.get('/wards');
        return response.data;
    },

    getBeds: async (wardId) => {
        const response = await axios.get(`/wards/${wardId}/beds`);
        return response.data;
    },

    admitPatient: async (data) => {
        const response = await axios.post('/admissions', data);
        return response.data;
    },

    dischargePatient: async (id) => {
        const response = await axios.patch(`/admissions/${id}/discharge`);
        return response.data;
    },

    getNursingNotes: async (admissionId) => {
        const response = await axios.get(`/admissions/${admissionId}/notes`);
        return response.data;
    },

    addNursingNote: async (admissionId, note) => {
        const response = await axios.post(`/admissions/${admissionId}/notes`, { note });
        return response.data;
    },
};
