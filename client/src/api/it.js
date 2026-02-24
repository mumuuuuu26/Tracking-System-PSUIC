import api from "../utils/axios";

// Get dashboard statistics
export const getStats = async () => {
    return await api.get('/it/stats');
};

// Get IT tasks
export const getMyTasks = async () => {
    return await api.get('/it/tasks');
};



// Accept job
export const previewJob = async (id) => {
    return await api.get(`/it/job/${id}/preview`);
};

export const acceptJob = async (id) => {
    return await api.put(`/it/accept/${id}`, {});
};

export const rejectJob = async (id, reason) => {
    return await api.put(`/it/reject/${id}`, { reason });
};



// Close job
export const closeJob = async (id, data) => {
    return await api.put(`/it/close/${id}`, data);
};

// Save Draft (Checklist & Notes)
export const saveDraft = async (id, data) => {
    return await api.put(`/it/draft/${id}`, data);
};



// Get history
export const getHistory = async () => {
    return await api.get('/it/history');
};


// Get public schedule
export const getPublicSchedule = async () => {
    return await api.get('/it/public-schedule');
};

export const syncGoogleCalendar = async (options = {}) => {
    const force = Boolean(options.force);
    return await api.post('/it/google-sync', { force });
};

export const testGoogleSync = async () => {
    return await api.get('/it/test-google-sync');
};
