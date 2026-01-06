import axios from "axios";

// List KB items
export const listKB = async (token, params) => {
    return await axios.get("http://localhost:5001/api/kb", {
        params,
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Read KB item
export const readKB = async (token, id) => {
    return await axios.get(`http://localhost:5001/api/kb/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Create KB item
export const createKB = async (token, data) => {
    return await axios.post("http://localhost:5001/api/kb", data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Update KB item
export const updateKB = async (token, id, data) => {
    return await axios.put(`http://localhost:5001/api/kb/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Remove KB item
export const removeKB = async (token, id) => {
    return await axios.delete(`http://localhost:5001/api/kb/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Vote helpful
export const voteKB = async (token, id) => {
    return await axios.put(`http://localhost:5001/api/kb/${id}/vote`, {}, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};
