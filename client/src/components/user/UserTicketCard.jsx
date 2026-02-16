import React from "react";
import { User } from "lucide-react";

/**
 * UserTicketCard Component
 * 
 * Displays a ticket in a standardized card format.
 * 
 * Design:
 * - Header: Category (Blue) | Status Badge (Right)
 * - Body: Title/Description (Prominent) | Location (Gray)
 * - Footer: Time | Date (Left) | User Name (Right)
 */
const UserTicketCard = ({ ticket, onClick }) => {
    if (!ticket) return null;

    // Status Config
    const getStatusConfig = (status) => {
        switch (status) {
            case "not_start":
                return {
                    label: "Not Started",
                    className: "border-gray-400 text-gray-500 bg-gray-50"
                };
            case "in_progress":
                return {
                    label: "In Progress",
                    className: "border-blue-500 text-blue-600 bg-blue-50"
                };
            case "completed":
                return {
                    label: "Completed",
                    className: "border-green-500 text-green-600 bg-green-50"
                };
            default:
                return {
                    label: status,
                    className: "border-gray-300 text-gray-500 bg-gray-50"
                };
        }
    };

    const statusConfig = getStatusConfig(ticket.status);
    const dateObj = new Date(ticket.updatedAt || ticket.createdAt);

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-3xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-gray-100 relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer mb-4"
        >
            {/* Header: Category & Status */}
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-xl font-bold text-[#193C6C] tracking-tight">
                    {ticket.category?.name || "General Issue"}
                </h3>
                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${statusConfig.className}`}>
                    {statusConfig.label}
                </span>
            </div>

            {/* Body: Title/Desc & Location */}
            <div className="mb-6">
                <h4 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 leading-relaxed">
                    {ticket.description || "-"}
                </h4>
                <p className="text-gray-400 text-xs font-semibold bg-gray-50 inline-block px-2 py-1 rounded-md">
                    Floor {ticket.room?.floor || "-"} , {ticket.room?.roomNumber || "-"}
                </p>
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-gray-100 mb-4"></div>

            {/* Footer: Time/Date & User */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                    <span>
                        {dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", ".")} PM
                    </span>
                    <span className="text-gray-300">|</span>
                    <span>
                        {dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
                    </span>
                </div>

                <span className="text-sm font-bold text-[#193C6C]">
                    User
                </span>
            </div>
        </div>
    );
};

export default UserTicketCard;
