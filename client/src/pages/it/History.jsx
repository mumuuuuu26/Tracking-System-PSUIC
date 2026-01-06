import React, { useEffect, useState } from "react";
import { Clock, Calendar, CheckCircle, Search, Filter, Printer, User, Wifi, Monitor, Cpu, Box } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { getHistory } from "../../api/it";
import { listCategories } from "../../api/category"; // Import list categories
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const History = () => {
    const { token } = useAuthStore();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchHistory();
        fetchCategories();
    }, [token]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const res = await getHistory(token);
            setTickets(res.data);
        } catch (err) {
            console.error("Failed to load history:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await listCategories(token);
            setCategories(res.data);
        } catch (err) {
            console.error("Failed to load categories:", err);
        }
    }

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
                return { bg: "bg-pink-100", text: "text-pink-600", icon: <Monitor size={24} /> };
            case "Software":
                return { bg: "bg-blue-100", text: "text-blue-600", icon: <Cpu size={24} /> };
            case "Network":
                return { bg: "bg-purple-100", text: "text-purple-600", icon: <Wifi size={24} /> };
            case "Printer":
                return { bg: "bg-orange-100", text: "text-orange-600", icon: <Printer size={24} /> };
            case "Account":
                return { bg: "bg-green-100", text: "text-green-600", icon: <User size={24} /> };
            default:
                return { bg: "bg-gray-100", text: "text-gray-600", icon: <Box size={24} /> };
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Clock className="text-blue-600" />
                            Task History
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">View all completed maintenance tasks</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by title, equipment, or room..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="text-gray-400 w-5 h-5" />
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                            >
                                <option value="All">All Categories</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filteredTickets.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-gray-200">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No history found</h3>
                            <p className="text-gray-500">You haven't completed any tasks yet.</p>
                        </div>
                    ) : (
                        filteredTickets.map((ticket) => {
                            const style = getCategoryStyle(ticket.category?.name);
                            return (
                                <div key={ticket.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg} ${style.text}`}>
                                                {style.icon}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-800 text-lg">
                                                        {ticket.equipment?.name || ticket.title}
                                                    </h3>
                                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                                        Resolved
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-500 space-y-1">
                                                    <p className="flex items-center gap-1">
                                                        <span>📍 Room {ticket.room?.roomNumber} (Fl. {ticket.room?.floor})</span>
                                                    </p>
                                                    <p className="text-gray-400 text-xs">
                                                        Ticket #{ticket.id} • {ticket.title} • {ticket.category?.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 mt-2 md:mt-0">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">Completed</p>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {dayjs(ticket.updatedAt).format("MMM D, YYYY HH:mm")}
                                                </p>
                                            </div>
                                            {ticket.rating && (
                                                <div className="flex items-center gap-1 mt-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                                    <span className="text-yellow-500">⭐</span>
                                                    <span className="text-sm font-bold text-gray-700">{ticket.rating}/5</span>
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
        </div>
    );
};

export default History;
