import axios from 'axios';

export const createAppointment = async (token, data) => {
    return await axios.post('http://localhost:5001/api/appointment/create', data, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });
};

export const getAvailableSlots = async (token, date, itId) => {
    return await axios.get(`http://localhost:5001/api/appointment/slots`, {
        headers: {
            Authorization: `Bearer ${token}`
        },
        params: { date, itId }
    });
};
