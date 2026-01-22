import React, { useEffect, useState } from "react";
import { Search, MapPin, User, Clock, Filter } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { getAllTickets } from "../../api/ticket";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigate } from "react-router-dom";

dayjs.extend(relativeTime);

const Tickets = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [filteredTickets, setFilteredTickets] = useState([]);
    const [activeFilter, setActiveFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTickets();
    }, []);

    useEffect(() => {
        filterTickets();
    }, [tickets, activeFilter, searchTerm]);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const res = await getAllTickets(token);
            setTickets(res.data);
            setFilteredTickets(res.data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const filterTickets = () => {
        let filtered = [...tickets];

        // Filter by status
        if (activeFilter !== "All") {
            filtered = filtered.filter((t) => {
                if (activeFilter === "Completed") return t.status === "fixed";
                if (activeFilter === "In Progress") return t.status === "in_progress";
                if (activeFilter === "Pending") return t.status === "pending";
                if (activeFilter === "Rejected") return t.status === "rejected";
                return true;
            });
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(
                (t) =>
                    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    String(t.id).includes(searchTerm) ||
                    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    t.createdBy?.name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
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

        filtered.sort((a, b) => {
            const weightA = statusWeight[a.status] || 99;
            const weightB = statusWeight[b.status] || 99;

            if (weightA !== weightB) {
                return weightA - weightB; // Lower weight (earlier stage) first
            }
            // Secondary sort: Oldest First (First Come First Served) within same status
            return new Date(a.createdAt) - new Date(b.createdAt);
        });

        setFilteredTickets(filtered);
    };

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

    const filters = ["All", "Pending", "In Progress", "Completed", "Rejected"];

    return (
        <div className="min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-100 pt-8 pb-6 px-4 mb-8 sticky top-0 z-10 bg-opacity-80 backdrop-blur-md">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">All Tickets</h1>
                            <p className="text-gray-500 mt-1">Manage all support tickets from users</p>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by ID, title, user, or keyword..."
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-700"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setActiveFilter(filter)}
                                    className={`px-5 py-3 rounded-xl whitespace-nowrap text-sm font-medium transition-all ${activeFilter === filter
                                        ? "bg-blue-600 text-white shadow-md"
                                        : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                        }`}
                                >
                                    {filter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-white rounded-xl shadow-sm animate-pulse border border-gray-100"></div>)}
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-lg mx-auto">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No tickets found</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">
                            {searchTerm || activeFilter !== "All" ? "No matches for your search filters." : "There are no tickets in the system."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTickets.map((ticket) => (
                            <div
                                key={ticket.id}
                                onClick={() => navigate(`/it/ticket/${ticket.id}`)}
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
                                            {ticket.room.name}
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
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tickets;
