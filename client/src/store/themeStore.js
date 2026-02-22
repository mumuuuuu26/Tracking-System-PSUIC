import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
    persist(
        (set) => ({
            isDarkMode: false, // Default to light mode (false), or default to dark mode based on user preference
            toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
            setDarkMode: (value) => set({ isDarkMode: value }),
        }),
        {
            name: 'theme-storage', // name of item in the storage (must be unique)
        }
    )
);

export default useThemeStore;
