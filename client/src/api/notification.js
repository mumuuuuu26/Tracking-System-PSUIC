import api from '../utils/axios'

export const listNotifications = async () => {
    return await api.get('/notifications')
}

export const markRead = async (id) => {
    return await api.put(`/notification/${id}/read`, {})
}

export const removeNotification = async (id) => {
    return await api.delete(`/notification/${id}`)
}
