import api from "../utils/axios";

export const getPermissions = async (role) => {
    return await api.get(`/permission/${role}`);
};

export const updatePermissions = async (role, data) => {
    return await api.put(`/permission/${role}`, data);
};

export const resetPermissions = async (role) => {
    return await api.post(`/permission/${role}/reset`, {});
};
