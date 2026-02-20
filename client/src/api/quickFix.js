import api from "../utils/axios";

export const listQuickFix = async () => {
    return await api.get("/quick-fix");
};

export const createQuickFix = async (value) => {
    return await api.post("/quick-fix", value);
};

export const updateQuickFix = async (id, value) => {
    return await api.put(
        "/quick-fix/" + id,
        value
    );
};

export const removeQuickFix = async (id) => {
    return await api.delete("/quick-fix/" + id);
};

export const readQuickFix = async (id) => {
    return await api.get("/quick-fix/" + id);
}
