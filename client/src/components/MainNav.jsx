import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/auth-store'
import Swal from 'sweetalert2'

const MainNav = () => {
    const { user, actionLogout } = useAuthStore()
    const navigate = useNavigate()

    const handleLogout = () => {
        Swal.fire({
            title: 'Log out',
            text: "Are you sure you want to log out?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Log out',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                actionLogout()
                navigate('/')
            }
        })
    }

    return (
        <nav className="bg-slate-900 text-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                <Link to="/" className="text-xl font-bold flex items-center gap-2">
                    🛠️ PSUIC Service
                </Link>

                <div className="flex gap-4 items-center">
                    {user ? (
                        <>
                            <span className="text-slate-300 text-sm">Welcome, {user.email}</span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <div className="flex gap-2">
                            <Link to="/login" className="hover:text-blue-300">Login</Link>
                            <Link to="/register" className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition">Register</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}

export default MainNav
