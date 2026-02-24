import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Calendar, CheckCircle, Search, Filter, Printer, User, Wifi, Monitor, Cpu, Box } from "lucide-react";
import { getHistory } from "../../api/it";
import { listCategories } from "../../api/category";
import ITHeader from "../../components/it/ITHeader";
import ITWrapper from "../../components/it/ITWrapper";
import AdminSelect from "../../components/admin/AdminSelect";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const History = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [categories, setCategories] = useState([]);

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getHistory();
            setTickets(res.data);
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchCategories = useCallback(async () => {
        try {
            const res = await listCategories();
            setCategories(res.data);
        } catch {
            // Silent fail
        }
    }, []);

    useEffect(() => {
        fetchHistory();
        fetchCategories();
    }, [fetchHistory, fetchCategories]);

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch =
            ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.equipment?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.room?.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = filterCategory === "All" || ticket.category?.name === filterCategory;

        return matchesSearch && matchesCategory;
    });

    const getCategoryStyle = (categoryName) => {
        switch (categoryName) {
            case "Hardware":
                return { bg: "bg-pink-100 dark:bg-pink-900/20", text: "text-pink-600 dark:text-pink-400", icon: <Monitor size={24} /> };
            case "Software":
                return { bg: "bg-blue-100 dark:bg-blue-900/20", text: "text-blue-600 dark:text-blue-400", icon: <Cpu size={24} /> };
            case "Network":
                return { bg: "bg-purple-100 dark:bg-purple-900/20", text: "text-purple-600 dark:text-purple-400", icon: <Wifi size={24} /> };
            case "Printer":
                return { bg: "bg-orange-100 dark:bg-orange-900/20", text: "text-orange-600 dark:text-orange-400", icon: <Printer size={24} /> };
            case "Account":
                return { bg: "bg-green-100 dark:bg-green-900/20", text: "text-green-600 dark:text-green-400", icon: <User size={24} /> };
            default:
                return { bg: "bg-gray-100 dark:bg-gray-800/50", text: "text-gray-600 dark:text-gray-400", icon: <Box size={24} /> };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0d1b2a]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <ITWrapper>
            <div className="space-y-6">
                {/* Modern Header */}
                <ITHeader
                    title="Task History"
                    subtitle="Archive of all completed maintenance tasks and resolutions"
                    onBack={() => navigate(-1)}
                />

                {/* Filters */}
                <div className="bg-white dark:bg-[#1a2f4e] rounded-[1.5rem] p-4 shadow-sm dark:shadow-lg border border-gray-100 dark:border-blue-800/30 flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-blue-300/50" size={18} />
                        <input
                            type="text"
                            placeholder="Search tickets by ID, title, or requester..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 dark:focus:border-blue-400 transition-all font-medium text-sm md:text-base outline-none shadow-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-blue-400/40"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="relative w-full md:w-auto">
                        <AdminSelect
                            value={filterCategory}
                            onChange={setFilterCategory}
                            options={['All', ...categories.map(cat => cat.name)]}
                            placeholder="All Categories"
                            icon={Filter}
                            minWidth="md:w-64 w-full"
                            buttonClassName="py-3 rounded-xl border-gray-200 dark:border-blue-800/40 text-sm md:text-base font-bold text-[#1e2e4a] dark:text-white h-full"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 gap-4">
                    {filteredTickets.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-[#1a2f4e] rounded-3xl border border-dashed border-gray-200 dark:border-blue-800/30">
                            <div className="w-20 h-20 bg-gray-50 dark:bg-blue-900/20 text-gray-300 dark:text-blue-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">No history found</h3>
                            <p className="text-gray-500 dark:text-blue-300/60 mt-1">You haven't completed any tasks yet.</p>
                        </div>
                    ) : (
                        filteredTickets.map((ticket) => {
                            const style = getCategoryStyle(ticket.category?.name);
                            return (
                                <div
                                    key={ticket.id}
                                    onClick={() => navigate(`/it/ticket/${ticket.id}`)}
                                    className="bg-white dark:bg-[#1a2f4e] rounded-2xl p-6 shadow-sm dark:shadow-lg border border-gray-100/50 dark:border-blue-800/30 hover:shadow-xl dark:hover:shadow-blue-900/20 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                                >
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                        <div className="flex items-start gap-5">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${style.bg} ${style.text}`}>
                                                {style.icon}
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-gray-800 dark:text-white text-lg md:text-xl group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                                                        {ticket.equipment?.name || ticket.title}
                                                    </h3>
                                                    <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-[10px] uppercase font-bold px-2 py-1 rounded-full tracking-wide">
                                                        Resolved
                                                    </span>
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:items-center gap-y-1 gap-x-4 text-sm text-gray-500 dark:text-blue-300/60 mb-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Box size={14} />
                                                        <span>Room {ticket.room?.roomNumber} (Fl. {ticket.room?.floor})</span>
                                                    </div>
                                                    <div className="hidden sm:block text-gray-300 dark:text-blue-800/60">•</div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span>Ticket #{ticket.id}</span>
                                                    </div>
                                                    <div className="hidden sm:block text-gray-300 dark:text-blue-800/60">•</div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{ticket.category?.name}</span>
                                                    </div>
                                                </div>

                                                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 md:line-clamp-1">
                                                    {ticket.title} — {ticket.description || "No specific description"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t dark:border-blue-800/30 md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0 pl-0 md:pl-4 md:min-w-[140px]">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400 dark:text-blue-300/50 font-medium uppercase tracking-wider mb-1">Completed</p>
                                                <p className="text-sm font-bold text-gray-700 dark:text-white flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-gray-400 dark:text-blue-300/50" />
                                                    {dayjs(ticket.updatedAt).format("MMM D, YYYY")}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-blue-300/60 mt-1">
                                                    {dayjs(ticket.updatedAt).format("HH:mm")}
                                                </p>
                                            </div>

                                            {ticket.rating ? (
                                                <div className="flex items-center gap-1.5 mt-3 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1.5 rounded-lg border border-yellow-100 dark:border-yellow-800/30">
                                                    <span className="text-yellow-500 text-sm">⭐</span>
                                                    <span className="text-sm font-bold text-gray-800 dark:text-white">{ticket.rating}/5</span>
                                                </div>
                                            ) : (
                                                <div className="mt-3 px-3 py-1.5 text-xs text-gray-400 dark:text-blue-300/40 bg-gray-50 dark:bg-blue-900/10 rounded-lg">
                                                    No Rating
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </ITWrapper>
    );
};

export default History;
