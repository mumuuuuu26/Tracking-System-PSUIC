import axios from 'axios'

export const listAllTickets = async (token) => {
    return await axios.get('/api/ticket/all', {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const updateTicketStatus = async (token, id, value) => {
    return await axios.put('/api/ticket/' + id, value, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const removeTicket = async (token, id) => {
    return await axios.delete('/api/ticket/' + id, {
        headers: { Authorization: `Bearer ${token}` }
    })
}
