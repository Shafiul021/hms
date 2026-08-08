import axios from './axios';

export const patientsApi = {
    getPatients: async (params = {}) => {
        const response = await axios.get('/patients', { params });
        return response.data;
    },

    getPatient: async (id) => {
        const response = await axios.get(`/patients/${id}`);
        return response.data;
    },

    createPatient: async (data) => {
        const response = await axios.post('/patients', data);
        return response.data;
    },

    updatePatient: async (id, data) => {
        const response = await axios.patch(`/patients/${id}`, data);
        return response.data;
    },

    deletePatient: async (id) => {
        const response = await axios.delete(`/patients/${id}`);
        return response.data;
    },

    getMedicalHistory: async (id) => {
        const response = await axios.get(`/patients/${id}/history`);
        return response.data;
    },

    getPrescriptions: async (id) => {
        const response = await axios.get(`/patients/${id}/prescriptions`);
        return response.data;
    },

    getLabResults: async (id) => {
        const response = await axios.get(`/patients/${id}/lab-results`);
        return response.data;
    },

    getBills: async (id) => {
        const response = await axios.get(`/patients/${id}/bills`);
        return response.data;
    },

    downloadMedicalHistory: async (id) => {
        const response = await axios.get(`/patients/${id}/download-medical-history`, { responseType: 'blob' });
        return response.data;
    },
};
