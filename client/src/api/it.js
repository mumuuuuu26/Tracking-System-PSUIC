import api from "../utils/axios";

// Get dashboard statistics
export const getStats = async (token) => {
    return await api.get('/it/stats', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Get IT tasks
export const getMyTasks = async (token) => {
    return await api.get('/it/tasks', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};



// Accept job
export const previewJob = async (token, id) => {
    return await api.get(`/it/job/${id}/preview`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const acceptJob = async (token, id) => {
    return await api.put(
        `/it/accept/${id}`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
};

export const rejectJob = async (token, id, reason) => {
    return await api.put(
        `/it/reject/${id}`,
        { reason },
        {
            headers: { Authorization: `Bearer ${token}` },
        }
    );
};



// Close job
export const closeJob = async (token, id, data) => {
    return await api.put(`/it/close/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Save Draft (Checklist & Notes)
export const saveDraft = async (token, id, data) => {
    return await api.put(`/it/draft/${id}`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};



// Get history
export const getHistory = async (token) => {
    return await api.get('/it/history', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};


// Get public schedule
export const getPublicSchedule = async (token) => {
    return await api.get('/it/public-schedule', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const syncGoogleCalendar = async (token) => {
    return await api.post('/it/google-sync', {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const testGoogleSync = async (token) => {
    return await api.get('/it/test-google-sync', {
        headers: { Authorization: `Bearer ${token}` }
    });
};
