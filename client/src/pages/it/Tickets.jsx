import React, { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { getAllTickets } from "../../api/ticket";
import { useNavigate, useSearchParams } from "react-router-dom";
import socket from "../../utils/socket";
import ITHeader from "../../components/it/ITHeader";
import ITPageHeader from "../../components/it/ITPageHeader";
import ITWrapper from "../../components/it/ITWrapper";

const Tickets = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    // Server-side Pagination State
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);


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
                limit: 10,
                search: debouncedSearch,
                status: activeFilter === "All" || activeFilter === "all" ? undefined : activeFilter.toLowerCase().replace(" ", "_")
            };

            // Update URL params
            const newParams = {};
            if (debouncedSearch) newParams.search = debouncedSearch;
            if (activeFilter !== "All" && activeFilter !== "all") newParams.status = activeFilter;
            setSearchParams(newParams, { replace: true });

            const res = await getAllTickets(params);

            if (res.data.data) {
                setTickets(res.data.data);
                setTotalPages(res.data.totalPages);
            } else {
                setTickets([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch, activeFilter, setSearchParams]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    // Real-time updates
    useEffect(() => {
        const handleNewTicket = (newTicket) => {
            setTickets((prev) => [newTicket, ...prev]);
        };

        const handleUpdateTicket = (updatedTicket) => {
            setTickets((prev) => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        }

        socket.on("server:new-ticket", handleNewTicket);
        socket.on("server:update-ticket", handleUpdateTicket);

        return () => {
            socket.off("server:new-ticket", handleNewTicket);
            socket.off("server:update-ticket", handleUpdateTicket);
        };
    }, []);

    return (
        <ITWrapper>
            <div className="flex flex-col h-[calc(100vh-6rem)]">
                {/* Desktop Header */}
                <div className="hidden lg:block mb-6">
                    <ITHeader title="All Tickets" subtitle="Manage and track all support requests." />
                </div>

                {/* Mobile Header */}
                <div className="lg:hidden mb-4">
                    <ITPageHeader title="All Tickets" />
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                        {["All", "Not Start", "In Progress", "Completed", "Rejected"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setActiveFilter(status)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${activeFilter === status
                                    ? "bg-[#1e2e4a] text-white border-[#1e2e4a] shadow-md shadow-blue-900/20"
                                    : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>

                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search tickets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                        />
                    </div>
                </div>



                {/* Ticket List Container */}
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 pb-20">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((n) => (
                                <div key={n} className="h-40 bg-gray-100 rounded-2xl animate-pulse"></div>
                            ))}
                        </div>
                    ) : tickets.length > 0 ? (
                        <div className="space-y-4">
                            {tickets.map((ticket) => (
                                <TicketCard
                                    key={ticket.id}
                                    ticket={ticket}
                                    navigate={navigate}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <Search size={32} className="opacity-50" />
                            </div>
                            <p className="font-bold">No tickets found</p>
                            <p className="text-xs">Try adjusting your filters</p>
                        </div>
                    )}
                </div>

                {/* Pagination (Sticky Footer) */}
                {totalPages > 1 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between pb-2">
                        <span className="text-xs font-bold text-gray-400">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={20} className="text-[#1e2e4a]" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={20} className="text-[#1e2e4a]" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ITWrapper>
    );
};

// Ticket Card Component - Matches UserTicketCard design
const TicketCard = ({ ticket, navigate }) => {
    const getStatusConfig = (status) => {
        switch (status) {
            case "not_start":
            case "pending": // legacy value → treat as not started
                return { label: "Not Started", className: "border-gray-400 text-gray-500 bg-gray-50" };
            case "in_progress":
                return { label: "In Progress", className: "border-blue-500 text-blue-600 bg-blue-50" };
            case "completed":
                return { label: "Completed", className: "border-green-500 text-green-600 bg-green-50" };
            case "rejected":
                return { label: "Rejected", className: "border-red-400 text-red-500 bg-red-50" };
            default:
                return { label: "Not Started", className: "border-gray-400 text-gray-500 bg-gray-50" };
        }
    };

    const statusConfig = getStatusConfig(ticket.status);
    const dateObj = new Date(ticket.updatedAt || ticket.createdAt);

    return (
        <div
            onClick={() => navigate(`/it/ticket/${ticket.id}`)}
            className="bg-white rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer"
        >
            {/* Header: Category & Status */}
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-[#193C6C] tracking-tight">
                    {ticket.category?.name || "General Issue"}
                </h3>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border shrink-0 ml-3 ${statusConfig.className}`}>
                    {statusConfig.label}
                </span>
            </div>

            {/* Body: Title & Location */}
            <div className="mb-6">
                <h4 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 leading-relaxed">
                    {ticket.title || ticket.description || "-"}
                </h4>
                <p className="text-gray-400 text-xs font-semibold bg-gray-50 inline-block px-2 py-1 rounded-md">
                    Floor {ticket.room?.floor || "-"} , {ticket.room?.roomNumber || "-"}
                </p>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-gray-100 mb-4"></div>

            {/* Footer: Time/Date & Reporter */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                    <span>
                        {dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>
                        {dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                    </span>
                </div>
                <span className="text-sm font-bold text-[#193C6C]">
                    {ticket.createdBy?.name || ticket.createdBy?.username || "User"}
                </span>
            </div>
        </div>
    );
};

export default Tickets;
