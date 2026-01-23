import React, { useEffect } from 'react'

import AppRoutes from './routes/AppRoutes'
import { ToastContainer, toast } from 'react-toastify'

import 'react-toastify/dist/ReactToastify.css'
import socket from './utils/socket'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const App = () => {
    useEffect(() => {
        socket.on('connect', () => {
            console.log('Socket Connected:', socket.id);
        });

        socket.on('server:new-ticket', (data) => {
            toast.info(`New Ticket: ${data.title}`);
        });

        socket.on('server:update-ticket', (data) => {
            toast.info(`Ticket Updated: ${data.title} (${data.status})`);
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
