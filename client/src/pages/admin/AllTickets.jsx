import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listAllTickets, removeTicket } from '../../api/admin'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime';
import { toast } from 'react-toastify'
import { Search, MapPin, User, Clock, Trash2, Eye, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'
import AdminWrapper from "../../components/admin/AdminWrapper";
import AdminHeader from "../../components/admin/AdminHeader";
import { confirmDialog } from "../../utils/sweetalert";

dayjs.extend(relativeTime);

const AllTickets = () => {
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    // Server-side Pagination State
    const [tickets, setTickets] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalTickets, setTotalTickets] = useState(0)

    // Filters
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
    const [filterStatus, setFilterStatus] = useState(searchParams.get('status') || 'all')
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm)

    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500); // 500ms delay
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Validate Page Effect
    useEffect(() => {
        // If filters change, reset to page 1
        setCurrentPage(1);
    }, [debouncedSearch, filterStatus]);

    const loadTickets = useCallback(async () => {
        try {
            setLoading(true)
            const params = {
                page: currentPage,
                limit: 12, // Grid 3 cols -> 12 is nice
                search: debouncedSearch,
                status: filterStatus === 'all' ? undefined : filterStatus
            }

            // Allow bookmarking searches
            const newParams = {};
            if (debouncedSearch) newParams.search = debouncedSearch;
            if (filterStatus !== 'all') newParams.status = filterStatus;
            setSearchParams(newParams, { replace: true });

            const res = await listAllTickets(params)

            // New Response Structure: { data, total, page, totalPages }
            if (res.data.data) {
                setTickets(res.data.data)
                setTotalTickets(res.data.total)
                setTotalPages(res.data.totalPages)
            } else {
                // Fallback if structure mismatches (shouldn't happen with our changes)
                setTickets([])
            }
        } catch {
            toast.error('Failed to load tickets')
        } finally {
            setLoading(false)
        }
    }, [currentPage, debouncedSearch, filterStatus, setSearchParams])

    useEffect(() => {
        loadTickets()
    }, [loadTickets])

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        const confirmed = await confirmDialog({
            title: "Delete Ticket",
            text: "Are you sure you want to delete this ticket?",
            confirmButtonText: "Delete",
            confirmVariant: "danger",
        });
        if (!confirmed) return;
        try {
            await removeTicket(id)
            toast.success('Ticket Deleted')
            loadTickets()
        } catch {
            toast.error('Delete Failed')
        }
    }

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Styles Helpers
    const getStatusColor = (status) => {
        switch (status) {
            case "not_start": return "border-l-amber-400 border-gray-100";
            case "in_progress": return "border-l-blue-400 border-gray-100";
            case "completed": return "border-l-green-400 border-gray-100";
            default: return "border-l-gray-400 border-gray-100";
        }
    };

    const getUrgencyBadge = (urgency) => {
        switch (urgency) {
            case "High": return "bg-red-100 text-red-600";
            case "Medium": return "bg-orange-100 text-orange-600";
            case "Low": return "bg-green-100 text-green-600";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    const getStatusDotColor = (status) => {
        switch (status) {
            case "not_start": return "bg-amber-500";
            case "in_progress": return "bg-blue-500";
            case "completed": return "bg-green-500";
            default: return "bg-gray-400";
        }
    };

    return (
        <AdminWrapper>
            <div className="flex flex-col h-full px-6 pt-6 pb-6 space-y-6 overflow-y-auto">
                {/* Header */}
                <AdminHeader
                    title="Ticket Management"
                    subtitle="Manage all support tickets in one place"
                    onBack={() => navigate(-1)}
                />

                <div className="px-4 pt-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100">
                            Total: {totalTickets}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search tickets by title, ID, or user..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                            {['all', 'not_start', 'in_progress', 'completed'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-bold capitalize transition-all whitespace-nowrap ${filterStatus === status
                                        ? 'bg-[#193C6C] text-white shadow-md shadow-blue-900/20'
                                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content - Grid View */}
                <div className="px-4">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-white rounded-xl shadow-sm animate-pulse border border-gray-100"></div>)}
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="text-gray-300" size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">No tickets found</h3>
                            <p className="text-gray-400 text-sm">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                                {tickets.map((ticket) => (
                                    <div
                                        key={ticket.id}
                                        onClick={() => navigate(`/admin/ticket/${ticket.id}`)}
                                        className={`
                                        bg-white rounded-2xl p-6 shadow-sm border border-l-4 relative cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group
                                        ${getStatusColor(ticket.status)}
                                    `}
                                    >
                                        {/* Header: ID & Priority & Time */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[#193C6C] font-bold text-sm">
                                                    #TK-{String(ticket.id).padStart(4, "0")}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${getUrgencyBadge(ticket.urgency)}`}>
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

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-4 mt-8">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft size={20} className="text-gray-600" />
                                    </button>

                                    <span className="text-sm font-medium text-gray-600">
                                        Page {currentPage} of {totalPages}
                                    </span>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight size={20} className="text-gray-600" />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AdminWrapper>
    )
}

export default AllTickets
