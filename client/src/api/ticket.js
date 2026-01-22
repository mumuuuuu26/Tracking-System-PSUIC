import axios from 'axios'

export const createTicket = async (token, form) => {
    return await axios.post(`${import.meta.env.VITE_API_URL}/ticket`, form, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const listMyTickets = async (token) => {
    return await axios.get(`${import.meta.env.VITE_API_URL}/ticket`, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const getTicket = async (token, id) => {
    return await axios.get(`${import.meta.env.VITE_API_URL}/ticket/` + id, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const listTicketsByEquipment = async (token, id) => {
    return await axios.get(`${import.meta.env.VITE_API_URL}/ticket/equipment/` + id, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const submitFeedback = async (token, id, data) => {
    return await axios.post(`${import.meta.env.VITE_API_URL}/ticket/${id}/feedback`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const getAllTickets = async (token) => {
    return await axios.get(`${import.meta.env.VITE_API_URL}/ticket/all`, {
        headers: { Authorization: `Bearer ${token}` }
    })
}
