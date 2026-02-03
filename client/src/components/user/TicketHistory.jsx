import React, { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { getTicketHistory } from "../../api/ticket";
import { listCategories } from "../../api/category";
import { useNavigate } from "react-router-dom";

const TicketHistory = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        categoryId: "all"
    });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch Categories (Non-blocking)
            listCategories(token)
                .then(res => setCategories(res.data))
                .catch(err => console.error("Category Fetch Error:", err));

            // Fetch Tickets
            const ticketRes = await getTicketHistory(token, { categoryId: filters.categoryId });
            setTickets(ticketRes.data);
        } catch (err) {
            console.error("Ticket Fetch Error:", err);
            // Optionally setTickets([]) or handle graphical error
        } finally {
            setLoading(false);
        }
    }, [token, filters.categoryId]);

    useEffect(() => {
        loadData();
    }, [loadData]);




    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="flex flex-row items-center gap-3">                {/* Category Pills */}
                <div className="flex-1 flex gap-2 overflow-x-auto w-full no-scrollbar px-1 mask-linear-fade">
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, categoryId: "all" }))}
                        className={`px-5 h-12 rounded-xl text-sm font-bold border whitespace-nowrap transition-all shadow-sm flex items-center justify-center ${filters.categoryId === "all"
                            ? "bg-[#193C6C] text-white border-[#193C6C]"
                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setFilters(prev => ({ ...prev, categoryId: cat.id }))}
                            className={`px-5 h-12 rounded-xl text-sm font-bold border whitespace-nowrap transition-all shadow-sm flex items-center justify-center ${filters.categoryId === cat.id
                                ? "bg-[#193C6C] text-white border-[#193C6C]"
                                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4 pb-20">
                {loading ? (
                    <div className="text-center py-20 text-gray-400 animate-pulse">Loading history...</div>
                ) : tickets.length > 0 ? (
                    tickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            onClick={() => navigate(`/user/ticket/${ticket.id}`)}
                            className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        >
                            {/* Header: Title/Category & Status */}
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-[#193C6C] group-hover:text-blue-700 transition-colors">
                                    {ticket.title}
                                </h3>
                                <div className={`px-3 py-1 rounded-lg border text-xs font-bold ${ticket.status === 'completed' ? 'border-green-500 text-green-600 bg-green-50' :
                                    ticket.status === 'in_progress' ? 'border-orange-500 text-orange-500 bg-orange-50' :
                                        'border-red-500 text-red-600 bg-red-50'
                                    }`}>
                                    {ticket.status === 'not_start' ? 'Not Started' :
                                        ticket.status === 'in_progress' ? 'In Progress' : 'Completed'}
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-gray-800 font-medium text-lg mb-2 line-clamp-2">
                                {ticket.description || "No description"}
                            </p>

                            {/* Location */}
                            <p className="text-gray-500 text-base mb-6">
                                {ticket.room ? `Floor ${ticket.room.floor} , ${ticket.room.roomNumber}` : "Location N/A"}
                            </p>

                            {/* Footer: Date | User */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                <span className="text-gray-500 text-sm font-semibold">
                                    {new Date(ticket.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} PM | {new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                                </span>
                                <span className="text-gray-600 font-bold text-sm">
                                    {ticket.createdBy?.name || "User"}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                        <Search size={48} className="text-gray-200 mb-4" />
                        <p>No tickets found in this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketHistory;
