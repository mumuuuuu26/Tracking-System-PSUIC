import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { login, currentUser } from '../api/auth'

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,

            actionLogin: async (form) => {
                try {
                    const res = await login(form)
                    set({
                        user: res.data.payload,
                        token: res.data.token
                    })
                    return res
                } catch (err) {
                    throw err
                }
            },

            actionLogout: () => {
                set({ user: null, token: null })
                localStorage.removeItem('auth-store')
            },

            checkUser: async () => {
                try {
                    const token = get().token
                    if (!token) return
                    const res = await currentUser(token)
                    set({ user: res.data }) // [New] Update user data (name, picture, etc.)
                } catch (err) {
                    console.log('Token invalid or expired', err)
                    get().actionLogout()
                }
            }
        }),
        {
            name: 'auth-store',
            storage: createJSONStorage(() => localStorage)
        }
    )
)

export default useAuthStore
