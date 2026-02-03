import React, { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { getAllTickets } from "../../api/ticket";
import { useNavigate, useSearchParams } from "react-router-dom";


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

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };



    return (
        <div className="min-h-screen bg-gray-50 pb-8 font-sans text-gray-900">
            {/* Header */}
            <div className="bg-[#193C6C] px-6 pt-10 pb-24 rounded-b-[2.5rem] shadow-lg relative z-0">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="text-white hover:bg-white/10 p-2 -ml-2 rounded-full transition-colors"
                        >
                            <ChevronLeft size={28} />
                        </button>
                        <div>
                            <h1 className="text-white text-3xl font-bold">Support Tickets</h1>
                            <p className="text-blue-200 mt-1">Manage and track IT support requests</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10 text-white">
                        <span className="text-sm font-medium">Total Tickets:</span>
                        <span className="font-bold text-xl">{totalTickets}</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10 space-y-6">

                {/* Filters & Search - Modern Style */}
                <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100 flex flex-col md:flex-row gap-4">
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
                                        ? "bg-[#193C6C] text-white border-[#193C6C] shadow-md"
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
                                    bg-white rounded-2xl p-6 shadow-sm border border-gray-200 relative cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group
                                    ${(ticket.status === 'completed' || ticket.status === 'closed') ? 'opacity-60 hover:opacity-100' : ''}
                                `}
                                >
                                    {/* Header Row: Category & Status */}
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl md:text-2xl font-bold text-[#193C6C] line-clamp-1 group-hover:text-blue-800 transition-colors">
                                            {ticket.category?.name || "General"}
                                        </h3>

                                        {/* Status Badge */}
                                        <div className={`px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold border ${ticket.status === 'completed' ? 'border-green-500 text-green-600 bg-green-50' :
                                            ticket.status === 'in_progress' ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
                                                'border-red-500 text-red-600 bg-red-50'
                                            }`}>
                                            {ticket.status === 'not_start' ? 'Not Started' :
                                                ticket.status === 'in_progress' ? 'In Progress' : 'Completed'}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col gap-1 mb-6">
                                        <p className="text-base md:text-lg text-gray-800 font-bold line-clamp-1">
                                            {ticket.title}
                                        </p>
                                        <p className="text-sm md:text-base text-gray-500">
                                            Floor {ticket.room?.floor || "-"} , {ticket.room?.roomNumber || "-"}
                                        </p>
                                    </div>

                                    {/* Footer Separator */}
                                    <div className="h-px w-full bg-gray-100 mb-4"></div>

                                    {/* Footer Info */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-xs md:text-sm font-medium text-gray-500">
                                            <span>{new Date(ticket.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", ".")} PM</span>
                                            <span className="w-px h-3 bg-gray-300"></span>
                                            <span>{new Date(ticket.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs md:text-sm font-bold text-gray-500 text-right">
                                                {ticket.createdBy?.name || ticket.createdBy?.username}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-12 mb-8">
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
        </div >
    );
};

export default Tickets;
