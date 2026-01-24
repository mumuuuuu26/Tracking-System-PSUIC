import axios from "axios";

export const getPermissions = async (token, role) => {
    return await axios.get(`/api/permission/${role}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const updatePermissions = async (token, role, data) => {
    return await axios.put(`/api/permission/${role}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const resetPermissions = async (token, role) => {
    return await axios.post(`/api/permission/${role}/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
