import axios from './axios';

export const labApi = {
    getLabRequests: async (params = {}) => {
        const response = await axios.get('/lab-requests', { params });
        return response.data;
    },

    getLabRequest: async (id) => {
        const response = await axios.get(`/lab-requests/${id}`);
        return response.data;
    },

    createLabRequest: async (data) => {
        const response = await axios.post('/lab-requests', data);
        return response.data;
    },

    uploadResult: async (id, data) => {
        const response = await axios.patch(`/lab-results/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    getResult: async (id) => {
        const response = await axios.get(`/lab-results/${id}`);
        return response.data;
    },

    getDownloadUrl: async (id) => {
        // Obtains temporary signed URL from API
        const response = await axios.get(`/lab-results/${id}`);
        return response.data.data.download_url;
    },
};
