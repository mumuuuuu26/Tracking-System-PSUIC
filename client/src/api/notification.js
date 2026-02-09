import api from '../utils/axios'

export const listNotifications = async (token) => {
    return await api.get('/notifications', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}

export const markRead = async (token, id) => {
    return await api.put(`/notification/${id}/read`, {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}

export const removeNotification = async (token, id) => {
    return await api.delete(`/notification/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}
