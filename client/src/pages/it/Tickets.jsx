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
            console.error(err);
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
            case "not_start": return "border-l-gray-400 bg-gray-50/10";
            case "in_progress": return "border-l-blue-500 bg-blue-50/10";
            case "completed":
            case "closed": return "border-l-gray-300 bg-gray-50/10";
            default: return "border-l-gray-300";
        }
    };


    const urgencyColors = {
        Low: "bg-green-100 text-green-600",
        Medium: "bg-orange-100 text-orange-600",
        High: "bg-red-100 text-red-600",
        Critical: "bg-red-100 text-red-600"
    };

    // Helper for consistency with variable names used in replacement chunk
    const urngencyColors = urgencyColors;
    const urgnencyColors = urgencyColors;

    const getStatusDotColor = (status) => {
        switch (status) {
            case "not_start": return "bg-gray-400";
            case "in_progress": return "bg-blue-500";
            case "completed": return "bg-green-500";
            default: return "bg-gray-400";
        }
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
            {/* Filters & Search - User Style Match */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                {/* Search - Left Aligned & Bigger */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search tickets by ID, title, or requester..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-sm md:text-base"
                    />
                </div>

                {/* Filter Tabs - Right Aligned (or flowed) */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {["All", "Not Start", "In Progress", "Completed"].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`
                                px-6 py-2.5 rounded-xl text-sm font-bold border transition-all whitespace-nowrap flex-shrink-0
                                ${(activeFilter === filter ||
                                    (activeFilter === "all" && filter === "All") ||
                                    (activeFilter === "completed" && filter === "Completed") ||
                                    (activeFilter === "in_progress" && filter === "In Progress") ||
                                    (activeFilter === "not_start" && filter === "Not Start"))
                                    ? "bg-[#193C6C] text-white border-[#193C6C] shadow-md"
                                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700"
                                }
                            `}
                        >
                            {filter}
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
                                className={`
                                    bg-white rounded-2xl p-6 shadow-sm border border-l-4 relative cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300
                                    ${getStatusColor(ticket.status)}
                                    ${(ticket.status === 'completed' || ticket.status === 'closed') ? 'opacity-60 grayscale hover:opacity-100 hover:grayscale-0' : ''}
                                `}
                            >
                                {/* Header: ID & Priority & Time */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#193C6C] font-bold text-sm">
                                            #TK-{String(ticket.id).padStart(4, "0")}
                                        </span>
                                        <span
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${urngencyColors[ticket.urgency] || urgnencyColors.Low}`}
                                        >
                                            {ticket.urgency}
                                        </span>
                                    </div>
                                    <span className="text-gray-400 text-xs font-medium">
                                        {dayjs(ticket.createdAt)
                                            .fromNow(true)
                                            .replace(" days", "d")
                                            .replace(" months", "mo")}{" "}
                                        ago
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2 min-h-[56px]">
                                    {ticket.title}
                                </h3>

                                {/* Location */}
                                <p className="text-gray-500 text-xs mb-6 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                    {ticket.room
                                        ? `Floor ${ticket.room.floor}, ${ticket.room.roomNumber}`
                                        : "Location N/A"}
                                </p>

                                {/* Footer: Status & User (Requester) */}
                                <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                                    {/* Status */}
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`w-2 h-2 rounded-full ${getStatusDotColor(ticket.status)}`}
                                        ></div>
                                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                                            {ticket.status.replace("_", " ")}
                                        </span>
                                    </div>

                                    {/* Requester Info (Instead of Assignee for IT view) */}
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-gray-400 mb-0.5">
                                            Requested by
                                        </span>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-medium text-gray-600">
                                                {ticket.createdBy?.name?.split(" ")[0] || ticket.createdBy?.username}
                                            </span>
                                            <img
                                                src={
                                                    ticket.createdBy?.picture ||
                                                    `https://ui-avatars.com/api/?name=${ticket.createdBy?.name || ticket.createdBy?.username}&background=random`
                                                }
                                                alt="Requester"
                                                className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                                            />
                                        </div>
                                    </div>
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
