// client/src/api/psuAuth.js
import api from '../utils/axios'
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
    return await api.post('/auth/psu-passport/callback', {
        code,
        redirect_uri: PSU_PASSPORT_CONFIG.redirectUri
    })
}
