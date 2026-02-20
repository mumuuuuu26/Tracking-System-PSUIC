import api from '../utils/axios'

export const listAllTickets = async (params = {}) => {
    return await api.get('/ticket/all', {
        params // { page, limit, search, status }
    })
}

export const updateTicketStatus = async (id, value) => {
    return await api.put('/ticket/' + id, value)
}

export const removeTicket = async (id) => {
    return await api.delete('/ticket/' + id)
}

export const getDashboardStats = async () => {
    return await api.get('/admin/stats')
}

// getITStaff removed

// getITStaffStats removed

