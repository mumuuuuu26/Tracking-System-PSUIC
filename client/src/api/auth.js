import axios from 'axios'

// Register
export const register = async (form) => {
    return await axios.post('/api/register', form)
}

// Login
export const login = async (form) => {
    return await axios.post('/api/login', form)
}

// Get Current User
export const currentUser = async (token) => {
    return await axios.post('/api/current-user', {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}

// Get Current Admin
export const currentAdmin = async (token) => {
    return await axios.post('/api/current-admin', {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}
