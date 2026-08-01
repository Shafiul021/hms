import axios from './axios';

export const opdApi = {
    createDiagnosis: async (data) => {
        const response = await axios.post('/diagnoses', data);
        return response.data;
    },

    createPrescription: async (data) => {
        const response = await axios.post('/prescriptions', data);
        return response.data;
    },

    getLabTests: async () => {
        const response = await axios.get('/lab-tests');
        return response.data;
    },
};
