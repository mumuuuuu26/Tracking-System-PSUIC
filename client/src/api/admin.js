import axios from 'axios'

export const listAllTickets = async (token, params = {}) => {
    return await axios.get('/api/ticket/all', {
        headers: { Authorization: `Bearer ${token}` },
        params // { page, limit, search, status }
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

export const getDashboardStats = async (token) => {
    return await axios.get('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const getITStaff = async (token) => {
    return await axios.get('/api/admin/it-staff', {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const getITStaffStats = async (token) => {
    return await axios.get('/api/admin/it-staff/stats', {
        headers: { Authorization: `Bearer ${token}` }
    })
}
