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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <MainNav />
            <div className="flex-1 flex container mx-auto p-4 gap-6">
                <aside className="w-64 hidden md:block shrink-0">
                    <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                A
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold">Hello!</p>
                                <p className="font-bold text-gray-800">ADMIN</p>
                            </div>
                        </div>

                        <nav className="space-y-1">
                            <a href="/admin" className="block px-4 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors">
                                Dashboard
                            </a>
                            <a href="/admin/tickets" className="block px-4 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors">
                                All Tickets
                            </a>
                            <a href="/admin/manage-users" className="block px-4 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors">
                                User Management
                            </a>
                            <a href="/admin/manage-it" className="block px-4 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors">
                                IT Staff
                            </a>
                            <a href="/admin/manage-rooms" className="block px-4 py-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-600 font-medium transition-colors">
                                Rooms
                            </a>
                        </nav>
                    </div>
                </aside>

                <main className="flex-1 min-w-0">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default LayoutAdmin
