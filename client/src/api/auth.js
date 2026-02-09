import api from '../utils/axios'

// Register
export const register = async (form) => {
    return await api.post('/register', form)
}

// Login
export const login = async (form) => {
    return await api.post('/login', form)
}

// Get Current User
export const currentUser = async (token) => {
    return await api.post('/current-user', {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}

// Get Current Admin
export const currentAdmin = async (token) => {
    return await api.post('/current-admin', {}, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}

