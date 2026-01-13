import axios from "axios";

// List KB items
export const listKB = async (token, params) => {
    return await axios.get(`${import.meta.env.VITE_API_URL}/kb`, {
        params,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Read KB item
export const readKB = async (token, id) => {
    return await axios.get(`${import.meta.env.VITE_API_URL}/kb/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Create KB item
export const createKB = async (token, data) => {
    return await axios.post(`${import.meta.env.VITE_API_URL}/kb`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Update KB item
export const updateKB = async (token, id, data) => {
    return await axios.put(`${import.meta.env.VITE_API_URL}/kb/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Remove KB item
export const removeKB = async (token, id) => {
    return await axios.delete(`${import.meta.env.VITE_API_URL}/kb/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Vote helpful
export const voteKB = async (token, id) => {
    return await axios.put(`${import.meta.env.VITE_API_URL}/kb/${id}/vote`, {}, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

