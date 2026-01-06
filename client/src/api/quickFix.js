import axios from "axios";

export const listQuickFixes = async (token) => {
    return await axios.get("/api/quick-fix", {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const createQuickFix = async (token, data) => {
    return await axios.post("/api/quick-fix", data, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const updateQuickFix = async (token, id, data) => {
    return await axios.put("/api/quick-fix/" + id, data, {
        headers: { Authorization: `Bearer ${token}` },
    });
};

export const removeQuickFix = async (token, id) => {
    return await axios.delete("/api/quick-fix/" + id, {
        headers: { Authorization: `Bearer ${token}` },
    });
};
