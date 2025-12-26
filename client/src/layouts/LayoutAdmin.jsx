import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import MainNav from '../components/MainNav'
import useAuthStore from '../store/auth-store'

const LayoutAdmin = () => {
    const { user } = useAuthStore()

    if (!user || user.role !== 'admin') {
        return <Navigate to="/login" />
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-50">
            <MainNav />
            <div className="flex flex-1 container mx-auto p-4 gap-4">
                <aside className="w-64 bg-white shadow rounded-lg p-4 h-fit hidden md:block">
                    <h2 className="font-bold mb-4 text-slate-700">Admin Menu</h2>
                    <ul className="space-y-2">
                        <li><a href="/admin" className="block text-slate-600 hover:text-blue-600">Dashboard</a></li>
                        <li><a href="/admin/tickets" className="block text-slate-600 hover:text-blue-600">All Tickets</a></li>
                        <li><a href="/admin/users" className="block text-slate-600 hover:text-blue-600">Manage Users</a></li>
                    </ul>
                </aside>

                <main className="flex-1">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default LayoutAdmin
