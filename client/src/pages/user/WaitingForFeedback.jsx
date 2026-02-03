import React, { useEffect, useState, useCallback } from "react";
import { Star, Clock, AlertCircle, Quote, ChevronRight, ChevronLeft } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { listMyTickets } from "../../api/ticket";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const WaitingForFeedback = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadTickets = useCallback(async () => {
        try {
            setLoading(true);
            const res = await listMyTickets(token);
            // Filter tickets that are completed (fixed) BUT not yet rated
            const waiting = res.data.filter(t => t.status === 'fixed' && t.rating === null);
            setTickets(waiting);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    return (
        <div className="min-h-screen bg-gray-50 pb-20 animate-in fade-in duration-500 font-sans">
            {/* Header */}
            <div className="bg-[#193C6C] px-6 pt-2 pb-8 -mx-4 md:-mx-6 mb-6 shadow-md lg:hidden sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-center relative">
                    <button
                        onClick={() => navigate('/user')}
                        className="absolute left-0 text-white hover:bg-white/10 p-2 -ml-2 rounded-full transition-colors"
                    >
                        <ChevronLeft size={28} />
                    </button>
                    <h1 className="text-white text-xl md:text-2xl font-bold tracking-wide">Satisfaction Survey</h1>
                </div>
                <div className="text-center mt-2">
                    <p className="text-blue-100/90 text-sm max-w-md mx-auto leading-relaxed">
                        Please rate the service for your completed requests.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 relative z-0">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white p-6 rounded-2xl h-48 animate-pulse shadow-sm border border-gray-100"></div>
                        ))}
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100 mt-4 max-w-2xl mx-auto">
                        <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-50/50">
                            <Star className="text-green-500 fill-green-500" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">All Caught Up!</h3>
                        <p className="text-gray-500 max-w-xs mx-auto mb-8 text-sm">
                            Thank you for your valuable feedback!
                        </p>
                        <button
                            onClick={() => navigate('/user')}
                            className="bg-[#193C6C] text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-[#143057] transition-all hover:-translate-y-0.5"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {tickets.map(ticket => (
                            <div
                                key={ticket.id}
                                className="group bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 relative overflow-hidden flex flex-col h-full"
                            >
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#193C6C] group-hover:bg-blue-600 transition-colors"></div>

                                <div className="flex-1 pl-3 flex flex-col">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                #{String(ticket.id).padStart(4, '0')}
                                            </span>
                                            <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                                                <Clock size={10} />
                                                {dayjs(ticket.updatedAt).fromNow()}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-lg text-gray-800 mb-3 leading-tight group-hover:text-blue-700 transition-colors line-clamp-2">
                                        {ticket.title}
                                    </h3>

                                    {ticket.description && (
                                        <p className="text-gray-500 text-sm italic bg-gray-50 p-3 rounded-xl mb-4 line-clamp-3">
                                            "{ticket.description}"
                                        </p>
                                    )}
                                </div>

                                <div className="pl-3 mt-auto pt-2">
                                    <button
                                        onClick={() => navigate(`/user/feedback/${ticket.id}`)}
                                        className="w-full bg-white border border-[#193C6C] text-[#193C6C] group-hover:bg-[#193C6C] group-hover:text-white px-4 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <Star size={16} className="fill-current" />
                                        Rate Service
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WaitingForFeedback;
