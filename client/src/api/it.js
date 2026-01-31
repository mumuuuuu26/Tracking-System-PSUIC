import axios from "axios";

// Get dashboard statistics
export const getStats = async (token) => {
    return await axios.get(`${import.meta.env.VITE_API_URL}/it/stats`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Get IT tasks
export const getMyTasks = async (token) => {
    return await axios.get(`${import.meta.env.VITE_API_URL}/it/tasks`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};



// Accept job
export const previewJob = async (token, id) => {
    return await axios.get(`http://localhost:5001/api/it/job/${id}/preview`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const acceptJob = async (token, id) => {
    return await axios.put(
        `${import.meta.env.VITE_API_URL}/it/accept/${id}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};

export const rejectJob = async (token, id, reason) => {
    return await axios.put(
        `${import.meta.env.VITE_API_URL}/it/reject/${id}`,
        { reason },
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
};



// Close job
export const closeJob = async (token, id, data) => {
    return await axios.put(`${import.meta.env.VITE_API_URL}/it/close/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Save Draft (Checklist & Notes)
export const saveDraft = async (token, id, data) => {
    return await axios.put(`${import.meta.env.VITE_API_URL}/it/draft/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};



// Get history
export const getHistory = async (token) => {
    return await axios.get(`${import.meta.env.VITE_API_URL}/it/history`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Email Settings
export const getEmailTemplates = async (token) => {
    return await axios.get(`${import.meta.env.VITE_API_URL}/it/email-templates`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const updateEmailTemplate = async (token, id, data) => {
    return await axios.put(`${import.meta.env.VITE_API_URL}/it/email-templates/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// Get public schedule
export const getPublicSchedule = async (token) => {
    return await axios.get(`${import.meta.env.VITE_API_URL}/it/public-schedule`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const syncGoogleCalendar = async (token) => {
    return await axios.post(`${import.meta.env.VITE_API_URL}/it/google-sync`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
