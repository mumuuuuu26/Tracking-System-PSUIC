import React from "react";
import { Star } from "lucide-react";
import { toRoomFloorDisplay } from "../../utils/roomDisplay";

/**
 * UserTicketCard Component
 * 
 * Displays a ticket in a standardized card format — Dark Navy Theme.
 * 
 * Design:
 * - Header: Category (Blue accent) | Status Badge (Right)
 * - Body: Title/Description (White) | Location (Blue pill)
 * - Footer: Time | Date (Left) | User badge (Right)
 */
const UserTicketCard = ({ ticket, onClick }) => {
    if (!ticket) return null;

    // Status Config — dark navy compatible
    const getStatusConfig = (status) => {
        switch (status) {
            case "not_start":
            case "pending":
                return {
                    label: "Not Started",
                    className: "border-gray-200 dark:border-slate-500/60 text-gray-500 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/40"
                };
            case "in_progress":
                return {
                    label: "In Progress",
                    className: "border-blue-200 dark:border-blue-500/60 text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-700/40"
                };
            case "completed":
                return {
                    label: "Completed",
                    className: "border-emerald-200 dark:border-emerald-500/60 text-emerald-600 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-800/40"
                };
            case "rejected":
                return {
                    label: "Rejected",
                    className: "border-red-200 dark:border-red-500/60 text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-800/40"
                };
            default:
                return {
                    label: "Not Started",
                    className: "border-gray-200 dark:border-slate-500/60 text-gray-500 dark:text-slate-300 bg-gray-50 dark:bg-slate-700/40"
                };
        }
    };

    const statusConfig = getStatusConfig(ticket.status);
    const dateObj = new Date(ticket.updatedAt || ticket.createdAt);

    return (
        <div
            onClick={onClick}
            data-testid="ticket-row"
            className="bg-white dark:bg-[#1a2f4e] rounded-2xl p-5 border border-gray-200 dark:border-gray-700/30 relative overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md dark:shadow-none dark:hover:shadow-[0_4px_20px_rgba(25,60,108,0.4)] cursor-pointer group"
        >
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-blue-50 dark:from-blue-600/5 to-transparent pointer-events-none"></div>

            {/* Header: Category & Status */}
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-blue-700 dark:text-blue-300 font-bold text-base tracking-tight">
                    {ticket.category?.name || "General Issue"}
                    {ticket.subComponent ? ` · ${ticket.subComponent}` : ""}
                </h3>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold border shrink-0 ml-2 ${statusConfig.className}`}>
                    {statusConfig.label}
                </span>
            </div>

            {/* Body: Title/Desc & Location */}
            <div className="mb-5">
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 leading-relaxed">
                    {ticket.description || "-"}
                </h4>
                <span className="text-blue-600 dark:text-blue-400/80 text-xs font-semibold bg-blue-50 dark:bg-blue-900/50 inline-block px-2.5 py-1 rounded-lg border border-gray-200 dark:border-gray-600/40">
                    {toRoomFloorDisplay(ticket.room)}
                </span>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-gray-100 dark:bg-blue-800/30 mb-4 transition-colors"></div>

            {/* Footer: Time/Date & User */}
            <div className="flex flex-wrap items-center justify-between gap-y-3">
                <div className="flex items-center shrink-0 gap-2 text-xs font-medium text-gray-500 dark:text-blue-400/70">
                    <span>
                        {dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                    </span>
                    <span className="text-gray-300 dark:text-blue-700">|</span>
                    <span>
                        {dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                    </span>
                </div>

                <div className="flex items-center gap-2 justify-end">
                    {/* Survey Link for Completed Tickets */}
                    {ticket.status === "completed" && (
                        <a
                            href="https://docs.google.com/forms/d/e/1FAIpQLSe2rO383UTujd71fYgMwdbHcWuRm4NaKGMEmRIv-T_fya8Dcw/viewform"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center justify-center gap-2 text-[11px] sm:text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/40 dark:hover:bg-blue-800/60 px-3 sm:px-4 shrink-0 rounded-[0.8rem] border-[1.5px] border-blue-200 dark:border-blue-700/50 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/50 active:scale-95 h-[36px] sm:h-[40px]"
                        >
                            <Star size={16} className="text-blue-700 dark:text-blue-300 shrink-0" />
                            <span>Rating</span>
                        </a>
                    )}
                    {/* Testing Contract Button */}
                    <button
                        data-testid="ticket-open"
                        className="opacity-0 w-0 h-0 overflow-hidden absolute"
                        aria-hidden="true"
                        tabIndex="-1"
                    >
                        ดูรายละเอียด
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserTicketCard;
