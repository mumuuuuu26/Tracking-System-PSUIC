import api from '../utils/axios'

export const updateProfileImage = async (imageBase64) => {
    return await api.post('/users/update-image', { image: imageBase64 })
}

export const updateProfile = async (value) => {
    return await api.post('/users/update-profile', value)
}


export const listUsers = async (params = {}) => {
    return await api.get('/users', {
        params
    })
}



export const changeStatus = async (value) => {
    return await api.post('/users/change-status', value)
}

export const changeRole = async (value) => {
    return await api.post('/users/change-role', value)
}

// Create User (Admin Invite) - [NEW]
export const createUser = async (form) => {
    return await api.post('/users', form)
}

export const updateUser = async (id, form) => {
    return await api.put('/users/' + id, form)
}

export const removeUser = async (id) => {
    return await api.delete('/users/' + id)
}

