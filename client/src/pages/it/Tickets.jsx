import React, { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { getAllTickets } from "../../api/ticket";
import { useNavigate, useSearchParams } from "react-router-dom";
import socket from "../../utils/socket";
import ITHeader from "../../components/it/ITHeader";
import ITPageHeader from "../../components/it/ITPageHeader";
import ITWrapper from "../../components/it/ITWrapper";
import dayjs from "dayjs";

const Tickets = () => {
    const { token } = useAuthStore();
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

            const res = await getAllTickets(token, params);

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
    }, [token, currentPage, debouncedSearch, activeFilter, setSearchParams]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    // Real-time updates
    useEffect(() => {
        const handleNewTicket = (newTicket) => {
            console.log("Socket: New Ticket Received", newTicket);
            setTickets((prev) => [newTicket, ...prev]);
            setTickets((prev) => [newTicket, ...prev]);
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

                {/* Ticket List Header (Desktop Only) */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                    <div className="col-span-2">Time</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-4">Subject</div>
                    <div className="col-span-2">Location</div>
                    <div className="col-span-2 text-right">Actions</div>
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

// Ticket Card Component - Compact List View for Desktop, Compact Card for Mobile
const TicketCard = ({ ticket, navigate }) => {
    return (
        <>
            {/* Desktop View: Table-like Row */}
            <div
                onClick={() => navigate(`/it/ticket/${ticket.id}`)}
                className="hidden lg:grid grid-cols-12 gap-4 items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
                {/* 1. Time & ID (Col 2) */}
                <div className="col-span-2 flex flex-col justify-center">
                    <span className="text-xs font-bold text-gray-900">
                        {dayjs(ticket.createdAt).format("HH:mm")}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                        {dayjs(ticket.createdAt).format("MMM DD")}
                    </span>
                </div>

                {/* 2. Status Badge (Col 2) */}
                <div className="col-span-2">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wide w-fit ${ticket.status === 'not_start' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                        ticket.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                            ticket.status === 'completed' ? 'bg-gray-50 text-gray-600 border-gray-200' :
                                'bg-red-50 text-red-600 border-red-200'
                        }`}>
                        {ticket.status === 'not_start' && 'Open'}
                        {ticket.status === 'in_progress' && 'In Progress'}
                        {ticket.status === 'completed' && 'Done'}
                        {ticket.status === 'rejected' && 'Rejected'}
                    </span>
                </div>

                {/* 3. Subject & Category (Col 4) */}
                <div className="col-span-4 flex flex-col">
                    <h4 className="text-sm font-bold text-[#1e2e4a] truncate pr-4" title={ticket.title}>
                        {ticket.title || "No Subject"}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-500 font-medium flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${ticket.urgency === 'Critical' ? 'bg-red-500' : ticket.urgency === 'High' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                            {ticket.category?.name || "General"}
                        </span>
                    </div>
                </div>

                {/* 4. Location & User (Col 2) */}
                <div className="col-span-2 flex flex-col text-xs text-gray-500">
                    <span className="font-medium truncate" title={`Room ${ticket.room?.roomNumber}, Floor ${ticket.room?.floor}`}>
                        Rm. {ticket.room?.roomNumber || "-"}
                    </span>
                    <span className="text-[10px] truncate">
                        {ticket.createdBy?.name?.split(' ')[0] || ticket.createdBy?.username || ticket.createdBy?.email?.split('@')[0] || "Unknown User"}
                    </span>
                </div>

                {/* 5. Actions (Col 2) */}
                <div className="col-span-2 flex justify-end items-center gap-2">
                    {ticket.status === 'not_start' ? (
                        <>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/it/ticket/${ticket.id}`);
                                }}
                                className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                                title="Accept"
                            >
                                <span className="text-xs font-bold">Accept</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/it/ticket/${ticket.id}`);
                                }}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Reject"
                            >
                                <span className="text-xs font-bold">Reject</span>
                            </button>
                        </>
                    ) : (
                        <button className="p-1.5 text-gray-400 hover:text-[#1e2e4a]">
                            <Eye size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile View: Compact Card */}
            <div
                onClick={() => navigate(`/it/ticket/${ticket.id}`)}
                className="lg:hidden bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-100 transition-colors cursor-pointer flex flex-col gap-3"
            >
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border capitalize ${ticket.status === 'not_start' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                ticket.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    'bg-gray-50 text-gray-500 border-gray-100'
                                }`}>
                                {ticket.status?.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                                {dayjs(ticket.createdAt).format("HH:mm")}
                            </span>
                        </div>
                        <h3 className="text-base font-bold text-[#1e2e4a] truncate">
                            {ticket.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {ticket.room?.roomNumber ? `Room ${ticket.room.roomNumber}` : 'No Location'} • {ticket.createdBy?.name || ticket.createdBy?.username || ticket.createdBy?.email?.split('@')[0] || "Unknown"}
                        </p>
                    </div>
                    {ticket.status === 'not_start' && (
                        <div className="flex flex-col gap-1 shrink-0">
                            <button className="px-3 py-1 bg-[#1e2e4a] text-white text-[10px] font-bold rounded-lg shadow-sm">
                                Accept
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Tickets;
