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
            listCategories(token)
                .then(res => setCategories(res.data))
                .catch(() => { /* handle error silently or via global toast */ });

            const ticketRes = await getTicketHistory({ categoryId: filters.categoryId });
            setTickets(ticketRes.data);
        } catch {
            // error handled silently or via global toast
        } finally {
            setLoading(false);
        }
    }, [token, filters.categoryId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <div className="space-y-6">
            {/* Filter Pills */}
            <div className="flex flex-row items-center gap-3">
                <div className="flex-1 flex gap-2 overflow-x-auto w-full no-scrollbar pb-2">
                    <button
                        onClick={() => setFilters(prev => ({ ...prev, categoryId: "all" }))}
                        className={`px-5 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${filters.categoryId === "all"
                            ? "bg-blue-600 dark:bg-[#193C6C] text-white border-blue-400 dark:border-blue-500/60 shadow-md"
                            : "bg-white dark:bg-[#1a2f4e] text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-700/40 hover:bg-blue-50 dark:hover:bg-[#1e3558]"
                            }`}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setFilters(prev => ({ ...prev, categoryId: cat.id }))}
                            className={`px-5 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${filters.categoryId === cat.id
                                ? "bg-blue-600 dark:bg-[#193C6C] text-white border-blue-400 dark:border-blue-500/60 shadow-md"
                                : "bg-white dark:bg-[#1a2f4e] text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-700/40 hover:bg-blue-50 dark:hover:bg-[#1e3558]"
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Ticket List */}
            <div className="space-y-2 pb-20">
                {loading ? (
                    <div className="text-center py-20 text-gray-400 dark:text-blue-400/60 text-sm animate-pulse">Loading history...</div>
                ) : tickets.length > 0 ? (
                    tickets.map((ticket) => (
                        <UserTicketCard
                            key={ticket.id}
                            ticket={ticket}
                            onClick={() => navigate(`/user/ticket/${ticket.id}`)}
                        />
                    ))
                ) : (
                    <div className="text-center py-20 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-[#1a2f4e] border border-blue-100 dark:border-blue-800/40 flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <Search size={28} className="text-blue-500 dark:text-blue-400/80" />
                        </div>
                        <p className="text-gray-500 dark:text-blue-300/60 text-sm">No tickets found in this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TicketHistory;
