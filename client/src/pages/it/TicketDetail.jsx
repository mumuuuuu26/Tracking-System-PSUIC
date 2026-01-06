import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Clock, AlertCircle, User, MapPin, Calendar, ArrowLeft } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { getTicket } from "../../api/ticket"; // Ensure this API exists and works
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const TicketDetail = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTicket();
    }, [id, token]);

    const loadTicket = async () => {
        try {
            setLoading(true);
            const res = await getTicket(token, id);
            setTicket(res.data);
        } catch (err) {
            console.error("Failed to load ticket:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
                <h2 className="text-xl font-bold text-gray-700 mb-2">Ticket Not Found</h2>
                <button
                    onClick={() => navigate("/it/tickets")}
                    className="text-blue-500 hover:underline"
                >
                    Back to All Tickets
                </button>
            </div>
        );
    }

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "text-yellow-600 bg-yellow-100";
            case "in_progress": return "text-blue-600 bg-blue-100";
            case "fixed": return "text-green-600 bg-green-100";
            case "rejected": return "text-red-600 bg-red-100";
            default: return "text-gray-600 bg-gray-100";
        }
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case "Critical": return "text-red-600 bg-red-100";
            case "High": return "text-orange-600 bg-orange-100";
            case "Medium": return "text-yellow-600 bg-yellow-100";
            default: return "text-green-600 bg-green-100";
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 pb-20">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate("/it/tickets")}
                        className="p-2 hover:bg-white rounded-full transition-colors"
                    >
                        <ArrowLeft className="text-gray-600" size={24} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">
                                Ticket #{ticket.id}
                            </h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(ticket.status)}`}>
                                {ticket.status.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">
                            Reported {dayjs(ticket.createdAt).fromNow()}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Ticket Info Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Request Details</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subject</label>
                                    <p className="text-lg font-medium text-gray-900">{ticket.title}</p>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label>
                                    <div className="mt-1 p-4 bg-gray-50 rounded-xl text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {ticket.description || "No description provided."}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category</label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                                                {ticket.category?.name === 'Hardware' ? '🖥️' : '🔧'}
                                            </span>
                                            <span className="font-medium text-gray-700">{ticket.category?.name || 'General'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Urgency</label>
                                        <div className="mt-1">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium ${getUrgencyColor(ticket.urgency)}`}>
                                                {ticket.urgency}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Location & Equipment */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Location & Equipment</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                    <MapPin className="text-blue-500 mt-0.5" size={20} />
                                    <div>
                                        <p className="font-semibold text-gray-900">
                                            Room {ticket.room?.roomNumber}
                                        </p>
                                        <p className="text-sm text-gray-500">Floor {ticket.room?.floor}</p>
                                    </div>
                                </div>

                                {ticket.equipment && (
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                                        <div className="text-xl">🖥️</div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{ticket.equipment.name}</p>
                                            <p className="text-sm text-gray-500">ID: {ticket.equipment.id}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Reporter Info */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Reported By</h2>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                                    {ticket.createdBy?.name?.[0] || 'U'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{ticket.createdBy?.name || ticket.createdBy?.username}</p>
                                    <p className="text-sm text-gray-500">{ticket.createdBy?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Images */}
                        {(ticket.images && ticket.images.length > 0) && (
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Attachments</h2>
                                <div className="grid grid-cols-2 gap-2">
                                    {ticket.images.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                                            <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Logs (Simple placeholder for now, expands later) */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock size={16} className="text-gray-400" />
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Timeline</h2>
                            </div>
                            <div className="relative border-l-2 border-gray-100 ml-2 space-y-6 pb-2">
                                <div className="pl-4 relative">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                                    <p className="text-sm font-medium text-gray-900">Current Status: {ticket.status.replace('_', ' ')}</p>
                                    <p className="text-xs text-gray-500">{dayjs(ticket.updatedAt).fromNow()}</p>
                                </div>
                                <div className="pl-4 relative">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-gray-200 border-2 border-white"></div>
                                    <p className="text-sm font-medium text-gray-500">Created</p>
                                    <p className="text-xs text-gray-500">{dayjs(ticket.createdAt).format('DD MMM YYYY, HH:mm')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketDetail;
