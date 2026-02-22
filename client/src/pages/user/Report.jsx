import React, { useEffect, useState, useCallback, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import { listMyTickets } from "../../api/ticket";
import { listRooms } from "../../api/room";
import { useNavigate } from "react-router-dom";
import UserWrapper from "../../components/user/UserWrapper";
import UserPageHeader from "../../components/user/UserPageHeader";
import UserTicketCard from "../../components/user/UserTicketCard";

// ─── Inline custom dropdown (dark themed, always opens below) ───────────────
const DarkSelect = ({ options, value, onChange, placeholder, testId }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selected = options.find((o) => o.value === value);

    return (
        <div className="relative w-full" ref={ref}>
            <button
                type="button"
                data-testid={testId}
                onClick={() => setOpen((v) => !v)}
                className={`w-full px-4 py-3 bg-white dark:bg-[#1a2f4e] rounded-xl flex items-center justify-between cursor-pointer transition-all text-sm border ${open
                    ? "border-gray-400 dark:border-blue-700/70"
                    : "border-gray-300 dark:border-blue-700/50"
                    }`}
            >
                <span className={selected ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-blue-400/50"}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`text-gray-400 dark:text-blue-400/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white dark:bg-[#152540] border border-gray-200 dark:border-blue-700/50 rounded-2xl shadow-xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
                    <div className="max-h-60 overflow-y-auto p-2">
                        {options.map((opt) => {
                            const isSel = opt.value === value;
                            return (
                                <div
                                    key={opt.value}
                                    onClick={() => {
                                        onChange(opt.value);
                                        setOpen(false);
                                    }}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors mb-1 last:mb-0 ${isSel
                                        ? "bg-blue-50 dark:bg-[#193C6C] text-blue-700 dark:text-white"
                                        : "text-gray-700 dark:text-blue-200 hover:bg-gray-50 dark:hover:bg-blue-800/40"
                                        }`}
                                >
                                    <span className={`text-sm ${isSel ? "font-bold" : "font-medium"}`}>
                                        {opt.label}
                                    </span>

                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
// ─────────────────────────────────────────────────────────────────────────────

const Report = () => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filterStatus, setFilterStatus] = useState("All");
    const [filterRoomId, setFilterRoomId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [ticketRes, roomRes] = await Promise.all([
                listMyTickets(),
                listRooms(),
            ]);
            setTickets(ticketRes.data);
            setRooms(roomRes.data);
        } catch {
            // Silent fail — tickets list will remain empty
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Build option arrays
    const statusOptions = [
        { value: "All", label: "All" },
        { value: "Not Started", label: "Not Started" },
        { value: "In progress", label: "In Progress" },
        { value: "Completed", label: "Completed" },
        { value: "Rejected", label: "Rejected" },
    ];

    const roomOptions = [
        { value: "", label: "All Rooms" },
        ...rooms.map((r) => ({
            value: String(r.id),
            label: `${r.roomNumber} (F${r.floor})`,
        })),
    ];

    const filteredTickets = tickets.filter((t) => {
        if (filterStatus !== "All") {
            if (filterStatus === "Not Started" && t.status !== "not_start") return false;
            if (filterStatus === "In progress" && t.status !== "in_progress") return false;
            if (filterStatus === "Completed" && t.status !== "completed") return false;
            if (filterStatus === "Rejected" && t.status !== "rejected") return false;
        }
        if (filterRoomId && String(t.room?.id) !== filterRoomId) return false;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return (
                (t.title?.toLowerCase() || "").includes(term) ||
                (t.description?.toLowerCase() || "").includes(term) ||
                (t.category?.name?.toLowerCase() || "").includes(term)
            );
        }
        return true;
    });

    return (
        <UserWrapper>
            <div className="pb-24 bg-gray-50 dark:bg-[#0d1b2a] min-h-screen">
                <UserPageHeader title="Activity" titleTestId="report-page" />

                <div className="max-w-md md:max-w-2xl mx-auto px-6 mt-6 space-y-4">

                    {/* Search and Room Filter */}
                    <div className="flex items-center gap-3">
                        <div className="relative shadow-sm rounded-xl flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-blue-400/60 w-4 h-4" />
                            <input
                                type="text"
                                data-testid="filter-search"
                                placeholder="Search tickets..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white dark:bg-[#1a2f4e] border border-gray-300 dark:border-blue-700/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-blue-400/40 outline-none transition-colors"
                            />
                        </div>
                        {/* Room (from DB) */}
                        <div className="w-[140px] md:w-[180px] shrink-0">
                            <DarkSelect
                                options={roomOptions}
                                value={filterRoomId}
                                onChange={setFilterRoomId}
                                placeholder="All Rooms"
                                testId="filter-room"
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col gap-3">
                        {/* Status Pills */}
                        <div className="flex-1 flex gap-2 overflow-x-auto w-full no-scrollbar pb-1">
                            {statusOptions.map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => setFilterStatus(opt.value)}
                                    className={`px-5 py-2.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${filterStatus === opt.value
                                        ? "bg-[#1e2e4a] dark:bg-[#193C6C] text-white border-transparent shadow-md"
                                        : "bg-white dark:bg-[#1a2f4e] text-[#1e2e4a] dark:text-blue-300 border-gray-200 dark:border-blue-700/40 hover:bg-gray-50 dark:hover:bg-[#1e3558]"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Result count */}
                    {!loading && (
                        <p className="text-gray-500 dark:text-blue-400/50 text-xs font-medium">
                            {filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""} found
                        </p>
                    )}

                    {/* Ticket List */}
                    <div className="space-y-0" data-testid="ticket-table">
                        {loading ? (
                            <div className="text-center py-20 text-blue-400/60 text-sm animate-pulse">Loading...</div>
                        ) : filteredTickets.length > 0 ? (
                            filteredTickets.map((ticket) => (
                                <UserTicketCard
                                    key={ticket.id}
                                    ticket={ticket}
                                    dataTestId="ticket-row"
                                    onClick={() => navigate(`/user/ticket/${ticket.id}`)}
                                />
                            ))
                        ) : (
                            <div className="text-center py-20 flex flex-col items-center">
                                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-[#1a2f4e] border border-blue-100 dark:border-blue-800/40 flex items-center justify-center mx-auto mb-4 shadow-inner">
                                    <Search size={24} className="text-blue-400 dark:text-blue-400/80" />
                                </div>
                                <p className="text-gray-500 dark:text-blue-300/60 text-sm">No tickets found</p>
                                <p className="text-gray-400 dark:text-blue-400/30 text-xs mt-1">Try adjusting your filters</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </UserWrapper>
    );
};

export default Report;
