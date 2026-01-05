import React, { useEffect, useState } from "react";
import { Star, Clock, AlertCircle } from "lucide-react";
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
        <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Star className="text-yellow-500" /> Satisfaction Survey
            </h1>

            {loading ? (
                <p>Loading...</p>
            ) : tickets.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="text-green-500" size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">Multi-task Completed!</h3>
                    <p className="text-gray-500 max-w-md mx-auto">
                        You have no tickets waiting for feedback. Thank you for rating our service!
                    </p>
                    <button
                        onClick={() => navigate('/user')}
                        className="mt-6 text-blue-600 font-medium hover:underline"
                    >
                        Return Home
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-gray-600 mb-4">
                        Please rate the following tickets to help us improve our service.
                    </p>
                    {tickets.map(ticket => (
                        <div key={ticket.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded font-bold">
                                            #TK-{String(ticket.id).padStart(4, '0')}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {dayjs(ticket.updatedAt).fromNow()}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg text-gray-800 mb-1">{ticket.title}</h3>
                                    <p className="text-sm text-gray-500 line-clamp-2">{ticket.description}</p>
                                </div>
                                <button
                                    onClick={() => navigate(`/user/feedback/${ticket.id}`)}
                                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-colors shadow-sm whitespace-nowrap"
                                >
                                    Rate Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WaitingForFeedback;
