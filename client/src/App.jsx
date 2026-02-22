import React, { useEffect } from 'react'

import AppRoutes from './routes/AppRoutes'
import { ToastContainer, toast } from 'react-toastify'

import 'react-toastify/dist/ReactToastify.css'
import socket from './utils/socket'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import useThemeStore from './store/themeStore'

dayjs.extend(relativeTime)

const App = () => {
    const isDarkMode = useThemeStore((state) => state.isDarkMode);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    useEffect(() => {
        socket.on('connect', () => {

        });

        socket.on('server:new-ticket', (data) => {
            toast.info(`New Ticket: ${data.title}`);
        });

        // [BUG FIX] Removed toast from server:update-ticket — it was noisy for ALL users.
        // User-specific notifications are handled by the in-app notification system.
        socket.on('server:update-ticket', () => {
            // Silent: triggers real-time data refresh on subscribed pages without toast noise
        });

        return () => {
            socket.off('connect');
            socket.off('server:new-ticket');
            socket.off('server:update-ticket');
        };
    }, []);

    return (
        <>
            <ToastContainer />
            <AppRoutes />
        </>
    )
}


export default App
