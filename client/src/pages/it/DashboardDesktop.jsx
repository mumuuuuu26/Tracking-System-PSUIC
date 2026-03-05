import React from "react";
import { Eye, CheckCircle, Clock, AlertCircle, XCircle } from "lucide-react";
import ITHeader from "../../components/it/ITHeader";
import { normalizeTicketStatus } from "../../utils/ticketStatus";
import { getUserDisplayName } from "../../utils/userIdentity";
import { formatCompactCount } from "../../utils/numberFormat";

const DashboardDesktop = ({
    tickets = [],
    stats,
    onAccept,
    onReject,
    navigate,
    newTicketsPage = 1,
    newTicketsTotalPages = 1,
    onPageChange,
}) => {

    // Filter for New Tickets (Not Started)
    const newTickets = tickets
        .filter((t) => normalizeTicketStatus(t.status) === "not_start")
        .sort((a, b) => {
            const createdDiff = new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            if (createdDiff !== 0) return createdDiff;
            return Number(b.id || 0) - Number(a.id || 0);
        });
    const pageSize = 5;
    const startIndex = (newTicketsPage - 1) * pageSize;
    const pageTickets = newTickets.slice(startIndex, startIndex + pageSize);

    // Stats Card Data
    const statCards = [
        {
            label: "Not Start",
            value: stats.notStart,
            icon: <AlertCircle size={24} />,
            bgIcon: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
            borderColor: "border-red-100 dark:border-red-800/30"
        },
        {
            label: "In Progress",
            value: stats.inProgress,
            icon: <Clock size={24} />,
            bgIcon: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
            borderColor: "border-orange-100 dark:border-orange-800/30"
        },
        {
            label: "Completed",
            value: stats.completed,
            icon: <CheckCircle size={24} />,
            bgIcon: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
            borderColor: "border-green-100 dark:border-green-800/30"
        },
        {
            label: "Rejected",
            value: stats.rejected,
            icon: <XCircle size={24} />,
            bgIcon: "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400",
            borderColor: "border-rose-100 dark:border-rose-800/30"
        }
    ];

    return (
        <div className="flex flex-col h-full space-y-6">

            {/* Header Section */}
            <ITHeader
                title="Dashboard"
                subtitle="Overview of your current workload and incoming requests."
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
                {statCards.map((stat, idx) => (
                    <div key={idx} className={`bg-white dark:bg-[#1a2f4e] px-6 py-5 rounded-[1.5rem] shadow-sm dark:shadow-lg flex items-center justify-between h-28 border border-transparent dark:border-blue-800/30 hover:border-gray-200 dark:hover:border-blue-700/50 transition-all`}>
                        <div className="flex flex-col justify-center">
                            <p className="text-[#1e2e4a] dark:text-white text-[clamp(1.4rem,2.3vw,2rem)] font-semibold mb-1 leading-none truncate max-w-[7ch]" title={String(stat.value)}>
                                {formatCompactCount(stat.value)}
                            </p>
                            <span className="text-gray-400 dark:text-blue-300/60 text-xs font-medium uppercase tracking-wide">{stat.label}</span>
                        </div>
                        <div className={`w-12 h-12 rounded-full ${stat.bgIcon} flex items-center justify-center shrink-0`}>
                            {stat.icon}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex-1 min-h-0">

                {/* New Tickets (Pool) */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-[#64748b] dark:text-blue-300/70 text-xs font-medium uppercase tracking-wider">New Tickets</h2>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/it/tickets')}
                                className="text-blue-600 dark:text-blue-400 text-xs font-bold hover:underline"
                            >
                                View All
                            </button>
                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-full text-xs font-bold border border-blue-100 dark:border-blue-800/40">
                                {newTickets.length} Available
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {newTickets.length > 0 ? (
                            pageTickets.map((ticket) => (
                                    <TicketCard
                                        key={ticket.id}
                                        ticket={ticket}
                                        onAccept={onAccept}
                                        onReject={onReject}
                                        onClick={() => navigate(`/it/ticket/${ticket.id}`)}
                                    />
                                ))
                        ) : (
                            <div className="bg-white dark:bg-[#1a2f4e] rounded-[1.5rem] p-12 text-center border border-dashed border-gray-200 dark:border-blue-800/30 text-gray-400 dark:text-blue-300/40 flex flex-col items-center justify-center h-48">
                                <CheckCircle size={48} className="text-gray-200 dark:text-blue-800/50 mb-4" />
                                <p>No new tickets available.</p>
                            </div>
                        )}
                    </div>

                    {newTicketsTotalPages > 1 && (
                        <div className="flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => onPageChange?.((page) => Math.max(1, page - 1))}
                                disabled={newTicketsPage === 1}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-blue-800/40 text-sm font-semibold text-[#1e2e4a] dark:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Prev
                            </button>
                            <span className="text-sm font-semibold text-[#1e2e4a] dark:text-blue-300 min-w-[6ch] text-center">
                                {newTicketsPage} / {newTicketsTotalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => onPageChange?.((page) => Math.min(newTicketsTotalPages, page + 1))}
                                disabled={newTicketsPage === newTicketsTotalPages}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-blue-800/40 text-sm font-semibold text-[#1e2e4a] dark:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

// Sub-components
const TicketCard = ({ ticket, onAccept, onReject, onClick }) => {
    const dateObj = new Date(ticket.createdAt);
    const reporterName = getUserDisplayName(ticket.createdBy, ticket.createdById ? `User #${ticket.createdById}` : "User");

    // Format Date: "14 Feb 26"
    const dateStr = dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });

    // Format Time: "16.29 PM"
    const timeStr = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", ".") + " PM";

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-[#1a2f4e] rounded-[1.5rem] p-6 shadow-sm dark:shadow-lg hover:shadow-md dark:hover:shadow-blue-900/20 transition-all border border-gray-100 dark:border-blue-800/30 cursor-pointer group flex flex-col gap-4"
        >
            {/* Header: Title | Status | Eye */}
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-[#1e2e4a] dark:text-white tracking-tight mb-1">
                        {ticket.title || "No Subject"}
                    </h3>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                        {ticket.category?.name || "General"}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); onClick(); }}
                        className="text-gray-400 dark:text-blue-300/50 hover:text-blue-600 dark:hover:text-blue-300 p-2 rounded-xl bg-gray-50 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/40 transition-colors"
                    >
                        <Eye size={20} />
                    </button>
                </div>
            </div>

            {/* Body: Description & Location */}
            <div>
                <h4 className="text-base font-medium text-gray-600 dark:text-gray-300 mb-2 line-clamp-2 leading-relaxed break-words">
                    {ticket.title || "-"}
                </h4>
                <p className="text-gray-500 dark:text-blue-300/60 text-sm">
                    Floor {ticket.room?.floor || "-"} , {ticket.room?.roomNumber || "-"}
                </p>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-gray-100 dark:bg-blue-800/40"></div>

            {/* Meta: Time | Date ... User */}
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-blue-300/60 font-medium">
                <div className="flex items-center gap-3">
                    <span>{timeStr}</span>
                    <span className="text-gray-300 dark:text-blue-700/60">|</span>
                    <span>{dateStr}</span>
                </div>
                <div className="font-bold text-[#1e2e4a] dark:text-white">
                    {reporterName}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
                <button
                    onClick={(e) => onAccept(e, ticket.id)}
                    className="flex-1 bg-[#1e2e4a] dark:bg-blue-600 text-white text-base font-bold py-3 rounded-xl hover:bg-[#132c4f] dark:hover:bg-blue-700 transition-colors shadow-sm shadow-blue-900/10 dark:shadow-blue-900/30"
                >
                    Accept
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onReject(ticket);
                    }}
                    className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-base font-bold py-3 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                    Reject
                </button>
            </div>
        </div>
    );
};

export default DashboardDesktop;
