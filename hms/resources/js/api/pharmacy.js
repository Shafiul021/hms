import axios from './axios';

export const pharmacyApi = {
    getMedicines: async () => {
        const response = await axios.get('/medicines', { params: { all: 1 } });
        return response.data;
    },

    createMedicine: async (data) => {
        const response = await axios.post('/medicines', data);
        return response.data;
    },

    updateStock: async (id, data) => {
        const response = await axios.patch(`/medicines/${id}/stock`, data);
        return response.data;
    },

    dispensePrescription: async (data) => {
        const response = await axios.post('/dispensings', data);
        return response.data;
    },

    getPrescription: async (id) => {
        const response = await axios.get(`/prescriptions/${id}`);
        return response.data;
    },

    getPrescriptions: async (params = {}) => {
        const response = await axios.get('/prescriptions', { params });
        return response.data;
    },

    downloadPrescriptionPdf: (id) => {
        // Since downloading a file usually requires navigating or handling blobs,
        // we can simply return the URL for an anchor tag or window.open
        return `/api/prescriptions/${id}/pdf`;
    },
};
