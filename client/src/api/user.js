import axios from 'axios'

export const updateProfileImage = async (token, imageBase64) => {
    return await axios.post('/api/users/update-image', { image: imageBase64 }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
}
