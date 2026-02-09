import api from "../utils/axios";

export const listQuickFix = async () => {
    return await api.get("/quick-fix");
};

export const createQuickFix = async (token, value) => {
    return await api.post("/quick-fix", value, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const updateQuickFix = async (token, id, value) => {
    return await api.put(
        "/quick-fix/" + id,
        value,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};

export const removeQuickFix = async (token, id) => {
    return await api.delete("/quick-fix/" + id, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const readQuickFix = async (id) => {
    return await api.get("/quick-fix/" + id);
}
