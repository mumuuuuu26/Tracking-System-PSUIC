// client/src/api/psuAuth.js
import axios from 'axios'
import { PSU_PASSPORT_CONFIG } from '../config/psuPassport'

export const initiatePSULogin = () => {
    const params = new URLSearchParams({
        client_id: PSU_PASSPORT_CONFIG.clientId,
        redirect_uri: PSU_PASSPORT_CONFIG.redirectUri,
        response_type: 'code',
        scope: PSU_PASSPORT_CONFIG.scope
    })
    
    window.location.href = `${PSU_PASSPORT_CONFIG.authorizationUrl}?${params}`
}

export const exchangeCodeForToken = async (code) => {
    return await axios.post('/api/auth/psu-passport/callback', {
        code,
        redirect_uri: PSU_PASSPORT_CONFIG.redirectUri
    })
}