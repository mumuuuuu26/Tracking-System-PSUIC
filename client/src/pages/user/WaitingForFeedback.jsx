import React, { useEffect, useState } from "react";
import { Star, Clock, AlertCircle, Quote, ChevronRight } from "lucide-react";
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

    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const res = await listMyTickets(token);
            // Filter tickets that are completed (fixed) BUT not yet rated
            const waiting = res.data.filter(t => t.status === 'fixed' && !t.rating);
            setTickets(waiting);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 pt-16 pb-20 rounded-b-[3rem] shadow-xl shadow-orange-100">
                <div className="max-w-4xl mx-auto px-6 text-center text-white">
                    <div className="inline-flex items-center justify-center p-3 bg-white/20 backdrop-blur-md rounded-full mb-4 ring-4 ring-white/10">
                        <Star className="text-white fill-current animate-pulse" size={32} />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">Satisfaction Survey</h1>
                    <p className="text-orange-50 text-lg max-w-xl mx-auto opacity-95">
                        Your feedback matters! Please take a moment to rate the service you received for the following requests.
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 -mt-10 relative z-10">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2].map(i => (
                            <div key={i} className="bg-white p-6 rounded-3xl h-32 animate-pulse shadow-sm"></div>
                        ))}
                    </div>
                ) : tickets.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-[2.5rem] shadow-lg border border-gray-100">
                        <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-100">
                            <Star className="text-green-500 fill-green-500" size={36} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-3">All Caught Up!</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mb-8 text-lg">
                            You've rated all your completed tickets. Thank you for your valuable feedback!
                        </p>
                        <button
                            onClick={() => navigate('/user')}
                            className="bg-gray-900 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg hover:bg-gray-800 transition-all hover:-translate-y-1"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {tickets.map(ticket => (
                            <div
                                key={ticket.id}
                                className="group bg-white p-6 md:p-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 relative overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-2 h-full bg-yellow-400 group-hover:bg-orange-400 transition-colors"></div>

                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className="font-mono text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                                                #{String(ticket.id).padStart(4, '0')}
                                            </span>
                                            <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                                <Clock size={12} />
                                                Completed {dayjs(ticket.updatedAt).fromNow()}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-xl text-gray-800 mb-2 group-hover:text-orange-500 transition-colors">
                                            {ticket.title}
                                        </h3>

                                        {ticket.description && (
                                            <div className="relative pl-4 border-l-2 border-gray-200">
                                                <p className="text-sm text-gray-500 line-clamp-2 italic">
                                                    "{ticket.description}"
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => navigate(`/user/feedback/${ticket.id}`)}
                                        className="w-full md:w-auto bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all active:scale-95 flex items-center justify-center gap-2 group/btn"
                                    >
                                        <Star size={18} className="fill-white" />
                                        Rate Service
                                        <ChevronRight size={18} className="opacity-70 group-hover/btn:translate-x-1 transition-transform" />
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
