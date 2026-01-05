import axios from 'axios'

export const listNotifications = async (token) => {
    return await axios.get('/api/notifications', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}

export const markRead = async (token, id) => {
    return await axios.put(`/api/notification/${id}/read`, {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}

export const removeNotification = async (token, id) => {
    return await axios.delete(`/api/notification/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}
