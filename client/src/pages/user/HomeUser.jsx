import React from 'react'
import useAuthStore from '../../store/auth-store'

const HomeUser = () => {
    const { user } = useAuthStore()
    return (
        <div className="bg-white p-6 rounded shadow">
            <h1 className="text-2xl font-bold mb-4">User Dashboard</h1>
            <p>Welcome, {user?.email}.</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="/user/create-ticket" className="block p-4 bg-blue-50 border rounded hover:bg-blue-100">
                    <h3 className="font-bold text-blue-700">Report a Problem</h3>
                    <p className="text-sm text-slate-600">Create a new support ticket.</p>
                </a>
                <a href="/user/my-tickets" className="block p-4 bg-green-50 border rounded hover:bg-green-100">
                    <h3 className="font-bold text-green-700">My History</h3>
                    <p className="text-sm text-slate-600">View status of your reports.</p>
                </a>
            </div>
        </div>
    )
}

export default HomeUser
