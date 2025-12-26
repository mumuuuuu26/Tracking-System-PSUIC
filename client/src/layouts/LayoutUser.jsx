import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import MainNav from '../components/MainNav'
import useAuthStore from '../store/auth-store'

const LayoutUser = () => {
    const { user } = useAuthStore()

    if (!user) {
        return <Navigate to="/login" />
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <MainNav />
            <div className="flex flex-1 container mx-auto p-4 gap-4">
                {/* Sidebar for User */}
                <aside className="w-64 bg-white shadow rounded-lg p-4 h-fit hidden md:block">
                    <h2 className="font-bold mb-4 text-slate-700">User Menu</h2>
                    <ul className="space-y-2">
                        <li><a href="/user" className="block text-slate-600 hover:text-blue-600">Dashboard</a></li>
                        <li><a href="/user/create-ticket" className="block text-slate-600 hover:text-blue-600">Create Ticket</a></li>
                        <li><a href="/user/my-tickets" className="block text-slate-600 hover:text-blue-600">My History</a></li>
                    </ul>
                </aside>

                <main className="flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default LayoutUser
