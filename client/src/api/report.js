import axios from 'axios';

export const getMonthlyStats = async (token, month, year) => {
    return await axios.get(`http://localhost:5001/api/reports/monthly`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { month, year }
    });
};

export const getAnnualStats = async (token, year) => {
    return await axios.get(`http://localhost:5001/api/reports/annual`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { year }
    });
};

export const getEquipmentStats = async (token) => {
    return await axios.get(`http://localhost:5001/api/reports/equipment`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const getITPerformance = async (token) => {
    return await axios.get(`http://localhost:5001/api/reports/performance`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

export const getSatisfactionStats = async (token) => {
    return await axios.get(`http://localhost:5001/api/reports/satisfaction`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};
