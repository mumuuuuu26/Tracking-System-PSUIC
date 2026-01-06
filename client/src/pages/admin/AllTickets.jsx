import React, { useEffect, useState } from 'react'
import { listAllTickets, updateTicketStatus, removeTicket } from '../../api/admin'
import useAuthStore from '../../store/auth-store'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime';
import { toast } from 'react-toastify'
import { Search, Filter, Trash2, CheckCircle, Clock, AlertCircle, X, ChevronDown, User, Shield } from 'lucide-react'

dayjs.extend(relativeTime);

const AllTickets = () => {
    const { token } = useAuthStore()
    const [tickets, setTickets] = useState([])
    const [filteredTickets, setFilteredTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')

    useEffect(() => {
        loadTickets()
    }, [])

    useEffect(() => {
        filterTickets()
    }, [searchTerm, filterStatus, tickets])

    const loadTickets = async () => {
        try {
            setLoading(true)
            const res = await listAllTickets(token)
            setTickets(res.data)
            setFilteredTickets(res.data)
        } catch (err) {
            console.log(err)
            toast.error('Failed to load tickets')
        } finally {
            setLoading(false)
        }
    }

    const filterTickets = () => {
        let temp = [...tickets]

        if (filterStatus !== 'all') {
            temp = temp.filter(item => item.status === filterStatus)
        }

        if (searchTerm) {
            temp = temp.filter(item =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                String(item.id).includes(searchTerm) ||
                item.createdBy?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setFilteredTickets(temp)
    }

    const handleStatusChange = async (id, status) => {
        try {
            await updateTicketStatus(token, id, { status })
            toast.success(`Ticket #${id} updated to ${status}`)
            loadTickets()
        } catch (err) {
            toast.error('Update Failed')
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this ticket?')) return
        try {
            await removeTicket(token, id)
            toast.success('Ticket Deleted')
            loadTickets()
        } catch (err) {
            toast.error('Delete Failed')
        }
    }

    const getStatusStyle = (status) => {
        switch (status) {
            case 'pending': return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: <Clock size={14} /> };
            case 'in_progress': return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: <AlertCircle size={14} /> };
            case 'fixed': return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: <CheckCircle size={14} /> };
            default: return { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-100', icon: <AlertCircle size={14} /> };
        }
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 pt-8 pb-6 px-4 mb-8 sticky top-0 z-20 bg-opacity-90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Ticket Management</h1>
                            <p className="text-gray-500 text-sm mt-1">Manage all support tickets in one place</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100">
                                Total: {tickets.length}
                            </div>
                            <div className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold border border-amber-100">
                                Pending: {tickets.filter(t => t.status === 'pending').length}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search tickets by title, ID, or user..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                            {['all', 'pending', 'in_progress', 'fixed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap ${filterStatus === status
                                        ? 'bg-gray-900 text-white shadow-md'
                                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-20 bg-white rounded-xl shadow-sm animate-pulse border border-gray-100"></div>)}
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No tickets found</h3>
                        <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-visible">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50/50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredTickets.map((ticket) => {
                                        const statusStyle = getStatusStyle(ticket.status);
                                        return (
                                            <tr key={ticket.id} className="hover:bg-blue-50/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <span className="text-xs font-mono font-bold text-gray-400">#{String(ticket.id).padStart(4, '0')}</span>
                                                        <p className="font-bold text-gray-800 text-sm">{ticket.title}</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 uppercase overflow-hidden border border-gray-100">
                                                            {ticket.createdBy?.picture
                                                                ? <img src={ticket.createdBy.picture} alt="" className="w-full h-full object-cover" />
                                                                : (ticket.createdBy?.email?.[0] || 'U')
                                                            }
                                                        </div>
                                                        <div className="max-w-[150px]">
                                                            <p className="text-sm font-bold text-gray-700 truncate">{ticket.createdBy?.name || ticket.createdBy?.username || "Unknown Name"}</p>
                                                            <p className="text-xs text-gray-400 truncate">{ticket.createdBy?.email || "Unknown Email"}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="relative inline-block">
                                                        <select
                                                            value={ticket.status}
                                                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                                                            className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500/20 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                                                        >
                                                            <option value="pending">Pending</option>
                                                            <option value="in_progress">In Progress</option>
                                                            <option value="fixed">Fixed</option>
                                                        </select>
                                                        <ChevronDown size={14} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${statusStyle.text}`} />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-gray-600">{dayjs(ticket.createdAt).format('DD MMM YYYY')}</p>
                                                    <p className="text-xs text-gray-400">{dayjs(ticket.createdAt).fromNow()}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDelete(ticket.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete Ticket"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="md:hidden space-y-4">
                            {filteredTickets.map((ticket) => {
                                const statusStyle = getStatusStyle(ticket.status);
                                return (
                                    <div key={ticket.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 bg-gray-100 rounded text-[10px] font-mono font-bold text-gray-500">
                                                    #{String(ticket.id).padStart(4, '0')}
                                                </span>
                                                <span className="text-xs text-gray-400">{dayjs(ticket.createdAt).fromNow()}</span>
                                            </div>
                                            <div className="relative">
                                                <select
                                                    value={ticket.status}
                                                    onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                                                    className={`appearance-none pl-3 pr-7 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wide cursor-pointer focus:outline-none ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="in_progress">Processing</option>
                                                    <option value="fixed">Fixed</option>
                                                </select>
                                                <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${statusStyle.text}`} />
                                            </div>
                                        </div>

                                        <h3 className="font-bold text-gray-800 text-lg mb-1">{ticket.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold overflow-hidden border border-gray-100">
                                                {ticket.createdBy?.picture
                                                    ? <img src={ticket.createdBy.picture} alt="" className="w-full h-full object-cover" />
                                                    : (ticket.createdBy?.email?.[0] || 'U')
                                                }
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-700">{ticket.createdBy?.name || ticket.createdBy?.username || "Unknown"}</span>
                                                <span className="text-[10px] text-gray-400">{ticket.createdBy?.email}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                            <span className="text-xs text-gray-400 font-medium">
                                                {dayjs(ticket.createdAt).format('DD MMM YYYY, HH:mm')}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(ticket.id)}
                                                className="flex items-center gap-1 text-red-500 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                                            >
                                                <Trash2 size={14} /> Delete
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default AllTickets
