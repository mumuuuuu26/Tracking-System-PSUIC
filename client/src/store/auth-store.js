import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { login, currentUser } from '../api/auth'

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            hasHydrated: false,

            setHasHydrated: (state) => {
                set({
                    hasHydrated: state
                });
            },

            actionLogin: async (form) => {
                const res = await login(form)
                    set({
                        user: res.data.payload,
                        token: res.data.token
                    })
                    return res
            },

            actionLogout: () => {
                set({ user: null, token: null })
                localStorage.removeItem('auth-store')
            },

            checkUser: async () => {
                try {
                    const token = get().token
                    if (!token) return
                    const res = await currentUser()
                    set({ user: res.data }) // [New] Update user data (name, picture, etc.)
                } catch (err) {
                    console.error('Token invalid or expired', err)
                    get().actionLogout()
                }
            }
        }),
        {
            name: 'auth-store',
            storage: createJSONStorage(() => localStorage),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.setHasHydrated(true)
                }
            }
        }
    )
)

export default useAuthStore
