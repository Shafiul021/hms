import axios from './axios';

export const symptomsApi = {
    search: async (query = '') => {
        const response = await axios.get(`/symptoms`, {
            params: { search: query }
        });
        return response.data;
    },
    
    create: async (name) => {
        const response = await axios.post('/symptoms', { name });
        return response.data;
    }
};
