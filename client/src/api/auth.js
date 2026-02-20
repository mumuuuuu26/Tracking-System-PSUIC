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
export const currentUser = async () => {
    return await api.post('/current-user', {})
}

// Get Current Admin
export const currentAdmin = async () => {
    return await api.post('/current-admin', {})
}

