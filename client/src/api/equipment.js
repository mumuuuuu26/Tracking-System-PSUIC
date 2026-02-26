import api from "../utils/axios";

export const listEquipments = async () => {
    return await api.get("/equipment");
};

export const getEquipment = async (id) => {
    return await api.get(`/equipment/${id}`);
};

export const createEquipment = async (form) => {
    return await api.post("/equipment", form);
};

export const updateEquipment = async (id, form) => {
    return await api.put("/equipment/" + id, form);
};

export const removeEquipment = async (id) => {
    return await api.delete("/equipment/" + id);
};

export const removeEquipmentsBulk = async (ids) => {
    return await api.delete("/equipment/bulk-delete", { data: { ids } });
};

export const getEquipmentQR = async (id) => {
    return await api.get(`/equipment/${id}/qr`);
};
