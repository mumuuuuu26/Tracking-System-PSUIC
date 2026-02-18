import React, { useEffect, useState, useCallback } from "react";
import { Search, MapPin, Clock } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { listMyTickets } from "../../api/ticket";
import { useNavigate } from "react-router-dom";
import UserWrapper from "../../components/user/UserWrapper";

import UserPageHeader from "../../components/user/UserPageHeader";

import UserTicketCard from "../../components/user/UserTicketCard";

const Report = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await listMyTickets(token);
            setTickets(res.data);
        } catch (err) {
            console.error("Ticket Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredTickets = tickets.filter((t) => {
        // Status Filter
        if (filter !== "All") {
            if (filter === "Not Started" && t.status !== "not_start") return false;
            if (filter === "In progress" && t.status !== "in_progress") return false;
            if (filter === "Completed" && t.status !== "completed") return false;
            if (filter === "Rejected" && t.status !== "rejected") return false;
        }

        // Search Filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const title = t.title?.toLowerCase() || "";
            const desc = t.description?.toLowerCase() || "";
            const category = t.category?.name?.toLowerCase() || "";
            return title.includes(term) || desc.includes(term) || category.includes(term);
        }
        return true;
    });

    return (
        <UserWrapper>
            <div className="pb-24 min-h-screen bg-slate-50">
                {/* Header */}
                <UserPageHeader title="Activity" />

                <div className="max-w-md mx-auto px-6 mt-6">
                    {/* Search Bar */}
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search active tickets..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border-none shadow-sm bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-3 overflow-x-auto no-scrollbar mb-6 pb-2">
                        {["All", "Not Started", "In progress", "Completed", "Rejected"].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-6 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all border ${filter === f
                                    ? "bg-[#193C6C] text-white border-[#193C6C] shadow-md"
                                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Ticket List */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-10 text-gray-400">Loading...</div>
                        ) : filteredTickets.length > 0 ? (
                            filteredTickets.map((ticket) => (
                                <UserTicketCard
                                    key={ticket.id}
                                    ticket={ticket}
                                    onClick={() => navigate(`/user/ticket/${ticket.id}`)}
                                />
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                No tickets found
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </UserWrapper>
    );
};

export default Report;
