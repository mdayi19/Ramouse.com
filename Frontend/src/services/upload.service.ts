import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
    });
    return response.data;
};

export const uploadMultipleFiles = async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files[]', file);
    });

    const token = localStorage.getItem('authToken');
    const response = await axios.post(`${API_URL}/upload/multiple`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
    });
    return response.data;
};

export const deleteFile = async (path: string) => {
    const response = await axios.delete(`${API_URL}/upload`, {
        data: { path }
    });
    return response.data;
};
