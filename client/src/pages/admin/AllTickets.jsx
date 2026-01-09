import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listAllTickets, removeTicket } from '../../api/admin'
import useAuthStore from '../../store/auth-store'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime';
import { toast } from 'react-toastify'
import { Search, MapPin, User, Clock, Trash2, Eye } from 'lucide-react'

dayjs.extend(relativeTime);

const AllTickets = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { token } = useAuthStore()
    const [tickets, setTickets] = useState([])
    const [filteredTickets, setFilteredTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')

    useEffect(() => {
        loadTickets()
        const query = searchParams.get('search')
        if (query) {
            setSearchTerm(query)
        }
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
                item.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.assignedTo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setFilteredTickets(temp)
    }

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Prevent card click
        if (!window.confirm('Are you sure you want to delete this ticket?')) return
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
            case "pending":
                return "border-l-4 border-yellow-400 bg-yellow-50";
            case "in_progress":
                return "border-l-4 border-blue-400 bg-blue-50";
            case "fixed":
                return "border-l-4 border-green-400 bg-green-50";
            case "rejected":
                return "border-l-4 border-red-400 bg-red-50";
            default:
                return "border-l-4 border-gray-400 bg-gray-50";
        }
    };

    const getUrgencyBadge = (urgency) => {
        switch (urgency) {
            case "Critical": return "bg-red-100 text-red-700";
            case "High": return "bg-orange-100 text-orange-700";
            case "Medium": return "bg-yellow-100 text-yellow-700";
            default: return "bg-green-100 text-green-700";
        }
    };

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
                            {['all', 'pending', 'in_progress', 'fixed', 'rejected'].map((status) => (
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

            {/* Content - Grid View */}
            <div className="max-w-7xl mx-auto px-4">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-white rounded-xl shadow-sm animate-pulse border border-gray-100"></div>)}
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                onClick={() => navigate(`/admin/ticket/${ticket.id}`)}
                                className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full relative group ${getStatusColor(ticket.status)}`}
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-blue-600 font-bold text-sm">
                                            #TK-{String(ticket.id).padStart(4, "0")}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getUrgencyBadge(ticket.urgency)}`}>
                                            {ticket.urgency}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">
                                        {dayjs(ticket.createdAt).fromNow()}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-1">{ticket.title}</h3>

                                {/* Meta Info */}
                                <div className="flex flex-col gap-1 text-xs text-gray-600 mb-4 flex-1">
                                    {ticket.room && (
                                        <div className="flex items-center gap-1.5">
                                            <MapPin size={14} />
                                            <span className="truncate">{ticket.room.roomNumber} (Fl. {ticket.room.floor})</span>
                                        </div>
                                    )}
                                    {ticket.createdBy && (
                                        <div className="flex items-center gap-1.5 mt-1">
                                            <User size={14} />
                                            <span className="truncate font-medium text-gray-700">
                                                Reported by: {ticket.createdBy.name || ticket.createdBy.username}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Status & Assigned To */}
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${ticket.status === "pending" ? "bg-yellow-400" :
                                            ticket.status === "in_progress" ? "bg-blue-400" :
                                                ticket.status === "rejected" ? "bg-red-400" :
                                                    "bg-green-400"
                                            }`} />
                                        <span className="text-sm font-semibold text-gray-700 capitalize">
                                            {ticket.status.replace("_", " ")}
                                        </span>
                                    </div>

                                    {ticket.assignedTo ? (
                                        <div className="flex items-center gap-2 bg-gray-50 px-2 py-1 rounded-full">
                                            <img
                                                src={ticket.assignedTo.picture || `https://ui-avatars.com/api/?name=${ticket.assignedTo.name}&background=random`}
                                                alt={ticket.assignedTo.name}
                                                className="w-6 h-6 rounded-full"
                                            />
                                            <span className="text-xs text-gray-600 font-medium truncate max-w-[80px]">
                                                {ticket.assignedTo.name?.split(' ')[0]}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="px-2 py-1 bg-gray-50 rounded-full text-xs text-gray-400 italic">
                                            Unassigned
                                        </div>
                                    )}
                                </div>

                                {/* Delete Button - Admin Only Action */}
                                <button
                                    onClick={(e) => handleDelete(e, ticket.id)}
                                    className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete Ticket"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AllTickets
