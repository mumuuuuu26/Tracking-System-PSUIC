import React, { useEffect, useState, useCallback } from "react";
import { Search } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { getTicketHistory } from "../../api/ticket";
import { listCategories } from "../../api/category";
import { useNavigate } from "react-router-dom";
import UserTicketCard from "./UserTicketCard";

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
                <div className="flex-1 flex gap-2 overflow-x-auto w-full no-scrollbar pb-2">
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, categoryId: "all" }))}
                        className={`px-6 py-2 rounded-full text-sm font-bold border transition-all whitespace-nowrap ${filters.categoryId === "all"
                            ? "bg-[#193C6C] text-white border-[#193C6C] shadow-md"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setFilters(prev => ({ ...prev, categoryId: cat.id }))}
                            className={`px-6 py-2 rounded-full text-sm font-bold border transition-all whitespace-nowrap ${filters.categoryId === cat.id
                                ? "bg-[#193C6C] text-white border-[#193C6C] shadow-md"
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="space-y-4 pb-20">
                {loading ? (
                    <div className="text-center py-20 text-gray-400 animate-pulse">Loading history...</div>
                ) : tickets.length > 0 ? (
                    tickets.map((ticket) => (
                        <UserTicketCard
                            key={ticket.id}
                            ticket={ticket}
                            onClick={() => navigate(`/user/ticket/${ticket.id}`)}
                        />
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
