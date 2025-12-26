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
                    // confirm token is valid, optional: update user info
                } catch (err) {
                    // if token invalid, logout
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
