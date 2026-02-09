import api from '../utils/axios'

export const updateProfileImage = async (token, imageBase64) => {
    return await api.post('/users/update-image', { image: imageBase64 }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}

export const updateProfile = async (token, value) => {
    return await api.post('/users/update-profile', value, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}


export const listUsers = async (token, params = {}) => {
    return await api.get('/users', {
        params,
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const listITStaff = async (token) => {
    return await api.get('/users/it-staff', {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const changeStatus = async (token, value) => {
    return await api.post('/users/change-status', value, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const changeRole = async (token, value) => {
    return await api.post('/users/change-role', value, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

// Create User (Admin Invite) - [NEW]
export const createUser = async (token, form) => {
    return await api.post('/users', form, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}

export const updateUser = async (token, id, form) => {
    return await api.put('/users/' + id, form, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const removeUser = async (token, id) => {
    return await api.delete('/users/' + id, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

