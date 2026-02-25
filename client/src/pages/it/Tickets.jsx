import React, { useEffect, useState, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, FileText } from "lucide-react";
import { getAllTickets } from "../../api/ticket";
import { listRooms } from "../../api/room";
import { useNavigate, useSearchParams } from "react-router-dom";
import socket from "../../utils/socket";
import ITHeader from "../../components/it/ITHeader";
import ITPageHeader from "../../components/it/ITPageHeader";
import ITWrapper from "../../components/it/ITWrapper";
import { getUserDisplayName } from "../../utils/userIdentity";
import { normalizeTicketStatus, toTicketStatusLabel } from "../../utils/ticketStatus";

const STATUS_OPTIONS = [
    { value: "all", label: "All" },
    { value: "not_start", label: "Not Start" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "rejected", label: "Rejected" },
];

const normalizeStatusFilter = (rawStatus) => {
    if (!rawStatus) return "all";

    const normalized = String(rawStatus).trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (normalized === "all") return "all";
    return normalizeTicketStatus(rawStatus);
};

const DarkSelect = ({ options, value, onChange, placeholder, testId }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selected = options.find((option) => option.value === value);

    return (
        <div className="relative w-full min-w-0" ref={ref}>
            <button
                type="button"
                data-testid={testId}
                onClick={() => setOpen((prev) => !prev)}
                className={`w-full min-h-[46px] px-3 py-3 bg-white dark:bg-[#1a2f4e] rounded-xl flex items-center justify-between cursor-pointer transition-all text-[13px] md:text-sm border ${open
                    ? "border-gray-400 dark:border-blue-700/70"
                    : "border-gray-300 dark:border-blue-700/50"
                    }`}
            >
                <span
                    className={`${selected ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-blue-400/50"
                        } block flex-1 min-w-0 text-left pr-2 leading-5 whitespace-normal break-words`}
                >
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown
                    size={16}
                    className={`shrink-0 text-gray-400 dark:text-blue-400/60 transition-transform duration-200 ${open ? "rotate-180" : ""
                        }`}
                />
            </button>

            {open && (
                <div className="absolute top-full left-0 mt-2 z-50 min-w-full w-max max-w-[calc(100vw-3rem)] bg-white dark:bg-[#152540] border border-gray-200 dark:border-blue-700/50 rounded-2xl shadow-xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
                    <div className="max-h-60 overflow-y-auto p-2">
                        {options.map((option) => {
                            const isSelected = option.value === value;
                            return (
                                <div
                                    key={option.value}
                                    onClick={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors mb-1 last:mb-0 ${isSelected
                                        ? "bg-blue-50 dark:bg-[#193C6C] text-blue-700 dark:text-white"
                                        : "text-gray-700 dark:text-blue-200 hover:bg-gray-50 dark:hover:bg-blue-800/40"
                                        }`}
                                >
                                    <span className={`text-[13px] md:text-sm leading-5 whitespace-normal break-words ${isSelected ? "font-bold" : "font-medium"
                                        }`}>
                                        {option.label}
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

const Tickets = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [tickets, setTickets] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTickets, setTotalTickets] = useState(0);

    const [filterStatus, setFilterStatus] = useState(
        normalizeStatusFilter(searchParams.get("status"))
    );
    const [filterFloor, setFilterFloor] = useState(searchParams.get("floor") || "");
    const [filterRoomId, setFilterRoomId] = useState(searchParams.get("roomId") || "");

    const loadRooms = useCallback(async () => {
        try {
            const response = await listRooms();
            setRooms(Array.isArray(response.data) ? response.data : []);
        } catch {
            setRooms([]);
        }
    }, []);

    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, filterFloor, filterRoomId]);

    const loadTickets = useCallback(async () => {
        try {
            setLoading(true);

            const params = {
                page: currentPage,
                limit: 5,
                status: filterStatus === "all" ? undefined : filterStatus,
                floor: filterFloor || undefined,
                roomId: filterRoomId || undefined,
            };

            const newParams = {};
            if (filterStatus !== "all") newParams.status = filterStatus;
            if (filterFloor) newParams.floor = filterFloor;
            if (filterRoomId) newParams.roomId = filterRoomId;
            setSearchParams(newParams, { replace: true });

            const response = await getAllTickets(params);
            const list = Array.isArray(response.data?.data) ? response.data.data : [];

            setTickets(
                list.map((ticket) => ({
                    ...ticket,
                    status: normalizeTicketStatus(ticket.status),
                }))
            );
            setTotalTickets(Number(response.data?.total || 0));
            setTotalPages(Math.max(1, Number(response.data?.totalPages || 1)));
        } catch {
            setTickets([]);
            setTotalTickets(0);
            setTotalPages(1);
        } finally {
            setLoading(false);
        }
    }, [currentPage, filterStatus, filterFloor, filterRoomId, setSearchParams]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    useEffect(() => {
        const handleTicketUpdate = () => {
            loadTickets();
        };

        socket.on("server:new-ticket", handleTicketUpdate);
        socket.on("server:update-ticket", handleTicketUpdate);

        return () => {
            socket.off("server:new-ticket", handleTicketUpdate);
            socket.off("server:update-ticket", handleTicketUpdate);
        };
    }, [loadTickets]);

    const floorOptions = [
        { value: "", label: "All Floors" },
        ...Array.from(new Set(rooms.map((room) => String(room.floor)).filter(Boolean)))
            .sort((a, b) => Number(a) - Number(b))
            .map((floor) => ({
                value: floor,
                label: `Floor ${floor}`,
            })),
    ];

    const visibleRooms = filterFloor
        ? rooms.filter((room) => String(room.floor) === filterFloor)
        : rooms;

    const roomOptions = [
        { value: "", label: "All Rooms" },
        ...visibleRooms.map((room) => ({
            value: String(room.id),
            label: `Room ${room.roomNumber}`,
        })),
    ];

    return (
        <ITWrapper>
            <div className="flex flex-col min-h-[calc(100vh-6rem)]">
                <div className="hidden lg:block mb-6">
                    <ITHeader title="All Tickets" subtitle="Manage and track all support requests." />
                </div>

                <div className="lg:hidden mb-4">
                    <ITPageHeader title="All Tickets" />
                </div>

                <div className="flex flex-col gap-3 mb-4 sticky top-0 z-10 bg-gray-50/95 dark:bg-[#0d1b2a]/95 backdrop-blur pt-2 pb-2 border-b border-transparent dark:border-blue-900/30">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {STATUS_OPTIONS.map((status) => (
                            <button
                                key={status.value}
                                type="button"
                                data-testid={`it-filter-status-${status.value}`}
                                onClick={() => setFilterStatus(status.value)}
                                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap border transition-colors ${filterStatus === status.value
                                    ? "bg-[#1e2e4a] text-white border-transparent"
                                    : "bg-white dark:bg-[#1a2f4e] text-[#1e2e4a] dark:text-blue-200 border-gray-300 dark:border-blue-700/50"
                                    }`}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-start">
                        <DarkSelect
                            options={floorOptions}
                            value={filterFloor}
                            onChange={(value) => {
                                setFilterFloor(value);
                                setFilterRoomId("");
                            }}
                            placeholder="All Floors"
                            testId="it-filter-floor"
                        />
                        <DarkSelect
                            options={roomOptions}
                            value={filterRoomId}
                            onChange={setFilterRoomId}
                            placeholder="All Rooms"
                            testId="it-filter-room"
                        />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-gray-500 dark:text-blue-400/60 text-xs font-medium">
                            {loading ? "Loading..." : `${totalTickets} ticket${totalTickets !== 1 ? "s" : ""} found`}
                        </p>
                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-400 dark:text-blue-300/50 whitespace-nowrap">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-blue-900/30 disabled:opacity-30 transition-colors"
                                >
                                    <ChevronLeft size={18} className="text-[#1e2e4a] dark:text-blue-300" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-blue-900/30 disabled:opacity-30 transition-colors"
                                >
                                    <ChevronRight size={18} className="text-[#1e2e4a] dark:text-blue-300" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pb-20">
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="h-32 bg-gray-100 dark:bg-blue-900/20 rounded-2xl animate-pulse"></div>
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
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-blue-300/40">
                            <div className="w-16 h-16 bg-gray-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                                <FileText size={28} className="opacity-50" />
                            </div>
                            <p className="font-semibold text-gray-600 dark:text-white/70">No tickets found</p>
                            <p className="text-xs mt-1 text-gray-400 dark:text-blue-300/50">Try adjusting your filters</p>
                        </div>
                    )}
                </div>

            </div>
        </ITWrapper>
    );
};

const TicketCard = ({ ticket, navigate }) => {
    const getStatusConfig = (status) => {
        switch (normalizeTicketStatus(status)) {
            case "not_start":
            case "pending":
                return {
                    label: "Not Start",
                    className: "border-gray-200 dark:border-slate-500/60 text-gray-500 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/40",
                };
            case "in_progress":
                return {
                    label: "In Progress",
                    className: "border-blue-200 dark:border-blue-500/60 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-700/40",
                };
            case "completed":
                return {
                    label: "Completed",
                    className: "border-emerald-200 dark:border-emerald-500/60 text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-800/40",
                };
            case "rejected":
                return {
                    label: "Rejected",
                    className: "border-rose-200 dark:border-rose-500/60 text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-800/40",
                };
            default:
                return {
                    label: "Not Start",
                    className: "border-gray-200 dark:border-slate-500/60 text-gray-500 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/40",
                };
        }
    };

    const statusConfig = getStatusConfig(ticket.status);
    const dateObj = new Date(ticket.updatedAt || ticket.createdAt);
    const normalizedStatus = normalizeTicketStatus(ticket.status);
    const reporterName = getUserDisplayName(
        ticket.createdBy,
        ticket.createdById ? `User #${ticket.createdById}` : "User"
    );

    return (
        <div
            onClick={() => navigate(`/it/ticket/${ticket.id}`)}
            className="bg-white dark:bg-[#1a2f4e] rounded-2xl p-5 border border-gray-200 dark:border-gray-700/30 relative overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-[0_4px_20px_rgba(25,60,108,0.4)] cursor-pointer group"
        >
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-50 dark:from-blue-600/5 to-transparent pointer-events-none"></div>

            <div className="relative flex justify-between items-start mb-3 gap-3">
                <h3 className="text-blue-700 dark:text-blue-300 font-bold text-base tracking-tight">
                    {ticket.category?.name || "General Issue"}
                    {ticket.subComponent ? ` · ${ticket.subComponent}` : ""}
                </h3>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border shrink-0 ${statusConfig.className}`}>
                    {toTicketStatusLabel(normalizedStatus)}
                </span>
            </div>

            <div className="relative mb-4">
                <p className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-relaxed">
                    {ticket.description || ticket.title || "No description provided"}
                </p>
                <span className="text-blue-600 dark:text-blue-400/80 text-xs font-semibold bg-blue-50 dark:bg-blue-900/50 inline-block px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600/40">
                    Floor {ticket.room?.floor || "-"} · Room {ticket.room?.roomNumber || "-"}
                </span>
            </div>

            <div className="relative h-px w-full bg-gray-100 dark:bg-blue-800/30 mb-4"></div>

            <div className="relative flex flex-wrap items-center justify-between gap-y-3">
                <div className="flex items-center shrink-0 gap-2 text-xs font-medium text-gray-500 dark:text-blue-400/70">
                    <span>
                        {dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </span>
                    <span className="text-gray-300 dark:text-blue-700">|</span>
                    <span>
                        {dateObj.toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                        })}
                    </span>
                </div>

                <span className="text-sm font-semibold text-gray-500 dark:text-blue-300/70 truncate max-w-[52%] text-right">
                    {reporterName}
                </span>
            </div>
        </div>
    );
};

export default Tickets;
