import axios from './axios';

export const prescriptionsApi = {
    getPrescription: async (id) => {
        const response = await axios.get(`/prescriptions/${id}`);
        return response.data;
    }
};
