import api from '../utils/axios';

export const getMonthlyStats = async (month, year) => {
    return await api.get(`/reports/monthly`, {
        params: { month, year }
    });
};

export const getAnnualStats = async (year) => {
    return await api.get(`/reports/annual`, {
        params: { year }
    });
};

export const getEquipmentStats = async (month, year) => {
    return await api.get(`/reports/equipment`, {
        params: { month, year }
    });
};

export const getITPerformance = async (startDate, endDate) => {
    return await api.get(`/reports/performance`, {
        params: { startDate, endDate }
    });
};

export const getSubComponentStats = async (month, year) => {
    return await api.get(`/reports/subcomponents`, {
        params: { month, year }
    });
};



export const getRoomStats = async (month, year) => {
    return await api.get(`/reports/room`, {
        params: { month, year }
    });
};
