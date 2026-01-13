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

// Get today's appointments
export const getTodayAppointments = async (token) => {
    return await axios.get(`${import.meta.env.VITE_API_URL}/it/appointments/today`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Accept job
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

// Reject ticket
export const rejectTicket = async (token, id, data) => {
    return await axios.put(`${import.meta.env.VITE_API_URL}/it/reject/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
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

// Reschedule appointment
export const rescheduleAppointment = async (token, data) => {
    return await axios.post(`${import.meta.env.VITE_API_URL}/it/reschedule`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Get schedule
export const getSchedule = async (token, date) => {
    return await axios.get(`${import.meta.env.VITE_API_URL}/it/schedule`, {
        params: { date },
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
