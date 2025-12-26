import axios from 'axios'

export const getMyTasks = async (token) => {
    return await axios.get('/api/it/tasks', {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const acceptJob = async (token, id) => {
    return await axios.put('/api/it/accept/' + id, {}, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const closeJob = async (token, id, form) => {
    return await axios.put('/api/it/close/' + id, form, {
        headers: { Authorization: `Bearer ${token}` }
    })
}
