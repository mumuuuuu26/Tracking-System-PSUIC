import axios from 'axios';

export const createPersonalTask = async (token, data) => {
    return await axios.post(`${import.meta.env.VITE_API_URL}/personal-task`, data, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getPersonalTasks = async (token, query) => {
    // query can be { date: 'YYYY-MM-DD' } or { start, end }
    return await axios.get(`${import.meta.env.VITE_API_URL}/personal-task`, {
        params: query,
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const updatePersonalTask = async (token, id, data) => {
    return await axios.put(`${import.meta.env.VITE_API_URL}/personal-task/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const deletePersonalTask = async (token, id) => {
    return await axios.delete(`${import.meta.env.VITE_API_URL}/personal-task/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};
