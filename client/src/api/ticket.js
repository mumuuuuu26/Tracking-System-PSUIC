import api from '../utils/axios'

export const createTicket = async (token, form) => {
    return await api.post('/ticket', form, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const listMyTickets = async (token) => {
    return await api.get('/ticket', {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const getTicket = async (token, id) => {
    return await api.get('/ticket/' + id, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const listTicketsByEquipment = async (token, id) => {
    return await api.get('/ticket/equipment/' + id, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const submitFeedback = async (token, id, data) => {
    return await api.post(`/ticket/${id}/feedback`, data, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

export const getAllTickets = async (token, params = {}) => {
    return await api.get('/ticket/all', {
        headers: { Authorization: `Bearer ${token}` },
        params
    })
}

// Get Ticket History with Filters
export const getTicketHistory = async (token, params = {}) => {
    return await api.get('/ticket/history', {
        headers: { Authorization: `Bearer ${token}` },
        params
    });
}
