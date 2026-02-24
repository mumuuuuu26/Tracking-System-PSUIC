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

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

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
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    }, [currentPage, debouncedSearch, activeFilter, setSearchParams]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    // Real-time updates
    useEffect(() => {
        const handleNewTicket = () => {
            loadTickets();
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
    }, [loadTickets]);

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

                {/* Search & Status Filter */}
                <div className="flex flex-col gap-3 mb-4 sticky top-0 z-10 bg-gray-50 dark:bg-[#0d1b2a] pt-2 pb-1">
                    {/* Search Bar */}
                    <div className="flex items-center gap-3">
                        <div className="relative shadow-sm rounded-xl flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-blue-400/60 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search tickets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-[#1a2f4e] border border-gray-300 dark:border-blue-700/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-blue-400/40 outline-none transition-colors"
                            />
                        </div>
                    </div>

                    {/* Status Pills */}
                    <div className="flex-1 flex gap-2 overflow-x-auto w-full no-scrollbar pb-1">
                        {["All", "Not Start", "In Progress", "Completed", "Rejected"].map((status) => (
                            <button
                                key={status}
                                onClick={() => setActiveFilter(status)}
                                className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${activeFilter === status
                                    ? "bg-[#1e2e4a] dark:bg-[#193C6C] text-white border-transparent shadow-md"
                                    : "bg-white dark:bg-[#1a2f4e] text-[#1e2e4a] dark:text-blue-300 border-gray-200 dark:border-blue-700/40 hover:bg-gray-50 dark:hover:bg-[#1e3558]"
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Ticket List Container */}
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 pb-20">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((n) => (
                                <div key={n} className="h-40 bg-gray-100 dark:bg-blue-900/20 rounded-2xl animate-pulse"></div>
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
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-blue-300/40">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                                <Search size={32} className="opacity-50" />
                            </div>
                            <p className="font-bold text-gray-600 dark:text-white/70">No tickets found</p>
                            <p className="text-xs mt-1 text-gray-400 dark:text-blue-300/50">Try adjusting your filters</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-blue-800/30 flex items-center justify-between pb-2">
                        <span className="text-xs font-bold text-gray-400 dark:text-blue-300/50">
                            Page {currentPage} of {totalPages}
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-blue-900/30 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={20} className="text-[#1e2e4a] dark:text-blue-300" />
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-blue-900/30 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={20} className="text-[#1e2e4a] dark:text-blue-300" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </ITWrapper>
    );
};

const TicketCard = ({ ticket, navigate }) => {
    const getStatusConfig = (status) => {
        switch (status) {
            case "not_start":
            case "pending":
                return { label: "Not Started", className: "border-gray-200 dark:border-slate-500/60 text-gray-500 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/40" };
            case "in_progress":
                return { label: "In Progress", className: "border-blue-200 dark:border-blue-500/60 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-700/40" };
            case "completed":
                return { label: "Completed", className: "border-emerald-200 dark:border-emerald-500/60 text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-800/40" };
            case "rejected":
                return { label: "Rejected", className: "border-red-200 dark:border-red-500/60 text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-800/40" };
            default:
                return { label: "Not Started", className: "border-gray-200 dark:border-slate-500/60 text-gray-500 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/40" };
        }
    };

    const statusConfig = getStatusConfig(ticket.status);
    const dateObj = new Date(ticket.updatedAt || ticket.createdAt);

    return (
        <div
            onClick={() => navigate(`/it/ticket/${ticket.id}`)}
            className="bg-white dark:bg-[#1a2f4e] rounded-2xl p-5 border border-gray-200 dark:border-gray-700/30 relative overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-[0_4px_20px_rgba(25,60,108,0.4)] cursor-pointer group"
        >
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-50 dark:from-blue-600/5 to-transparent pointer-events-none"></div>

            {/* Header: Category & Status */}
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-blue-700 dark:text-blue-300 font-bold text-base tracking-tight">
                    {ticket.category?.name || "General Issue"}
                    {ticket.subComponent ? ` · ${ticket.subComponent}` : ""}
                </h3>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border shrink-0 ml-2 ${statusConfig.className}`}>
                    {statusConfig.label}
                </span>
            </div>

            {/* Body: Title & Location */}
            <div className="mb-5">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-relaxed">
                    {ticket.title || ticket.description || "-"}
                </h4>
                <span className="text-blue-600 dark:text-blue-400/80 text-xs font-semibold bg-blue-50 dark:bg-blue-900/50 inline-block px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600/40">
                    Floor {ticket.room?.floor || "-"} · Room {ticket.room?.roomNumber || "-"}
                </span>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-gray-100 dark:bg-blue-800/30 mb-4 transition-colors"></div>

            {/* Footer: Time/Date & Reporter */}
            <div className="flex flex-wrap items-center justify-between gap-y-3 relative z-10">
                <div className="flex items-center shrink-0 gap-2 text-xs font-medium text-gray-500 dark:text-blue-400/70">
                    <span>
                        {dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </span>
                    <span className="text-gray-300 dark:text-blue-700">|</span>
                    <span>
                        {dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                    </span>
                </div>
                <div className="flex items-center gap-2 justify-end">
                    <span className="text-sm font-bold text-[#193C6C] dark:text-white bg-blue-50 dark:bg-[#1a2f4e] px-3 py-1.5 rounded-xl border border-gray-100 dark:border-blue-700/50">
                        {ticket.createdBy?.name || ticket.createdBy?.username || "User"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Tickets;
