import React, { useEffect, useState, useCallback } from "react";
import { Search, MapPin, User, Clock, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { getAllTickets } from "../../api/ticket";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigate, useSearchParams } from "react-router-dom";

dayjs.extend(relativeTime);

const Tickets = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Server-side Pagination State
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTickets, setTotalTickets] = useState(0);

    // Filters
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || "");
    const [activeFilter, setActiveFilter] = useState(searchParams.get('status') || "all");
    const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch, activeFilter]);

    const loadTickets = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 12, // Grid 3x4
                search: debouncedSearch,
                status: activeFilter === "All" || activeFilter === "all" ? undefined : activeFilter.toLowerCase().replace(" ", "_")
            };

            // Update URL params
            const newParams = {};
            if (debouncedSearch) newParams.search = debouncedSearch;
            if (activeFilter !== "All" && activeFilter !== "all") newParams.status = activeFilter;
            setSearchParams(newParams, { replace: true });

            const res = await getAllTickets(token, params);

            // Handle new response structure { data, total, page, totalPages }
            if (res.data.data) {
                setTickets(res.data.data);
                setTotalTickets(res.data.total);
                setTotalPages(res.data.totalPages);
            } else {
                setTickets([]);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    }, [token, currentPage, debouncedSearch, activeFilter, setSearchParams]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "border-l-amber-500 bg-amber-50/10";
            case "in_progress": return "border-l-blue-500 bg-blue-50/10";
            case "fixed":
            case "closed": return "border-l-green-500 bg-green-50/10";
            case "rejected": return "border-l-red-500 bg-red-50/10";
            default: return "border-l-gray-300";
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: "bg-amber-100 text-amber-700 ring-amber-600/20",
            in_progress: "bg-blue-100 text-blue-700 ring-blue-600/20",
            fixed: "bg-green-100 text-green-700 ring-green-600/20",
            closed: "bg-green-100 text-green-700 ring-green-600/20",
            rejected: "bg-red-100 text-red-700 ring-red-600/20"
        };
        return styles[status] || "bg-gray-100 text-gray-700 ring-gray-600/20";
    };

    const urgencyColors = {
        Low: "text-green-600 bg-green-50 border-green-100",
        Medium: "text-amber-600 bg-amber-50 border-amber-100",
        High: "text-orange-600 bg-orange-50 border-orange-100",
        Critical: "text-red-600 bg-red-50 border-red-100"
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
                    <p className="text-gray-500 mt-1">Manage and track IT support requests</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 shadow-sm">
                        Total Tickets: <span className="text-gray-900 font-bold ml-1">{totalTickets}</span>
                    </span>
                </div>
            </div>

            {/* Filters & Search - Modern Style */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm sticky top-0 z-10">
                <div className="md:col-span-5 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search tickets by ID, title, requester..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                    />
                </div>

                <div className="md:col-span-7 flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                    <Filter className="text-gray-400 w-5 h-5 flex-shrink-0" />
                    {["All", "Pending", "In Progress", "Fixed", "Rejected"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setActiveFilter(status)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${(activeFilter === status ||
                                (activeFilter === "all" && status === "All") ||
                                (activeFilter === "fixed" && status === "Fixed") ||
                                (activeFilter === "in_progress" && status === "In Progress") ||
                                (activeFilter === status.toLowerCase()))
                                ? "bg-[#193C6C] text-white shadow-md shadow-blue-900/20"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Ticket Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="bg-white rounded-xl h-64 animate-pulse shadow-sm border border-gray-100"></div>
                    ))}
                </div>
            ) : tickets.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="text-gray-400 w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No tickets found</h3>
                    <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                onClick={() => navigate(`/it/ticket/${ticket.id}`)}
                                className={`group bg-white rounded-xl border-l-[3px] border-t border-r border-b border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden ${getStatusColor(ticket.status)}`}
                            >
                                <div className="p-5 space-y-4">
                                    {/* Header */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-bold text-gray-500">
                                                #{String(ticket.id).padStart(4, "0")}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${urgencyColors[ticket.urgency] || urgencyColors.Low}`}>
                                                {ticket.urgency}
                                            </span>
                                        </div>
                                        <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            {dayjs(ticket.createdAt).fromNow(true)} ago
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {ticket.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 line-clamp-2">
                                            {ticket.description}
                                        </p>
                                    </div>

                                    {/* Meta Info */}
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        {ticket.room && (
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5" />
                                                <span>{ticket.room.roomNumber}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 pl-4 border-l border-gray-200">
                                            <User className="w-3.5 h-3.5" />
                                            <span className="truncate max-w-[100px]">
                                                {ticket.createdBy?.name || ticket.createdBy?.username}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${getStatusBadge(ticket.status)}`}>
                                        {ticket.status.replace("_", " ")}
                                    </span>
                                    <span className="text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                        View Details →
                                    </span>
                                </div>
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
    );
};

export default Tickets;
