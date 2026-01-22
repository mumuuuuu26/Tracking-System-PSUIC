import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Clock, AlertCircle, User, MapPin, Calendar, ArrowLeft, Upload, FileText, Check, X, Ban, Briefcase } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { getTicket } from "../../api/ticket";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "react-toastify";

dayjs.extend(relativeTime);

const AdminTicketDetail = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadTicket = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getTicket(token, id);
            setTicket(res.data);
        } catch (err) {
            console.error("Failed to load ticket:", err);
            toast.error("Failed to load ticket details");
        } finally {
            setLoading(false);
        }
    }, [token, id]);

    useEffect(() => {
        loadTicket();
    }, [loadTicket]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    if (!ticket) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <h2 className="text-xl font-bold text-gray-700 mb-2">Ticket Not Found</h2>
            <button onClick={() => navigate("/admin/tickets")} className="text-blue-500 hover:underline">Back to All Tickets</button>
        </div>
    );

    const steps = [
        { label: "OPEN", status: "pending", active: true },
        { label: "WORKING", status: "in_progress", active: ["in_progress", "fixed", "rejected"].includes(ticket.status) },
        { label: "DONE", status: "fixed", active: ["fixed", "rejected"].includes(ticket.status) }
    ];

    const getUrgencyBadge = (urgency) => {
        switch (urgency) {
            case "Critical": return "bg-red-100 text-red-600 border border-red-200";
            case "High": return "bg-orange-100 text-orange-600 border border-orange-200";
            case "Medium": return "bg-yellow-100 text-yellow-600 border border-yellow-200";
            default: return "bg-green-100 text-green-600 border border-green-200";
        }
    };

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Header with Back Button */}
            <div className="px-6 pt-8 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="text-blue-600" strokeWidth={3} size={24} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-lg font-bold text-blue-600">#TK-{String(ticket.id).padStart(2, '0')}</h1>
                        <p className="text-xs text-gray-500">{dayjs(ticket.createdAt).format('MMM D, YYYY')}</p>
                    </div>
                    <div className="w-10"></div>
                </div>

                {/* Status Pipeline */}
                <div className="flex items-center justify-between px-8 mt-6 mb-8 relative">
                    <div className="absolute top-3 left-12 right-12 h-1 bg-gray-200 -z-10"></div>
                    <div className={`absolute top-3 left-12 right-12 h-1 bg-blue-700 transition-all duration-500 -z-10`} style={{
                        width: ticket.status === 'fixed' || ticket.status === 'rejected' ? '80%' : ticket.status === 'in_progress' ? '50%' : '0%'
                    }}></div>

                    {steps.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2">
                            <div className={`w-7 h-7 rounded-full border-4 transition-colors ${step.active ? 'bg-blue-700 border-blue-700' : 'bg-gray-200 border-gray-200'}`}></div>
                            <span className={`text-[10px] font-bold tracking-wider ${step.active ? 'text-blue-700' : 'text-gray-400'}`}>{step.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="px-6 space-y-6">
                {/* User & Ticket Info Card */}
                <div className="bg-white rounded-3xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] border border-gray-100 p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-red-100 rounded-full overflow-hidden">
                                {ticket.createdBy?.picture ? (
                                    <img src={ticket.createdBy.picture} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-red-500 font-bold text-xl">
                                        {ticket.createdBy?.name?.[0] || 'U'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900 text-lg">{ticket.createdBy?.name || ticket.createdBy?.username || ticket.createdBy?.email || "Unknown User"}</h2>
                                <p className="text-gray-400 text-sm capitalize">{ticket.createdBy?.role || "User"}</p>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getUrgencyBadge(ticket.urgency)}`}>
                            {ticket.urgency}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-0.5">Location</label>
                            <p className="font-bold text-gray-800 text-sm">Floor {ticket.room?.floor}, {ticket.room?.roomNumber}</p>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-0.5">Equipment Type</label>
                                <p className="font-bold text-gray-800 text-sm">{ticket.category?.name || "General"}</p>
                            </div>
                            <span className="text-xs text-gray-400">{dayjs(ticket.createdAt).format('D MMM YY, HH:mm A')}</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h3 className="font-bold text-gray-900 mb-3 uppercase text-sm tracking-wide">Description</h3>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                            {ticket.description}
                        </p>
                        {(ticket.images && ticket.images.filter(img => img.type === 'before').length > 0) && (
                            <div className="mt-4 pt-4 border-t border-gray-50">
                                <p className="text-xs text-blue-500 font-bold uppercase tracking-wide mb-3">Attachments</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {ticket.images.filter(img => img.type === 'before').map((img, index) => (
                                        <div key={index} className="rounded-2xl overflow-hidden border border-gray-100 relative group aspect-[4/3] shadow-sm cursor-pointer" onClick={() => window.open(img.url, '_blank')}>
                                            <img
                                                src={img.url}
                                                alt={`Attachment ${index + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* IT Notes Section - Read Only */}
                <div>
                    <h3 className="font-bold text-gray-900 mb-3 uppercase text-sm tracking-wide">Diagnosis & Resolution</h3>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                        {ticket.status === 'pending' ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center text-gray-400">
                                <Clock size={32} className="mb-2 opacity-50" />
                                <p className="text-sm font-medium">Pending IT Staff Action</p>
                                <p className="text-xs">No diagnosis or notes available yet.</p>
                            </div>
                        ) : (
                            <>
                                {/* Assigned Staff Info */}
                                {ticket.assignedTo && (
                                    <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100 mb-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                                            {ticket.assignedTo?.picture ? (
                                                <img src={ticket.assignedTo.picture} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <User size={16} className="text-blue-600" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs text-blue-500 font-bold uppercase tracking-wide">Assigned Technician</p>
                                            <p className="text-sm font-bold text-gray-800">{ticket.assignedTo.name || ticket.assignedTo.username}</p>
                                        </div>
                                    </div>
                                )}

                                {ticket.note && (
                                    <div className={`p-4 rounded-xl border text-sm ${ticket.status === 'rejected' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
                                        <span className="font-bold block mb-1 uppercase text-xs tracking-wider">
                                            {ticket.status === 'rejected' ? 'Rejection Reason:' : 'Technician Notes:'}
                                        </span>
                                        {ticket.note}
                                    </div>
                                )}

                                {ticket.proof && (
                                    <div className="rounded-xl overflow-hidden border border-gray-100 mt-2">
                                        <p className="text-xs text-gray-500 mb-2 font-medium px-1">Proof of Completion:</p>
                                        <img src={ticket.proof} alt="Proof" className="w-full h-48 object-cover" />
                                    </div>
                                )}

                                {!ticket.note && !ticket.proof && ticket.status !== 'pending' && (
                                    <p className="text-sm text-gray-400 italic text-center">In Progress - No notes added yet.</p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminTicketDetail;
