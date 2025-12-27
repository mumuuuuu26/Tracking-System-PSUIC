import axios from 'axios'

export const updateProfileImage = async (token, imageBase64) => {
    return await axios.post('/api/users/update-image', { image: imageBase64 }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}

export const listUsers = async (token, params = {}) => {
    return await axios.get('/api/users', {
        params,
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const changeStatus = async (token, value) => {
    return await axios.post('/api/users/change-status', value, {
        headers: { Authorization: `Bearer ${token}` }
    })
}

export const changeRole = async (token, value) => {
    return await axios.post('/api/users/change-role', value, {
        headers: { Authorization: `Bearer ${token}` }
    })
}
