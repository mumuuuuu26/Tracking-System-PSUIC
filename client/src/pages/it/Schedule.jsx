import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronLeft, Clock, User, RefreshCw, Plus } from "lucide-react";
import dayjs from "dayjs";
import useAuthStore from "../../store/auth-store";
import { getPublicSchedule, syncGoogleCalendar } from "../../api/it";
// Reuse CalendarGrid
import CalendarGrid from "../../components/CalendarGrid";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const Schedule = () => {
    const navigate = useNavigate();
    const { token } = useAuthStore();

    // State
    const [schedule, setSchedule] = useState([]);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const loadSchedule = React.useCallback(async () => {
        try {
            setLoading(true);
            const res = await getPublicSchedule(token);
            setSchedule(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load schedule");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            loadSchedule();
        }
    }, [token, loadSchedule]);

    const handleSync = async () => {
        try {
            setSyncing(true);
            const res = await syncGoogleCalendar(token);
            toast.success(res.data.message || "Synced successfully");
            loadSchedule();
        } catch (err) {
            console.error(err);
            toast.error("Sync failed");
        } finally {
            setSyncing(false);
        }
    };

    // Helpers
    // Map schedule to events for calendar dots
    const eventsForCalendar = schedule.map(item => ({
        date: item.start,
        type: item.type,
        color: item.type === 'ticket' ? '#EF4444' : '#3B82F6'
    }));

    // Filter items for selected day
    const selectedItems = schedule.filter(item =>
        dayjs(item.start).isSame(selectedDate, 'day')
    ).sort((a, b) => dayjs(a.start).diff(dayjs(b.start)));

    return (
        <div className="min-h-screen bg-gray-50 pb-8 font-sans text-gray-900">
            {/* Header */}
            <div className="bg-[#193C6C] px-6 pt-10 pb-20 rounded-b-[2.5rem] shadow-lg sticky top-0 z-10">
                <div className="max-w-md md:max-w-2xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-white hover:bg-white/10 p-2 -ml-2 rounded-full transition-colors"
                    >
                        <ChevronLeft size={28} />
                    </button>
                    <h1 className="text-white text-2xl font-bold flex-1 text-center pr-8">
                        My Schedule
                    </h1>
                </div>
            </div>

            <div className="max-w-md md:max-w-2xl mx-auto px-6 -mt-12 relative z-20 space-y-6">

                {/* Calendar */}
                <CalendarGrid
                    currentDate={currentMonth}
                    setCurrentDate={setCurrentMonth}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    events={eventsForCalendar}
                    onDateSelect={setSelectedDate}
                />

                {/* Actions */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex-1 bg-blue-50 text-blue-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 transition disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={syncing ? "animate-spin" : ""} />
                        {syncing ? "Syncing..." : "Sync Google Calendar"}
                    </button>
                    {/* Add Task Button (Placeholder for manual add if needed later) */}
                    {/* <button className="flex-1 bg-gray-50 text-gray-600 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition">
                        <Plus size={20} />
                        Add Task
                    </button> */}
                </div>

                {/* Daily List */}
                <div className="space-y-4">
                    <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                        <Calendar className="text-blue-600" size={20} />
                        Tasks for {selectedDate.format('DD MMM YYYY')}
                    </h3>

                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Loading schedule...</div>
                    ) : selectedItems.length > 0 ? (
                        selectedItems.map((item, idx) => (
                            <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center ${item.type === 'ticket' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                    }`}>
                                    <Clock size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-900">{item.details}</h4>
                                        <span className="text-xs font-medium text-gray-400">
                                            {dayjs(item.start).format('HH:mm')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description || item.title}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${item.type === 'ticket' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {item.type === 'ticket' ? 'Ticket' : 'Personal/Google'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                            <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Calendar size={32} />
                            </div>
                            <p className="text-gray-900 font-bold">No tasks scheduled</p>
                            <p className="text-sm text-gray-500">Enjoy your free time!</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Schedule;
