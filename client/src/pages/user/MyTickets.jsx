import React, { useEffect, useState } from 'react'
import { listMyTickets } from '../../api/ticket'
import useAuthStore from '../../store/auth-store'
import { Link } from 'react-router-dom'
import dayjs from 'dayjs'

const MyTickets = () => {
    const { token } = useAuthStore()
    const [tickets, setTickets] = useState([])

    useEffect(() => {
        loadTickets()
    }, [])

    const loadTickets = async () => {
        try {
            const res = await listMyTickets(token)
            setTickets(res.data)
        } catch (err) {
            console.log(err)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-200 text-yellow-800'
            case 'in_progress': return 'bg-blue-200 text-blue-800' // Assuming backend uses 'in_progress' or similar
            case 'fixed': return 'bg-green-200 text-green-800'
            default: return 'bg-gray-200 text-gray-800'
        }
    }

    return (
        <div className="bg-white p-6 rounded shadow">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">My Tickets</h1>
                <Link to="/user/create-ticket" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    New Ticket
                </Link>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tickets.map((item) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{item.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {dayjs(item.createdAt).format('DD/MM/YYYY')}
                                </td>
                            </tr>
                        ))}
                        {tickets.length === 0 && (
                            <tr>
                                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">No tickets found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default MyTickets
