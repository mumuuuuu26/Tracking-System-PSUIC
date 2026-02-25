import React, { useEffect, useState, useCallback, useRef } from "react";
import { Search, ChevronDown } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { getTicketHistory } from "../../api/ticket";
import { listCategories } from "../../api/category";
import { listRooms } from "../../api/room";
import { useNavigate } from "react-router-dom";
import UserTicketCard from "./UserTicketCard";
import { toFloorDisplay, toRoomDisplay } from "../../utils/roomDisplay";

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
        <div className="relative w-full min-w-0" ref={ref}>
            <button
                type="button"
                data-testid={testId}
                onClick={() => setOpen((v) => !v)}
                className={`w-full min-h-[46px] px-3 py-3 bg-white dark:bg-[#1a2f4e] rounded-xl flex items-center justify-between cursor-pointer transition-all text-[13px] md:text-sm border ${open
                    ? "border-gray-400 dark:border-blue-700/70"
                    : "border-gray-300 dark:border-blue-700/50"
                    }`}
            >
                <span className={`${selected ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-blue-400/50"} block flex-1 min-w-0 text-left pr-2 leading-5 whitespace-normal break-words`}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`shrink-0 text-gray-400 dark:text-blue-400/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
                />
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-2 z-50 min-w-full w-max max-w-[calc(100vw-3rem)] bg-white dark:bg-[#152540] border border-gray-200 dark:border-blue-700/50 rounded-2xl shadow-xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
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
                                    <span className={`text-[13px] md:text-sm leading-5 whitespace-normal break-words ${isSel ? "font-bold" : "font-medium"}`}>
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

const TicketHistory = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const categoryScrollRef = useRef(null);

    const [filterCategoryId, setFilterCategoryId] = useState("all");
    const [filterFloor, setFilterFloor] = useState("");
    const [filterRoomId, setFilterRoomId] = useState("");

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [catRes, roomRes] = await Promise.all([
                listCategories(token).catch(() => ({ data: [] })),
                listRooms().catch(() => ({ data: [] }))
            ]);

            setCategories(catRes.data);
            setRooms(roomRes.data);

            const ticketRes = await getTicketHistory({ categoryId: filterCategoryId });
            setTickets(ticketRes.data);
        } catch {
            // error handled silently or via global toast
        } finally {
            setLoading(false);
        }
    }, [token, filterCategoryId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const floorOptions = [
        { value: "", label: "All Floors" },
        ...Array.from(new Set(rooms.map((r) => String(r.floor)).filter(Boolean)))
            .sort((a, b) => Number(a) - Number(b))
            .map((floor) => ({
                value: floor,
                label: toFloorDisplay(floor),
            })),
    ];

    const visibleRooms = filterFloor
        ? rooms.filter((r) => String(r.floor) === filterFloor)
        : rooms;

    const roomOptions = [
        { value: "", label: "All Rooms" },
        ...visibleRooms.map((r) => ({
            value: String(r.id),
            label: toRoomDisplay(r.roomNumber),
        })),
    ];

    const filteredTickets = tickets.filter((t) => {
        if (filterFloor && String(t.room?.floor ?? "") !== filterFloor) return false;
        if (filterRoomId && String(t.room?.id ?? "") !== filterRoomId) return false;
        return true;
    });

    const handleCategoryWheel = (e) => {
        const el = categoryScrollRef.current;
        if (!el || el.scrollWidth <= el.clientWidth) return;
        if (Math.abs(e.deltaY) < 1 && Math.abs(e.deltaX) < 1) return;
        e.preventDefault();
        el.scrollLeft += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    };

    return (
        <div className="space-y-4">
            {/* Category (scroll chips) */}
            <div className="relative">
                <div
                    ref={categoryScrollRef}
                    onWheel={handleCategoryWheel}
                    className="flex gap-2 overflow-x-auto no-scrollbar pb-1 touch-pan-x lg:flex-wrap lg:overflow-visible lg:touch-auto"
                >
                    <button
                        type="button"
                        data-testid="user-history-filter-category-all"
                        onClick={() => setFilterCategoryId("all")}
                        className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${filterCategoryId === "all"
                            ? "bg-[#1e2e4a] text-white border-transparent"
                            : "bg-white dark:bg-[#1a2f4e] text-[#1e2e4a] dark:text-blue-200 border-gray-300 dark:border-blue-700/50"
                            }`}
                    >
                        All Categories
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            data-testid={`user-history-filter-category-${cat.id}`}
                            onClick={() => setFilterCategoryId(String(cat.id))}
                            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${filterCategoryId === String(cat.id)
                                ? "bg-[#1e2e4a] text-white border-transparent"
                                : "bg-white dark:bg-[#1a2f4e] text-[#1e2e4a] dark:text-blue-200 border-gray-300 dark:border-blue-700/50"
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Floor + Room */}
            <div className="grid grid-cols-2 gap-3 items-start">
                <DarkSelect
                    options={floorOptions}
                    value={filterFloor}
                    onChange={(value) => {
                        setFilterFloor(value);
                        setFilterRoomId("");
                    }}
                    placeholder="All Floors"
                    testId="history-filter-floor"
                />
                <DarkSelect
                    options={roomOptions}
                    value={filterRoomId}
                    onChange={setFilterRoomId}
                    placeholder="All Rooms"
                    testId="history-filter-room"
                />
            </div>

            {/* Result count */}
            {!loading && (
                <p className="text-gray-500 dark:text-blue-400/50 text-xs font-medium">
                    {filteredTickets.length} ticket{filteredTickets.length !== 1 ? "s" : ""} found
                </p>
            )}

            {/* Ticket List */}
            <div className="space-y-4 pb-20" data-testid="ticket-table">
                {loading ? (
                    <div className="text-center py-20 text-blue-400/60 text-sm animate-pulse">Loading history...</div>
                ) : filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket) => (
                        <UserTicketCard
                            key={ticket.id}
                            ticket={ticket}
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
    );
};

export default TicketHistory;
