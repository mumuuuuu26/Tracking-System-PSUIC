import axios from "axios";

export const listQuickFix = async () => {
    return await axios.get(import.meta.env.VITE_API_URL + "/quick-fix");
};

export const createQuickFix = async (token, value) => {
    return await axios.post(import.meta.env.VITE_API_URL + "/quick-fix", value, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const updateQuickFix = async (token, id, value) => {
    return await axios.put(
        import.meta.env.VITE_API_URL + "/quick-fix/" + id,
        value,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};

export const removeQuickFix = async (token, id) => {
    return await axios.delete(import.meta.env.VITE_API_URL + "/quick-fix/" + id, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const readQuickFix = async (id) => {
    return await axios.get(import.meta.env.VITE_API_URL + "/quick-fix/" + id);
}
