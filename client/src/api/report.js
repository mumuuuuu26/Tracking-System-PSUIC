import api from '../utils/axios';

export const getMonthlyStats = async (token, month, year) => {
    return await api.get(`/reports/monthly`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month, year }
    });
};

export const getAnnualStats = async (token, year) => {
    return await api.get(`/reports/annual`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { year }
    });
};

export const getEquipmentStats = async (token) => {
    return await api.get(`/reports/equipment`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const getITPerformance = async (token) => {
    return await api.get(`/reports/performance`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const getSatisfactionStats = async (token) => {
    return await api.get(`/reports/satisfaction`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
