import axios from './axios';

export const pharmacyApi = {
    getMedicines: async () => {
        const response = await axios.get('/medicines');
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
};
