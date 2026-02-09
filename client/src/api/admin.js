import api from '../utils/axios'

export const listAllTickets = async (token, params = {}) => {
    return await api.get('/ticket/all', {
        headers: { Authorization: `Bearer ${token}` },
        params // { page, limit, search, status }
    })
}

export const updateTicketStatus = async (token, id, value) => {
    return await api.put('/ticket/' + id, value, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const removeTicket = async (token, id) => {
    return await api.delete('/ticket/' + id, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const getDashboardStats = async (token) => {
    return await api.get('/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const getITStaff = async (token) => {
    return await api.get('/admin/it-staff', {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const getITStaffStats = async (token) => {
    return await api.get('/admin/it-staff/stats', {
        headers: { Authorization: `Bearer ${token}` }
    })
}

