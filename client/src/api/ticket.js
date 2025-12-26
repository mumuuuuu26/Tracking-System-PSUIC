import axios from 'axios'

export const createTicket = async (token, form) => {
    return await axios.post('/api/ticket', form, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const listMyTickets = async (token) => {
    return await axios.get('/api/ticket', {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const getTicket = async (token, id) => {
    return await axios.get('/api/ticket/' + id, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const listTicketsByEquipment = async (token, id) => {
    return await axios.get('/api/ticket/equipment/' + id, {
        headers: { Authorization: `Bearer ${token}` }
    })
}
