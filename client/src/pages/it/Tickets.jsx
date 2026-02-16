import React, { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { getAllTickets } from "../../api/ticket";
import { useNavigate, useSearchParams } from "react-router-dom";
import socket from "../../utils/socket";
import ITHeader from "../../components/it/ITHeader";
import ITPageHeader from "../../components/it/ITPageHeader"; // [NEW]
import ITWrapper from "../../components/it/ITWrapper"; // [NEW]


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
                limit: 10, // List View
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

    // Real-time updates
    useEffect(() => {
        const handleNewTicket = (newTicket) => {
            console.log("Socket: New Ticket Received", newTicket);
            // Only add if it matches current filter (simplified check)
            // Or just prepend and let user re-filter if needed. 
            // For simplicity and immediate feedback, we prepend.
            setTickets((prev) => [newTicket, ...prev]);
            setTotalTickets((prev) => prev + 1);
        };

        const handleUpdateTicket = (updatedTicket) => {
            console.log("Socket: Ticket Updated", updatedTicket);
            setTickets((prev) => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        }

        socket.on("server:new-ticket", handleNewTicket);
        socket.on("server:update-ticket", handleUpdateTicket);

        return () => {
            socket.off("server:new-ticket", handleNewTicket);
            socket.off("server:update-ticket", handleUpdateTicket);
        };
    }, []);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };



    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Mobile Header */}
            <ITPageHeader title="Support Tickets" />

            {/* Desktop Header */}
            <div className="hidden lg:block">
                <ITHeader
                    title="Support Tickets"
                    subtitle="Manage and track IT support requests"
                    onBack={() => navigate(-1)}
                >
                    <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 text-blue-700">
                        <span className="text-sm font-bold">Total Tickets:</span>
                        <span className="font-bold text-xl">{totalTickets}</span>
                    </div>
                </ITHeader>
            </div>

            <div className="mt-6 space-y-4">
                {/* Filters & Search - Modern Style */}
                <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                    {/* Search - Left Aligned & Bigger */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search tickets by ID, title, or requester..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-transparent focus:bg-white border focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-sm md:text-base outline-none"
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
                                        ? "bg-[#1e2e4a] text-white border-[#1e2e4a] shadow-md"
                                        : "bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-700"
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
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="bg-white rounded-2xl h-40 animate-pulse shadow-sm border border-gray-100"></div>
                        ))}
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-gray-400 w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No tickets found</h3>
                        <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-4">
                            {tickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    onClick={() => navigate(`/it/ticket/${ticket.id}`)}
                                    className={`
                                    bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 relative cursor-pointer hover:shadow-md transition-all duration-300 group
                                    ${(ticket.status === 'completed' || ticket.status === 'closed') ? 'opacity-75 hover:opacity-100' : ''}
                                `}
                                >
                                    {/* Header Row: Title & Status */}
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="text-lg md:text-xl font-bold text-[#1e2e4a] mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                                {ticket.title || "No Subject"}
                                            </h3>
                                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                                                {ticket.category?.name || "General"}
                                            </span>
                                        </div>

                                        {/* Status Badge */}
                                        <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${ticket.status === 'completed' ? 'border-green-200 text-green-600 bg-green-50' :
                                            ticket.status === 'in_progress' ? 'border-orange-200 text-orange-600 bg-orange-50' :
                                                'border-red-200 text-red-600 bg-red-50'
                                            }`}>
                                            {ticket.status === 'not_start' ? 'Not Started' :
                                                ticket.status === 'in_progress' ? 'In Progress' : 'Completed'}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col gap-1 mb-4">
                                        <p className="text-sm md:text-base text-gray-600 line-clamp-2 leading-relaxed">
                                            {ticket.description}
                                        </p>
                                        <p className="text-xs md:text-sm text-gray-400 mt-1">
                                            Floor {ticket.room?.floor || "-"} , {ticket.room?.roomNumber || "-"}
                                        </p>
                                    </div>

                                    {/* Footer Separator */}
                                    <div className="h-px w-full bg-gray-100 mb-4"></div>

                                    {/* Footer Info */}
                                    <div className="flex items-center justify-between text-xs md:text-sm text-gray-400 font-medium">
                                        <div className="flex items-center gap-3">
                                            <span>{new Date(ticket.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", ".")} PM</span>
                                            <span className="text-gray-300">|</span>
                                            <span>{new Date(ticket.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}</span>
                                        </div>
                                        <div className="font-bold text-[#1e2e4a]">
                                            {ticket.requester?.name || ticket.requester?.username || "Unknown User"}
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
                                    className="p-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-gray-600"
                                >
                                    <ChevronLeft size={20} />
                                </button>

                                <span className="text-sm font-bold text-gray-600 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-3 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm text-gray-600"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Tickets;
