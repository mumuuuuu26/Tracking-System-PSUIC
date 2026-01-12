import axios from "axios";

export const createAppointment = async (token, data) => {
    return await axios.post(`${import.meta.env.VITE_API_URL}/appointment/create`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const getAvailableSlots = async (token, date, itId) => {
    return await axios.get(`${import.meta.env.VITE_API_URL}/appointment/slots`, {
        params: { date, itId },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const getITAvailability = async (token, start, end) => {
    return await axios.get(`${import.meta.env.VITE_API_URL}/appointment/availability`, {
        params: { start, end },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};
