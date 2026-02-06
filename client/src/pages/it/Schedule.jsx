import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronLeft, Clock, User } from "lucide-react";
import dayjs from "dayjs";
import useAuthStore from "../../store/auth-store";
import { getPublicSchedule, syncGoogleCalendar } from "../../api/it";
import { updateProfile } from "../../api/user";
import { currentUser } from "../../api/auth";
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

    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [calendarId, setCalendarId] = useState("");
    const [savedCalendarId, setSavedCalendarId] = useState("");
    const [serviceEmail, setServiceEmail] = useState("");

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

    const loadProfile = React.useCallback(async () => {
        try {
            const res = await currentUser(token);
            if (res.data) {
                setCalendarId(res.data.googleCalendarId || "");
                setSavedCalendarId(res.data.googleCalendarId || "");
                setServiceEmail(res.data.serviceAccountEmail || "");
            }
        } catch (err) {
            console.error("Failed to load profile", err);
        }
    }, [token]);

    const performSync = React.useCallback(async () => {
        try {
            setSyncing(true);
            const res = await syncGoogleCalendar(token);
            // toast.success(res.data.message || "Synced successfully"); // Optional: Don't spam toast on auto-sync
            loadSchedule();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Sync failed");
        } finally {
            setSyncing(false);
        }
    }, [token, loadSchedule]);

    // Initial Load & Polling
    useEffect(() => {
        if (token) {
            loadProfile();
            loadSchedule();

            const intervalId = setInterval(() => {
                loadSchedule();
            }, 60000);

            return () => clearInterval(intervalId);
        }
    }, [token]); // Removed functions from dependency array to prevent loops if they are unstable

    // Auto-sync on mount only
    useEffect(() => {
        if (token) {
            performSync();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]); // Run once when token is available

    const handleSaveSettings = async () => {
        try {
            await updateProfile(token, { googleCalendarId: calendarId });
            setSavedCalendarId(calendarId);
            setShowSettings(false);
            toast.success("Calendar ID saved. Syncing...");
            performSync();
        } catch (err) {
            console.error(err);
            toast.error("Failed to save settings");
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
            <div className="bg-[#193C6C] px-6 pt-10 pb-20 rounded-b-[2.5rem] shadow-lg relative z-0">
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
                    <button
                        onClick={() => setShowSettings(true)}
                        className="text-white hover:bg-white/10 p-2 rounded-full transition-colors relative"
                    >
                        <User size={24} />
                        {savedCalendarId && <span className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full border border-[#193C6C]"></span>}
                    </button>
                </div>
            </div>

            <div className="max-w-md md:max-w-2xl mx-auto px-6 -mt-12 relative z-10 space-y-6">

                {/* Calendar */}
                <CalendarGrid
                    currentDate={currentMonth}
                    setCurrentDate={setCurrentMonth}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    events={eventsForCalendar}
                    onDateSelect={setSelectedDate}
                />



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

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold mb-4 text-center text-gray-800">Connection Setup</h3>

                        {/* Step 1: Share Instruction */}
                        <div className="bg-blue-50 rounded-xl p-4 mb-4 border border-blue-100">
                            <h4 className="text-sm font-bold text-blue-800 mb-2">Step 1: Share Calendar</h4>
                            <p className="text-xs text-blue-700 mb-2">
                                Go to Google Calendar Settings {'>'} "Share with specific people" and add this email:
                            </p>
                            <div className="flex items-center gap-2 bg-white rounded-lg p-2 border border-blue-200">
                                <code className="text-xs font-mono text-gray-600 flex-1 break-all">
                                    {serviceEmail || "Loading email..."}
                                </code>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(serviceEmail);
                                        toast.success("Copied to clipboard!");
                                    }}
                                    className="text-blue-600 font-bold text-xs hover:bg-blue-50 px-2 py-1 rounded"
                                >
                                    COPY
                                </button>
                            </div>
                        </div>

                        {/* Step 2: Input ID */}
                        <div className="mb-6">
                            <h4 className="text-sm font-bold text-gray-700 mb-2">Step 2: Enter Calendar ID</h4>
                            <input
                                type="text"
                                value={calendarId}
                                onChange={(e) => setCalendarId(e.target.value)}
                                placeholder="e.g. your.email@gmail.com"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                            />
                            <p className="text-[10px] text-gray-400 mt-1">
                                Usually your email address (or finding in Calendar Settings).
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
                            >
                                Save & Connect
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schedule;
