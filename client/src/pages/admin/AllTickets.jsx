import React, { useEffect, useState, useCallback } from 'react'
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

    const loadTickets = useCallback(async () => {
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
    }, [token])

    useEffect(() => {
        loadTickets()
        const query = searchParams.get('search')
        if (query) {
            setSearchTerm(query)
        }
    }, [loadTickets, searchParams])

    const filterTickets = useCallback(() => {
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


        // Sort by Work Process (Pending > In Progress > Scheduled > Fixed > Rejected)
        const statusWeight = {
            'pending': 1,
            'in_progress': 2,
            'scheduled': 3,
            'fixed': 4,
            'closed': 4,
            'rejected': 5
        };

        temp.sort((a, b) => {
            const weightA = statusWeight[a.status] || 99;
            const weightB = statusWeight[b.status] || 99;

            if (weightA !== weightB) {
                return weightA - weightB;
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        setFilteredTickets(temp)
    }, [tickets, filterStatus, searchTerm])

    useEffect(() => {
        filterTickets()
    }, [filterTickets])

    const handleDelete = async (e, id) => {
        e.stopPropagation(); // Prevent card click
        if (!window.confirm('Are you sure you want to delete this ticket?')) return
        try {
            await removeTicket(token, id)
            toast.success('Ticket Deleted')
            loadTickets()
        } catch {
            toast.error('Delete Failed')
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "border-l-amber-400 border-gray-100";
            case "in_progress":
                return "border-l-blue-400 border-gray-100";
            case "fixed":
            case "closed":
                return "border-l-green-400 border-gray-100";
            case "rejected":
                return "border-l-red-400 border-gray-100";
            default:
                return "border-l-gray-400 border-gray-100";
        }
    };

    const getUrgencyBadge = (urgency) => {
        switch (urgency) {
            case "High":
            case "Critical":
                return "bg-red-50 text-red-600 border border-red-100";
            case "Medium":
                return "bg-amber-50 text-amber-600 border border-amber-100";
            case "Low":
                return "bg-green-50 text-green-600 border border-green-100";
            default:
                return "bg-gray-50 text-gray-600 border border-gray-100";
        }
    };

    // Helper for Status Dot
    const getStatusDotColor = (status) => {
        switch (status) {
            case "pending": return "bg-amber-500";
            case "in_progress": return "bg-blue-500";
            case "fixed":
            case "closed": return "bg-green-500";
            case "rejected": return "bg-red-500";
            default: return "bg-gray-400";
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header ... (Leaving Header as is or assuming it's fine) */}
            <div className="bg-white border-b border-gray-100 pt-8 pb-6 px-4 mb-8 sticky top-0 z-20 bg-opacity-90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto">
                    {/* ... Header contents ... */}
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
                                className={`
                                    bg-white rounded-2xl p-6 shadow-sm border border-l-4 relative cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300
                                    ${getStatusColor(ticket.status)}
                                `}
                            >
                                {/* Header: ID & Priority & Time */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#193C6C] font-bold text-sm">
                                            #TK-{String(ticket.id).padStart(4, "0")}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getUrgencyBadge(ticket.urgency)}`}>
                                            {ticket.urgency}
                                        </span>
                                    </div>
                                    <span className="text-gray-400 text-xs font-medium">
                                        {dayjs(ticket.createdAt).fromNow(true).replace(" days", "d").replace(" months", "mo")} ago
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2 min-h-[56px]">
                                    {ticket.title}
                                </h3>

                                {/* Location & User */}
                                <div className="flex flex-col gap-1 text-xs text-gray-500 mb-6 font-medium">
                                    {ticket.room && (
                                        <p className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                            {ticket.room.roomNumber} (Fl. {ticket.room.floor})
                                        </p>
                                    )}
                                    <p className="flex items-center gap-1.5">
                                        <User size={12} className="text-gray-400" /> Reported by: {ticket.createdBy?.name || ticket.createdBy?.username}
                                    </p>
                                </div>

                                {/* Footer: Status & Assigned To */}
                                <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${getStatusDotColor(ticket.status)}`}></div>
                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                            {ticket.status.replace("_", " ")}
                                        </span>
                                    </div>

                                    {ticket.assignedTo ? (
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-gray-400 mb-0.5">Assigned to</span>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-medium text-gray-600">
                                                    {ticket.assignedTo.name?.split(" ")[0]}
                                                </span>
                                                <img
                                                    src={ticket.assignedTo.picture || `https://ui-avatars.com/api/?name=${ticket.assignedTo.name}&background=random`}
                                                    alt="Agent"
                                                    className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-300 italic">Unassigned</span>
                                    )}
                                </div>

                                {/* Delete Button - Admin Only */}
                                <button
                                    onClick={(e) => handleDelete(e, ticket.id)}
                                    className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-full transition-all opacity-0 group-hover:opacity-100 shadow-sm"
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
