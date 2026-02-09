import api from "../utils/axios";

export const getPermissions = async (token, role) => {
    return await api.get(`/permission/${role}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const updatePermissions = async (token, role, data) => {
    return await api.put(`/permission/${role}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const resetPermissions = async (token, role) => {
    return await api.post(`/permission/${role}/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
