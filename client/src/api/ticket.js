import api from '../utils/axios'

export const createTicket = async (form) => {
    return await api.post('/ticket', form)
}

export const listMyTickets = async () => {
    return await api.get('/ticket')
}

export const getTicket = async (id) => {
    return await api.get('/ticket/' + id)
}

export const listTicketsByEquipment = async (id) => {
    return await api.get('/ticket/equipment/' + id)
}



export const getAllTickets = async (params = {}) => {
    return await api.get('/ticket/all', {
        params
    })
}

// Get Ticket History with Filters
export const getTicketHistory = async (params = {}) => {
    return await api.get('/ticket/history', {
        params
    });
}
