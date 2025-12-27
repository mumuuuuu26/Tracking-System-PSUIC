import React, { useEffect, useState } from 'react'
import { listAllTickets, updateTicketStatus, removeTicket } from '../../api/admin'
import useAuthStore from '../../store/auth-store'
import dayjs from 'dayjs'
import { toast } from 'react-toastify'

const AllTickets = () => {
    const { token } = useAuthStore()
    const [tickets, setTickets] = useState([])

    useEffect(() => {
        loadTickets()
    }, [])

    const loadTickets = async () => {
        try {
            const res = await listAllTickets(token)
            setTickets(res.data)
        } catch (err) {
            console.log(err)
        }
    }

    const handleStatusChange = async (id, status) => {
        try {
            await updateTicketStatus(token, id, { status })
            toast.success('Status Updated')
            loadTickets()
        } catch (err) {
            toast.error('Update Failed')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure?')) return
        try {
            await removeTicket(token, id)
            toast.success('Ticket Deleted')
            loadTickets()
        } catch (err) {
            toast.error('Delete Failed')
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-200 text-yellow-800'
            case 'in_progress': return 'bg-blue-200 text-blue-800'
            case 'fixed': return 'bg-green-200 text-green-800'
            default: return 'bg-gray-200 text-gray-800'
        }
    }

    return (
        <div className="bg-white p-6 rounded shadow">
            <h1 className="text-2xl font-bold mb-6">All Tickets</h1>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tickets.map((item) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap font-medium">{item.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.user?.email || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {dayjs(item.createdAt).format('DD/MM/YYYY')}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                    <select
                                        value={item.status}
                                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                        className="border rounded px-2 py-1 text-xs"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="fixed">Fixed</option>
                                    </select>
                                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default AllTickets
