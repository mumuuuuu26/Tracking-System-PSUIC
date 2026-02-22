import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronLeft, Clock, User, MapPin, X, ChevronRight, Check } from "lucide-react";
import dayjs from "dayjs";
import { getPublicSchedule, syncGoogleCalendar } from "../../api/it";
import { updateProfile } from "../../api/user";
import { currentUser } from "../../api/auth";
// Reuse CalendarGrid
import CalendarGrid from "../../components/CalendarGrid";
import ITHeader from "../../components/it/ITHeader";
import ITPageHeader from "../../components/it/ITPageHeader"; // [NEW]
import ITWrapper from "../../components/it/ITWrapper"; // [NEW]
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const Schedule = () => {
    const navigate = useNavigate();

    // State
    const [schedule, setSchedule] = useState([]);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // Task Detail State
    const [selectedTask, setSelectedTask] = useState(null);

    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [calendarId, setCalendarId] = useState("");
    const [savedCalendarId, setSavedCalendarId] = useState("");
    const [serviceEmail, setServiceEmail] = useState("");

    const loadSchedule = React.useCallback(async () => {
        try {
            setLoading(true);
            const res = await getPublicSchedule();
            setSchedule(res.data);
        } catch {
            toast.error("Failed to load schedule");
        } finally {
            setLoading(false);
        }
    }, []);

    const loadProfile = React.useCallback(async () => {
        try {
            const res = await currentUser();
            if (res.data) {
                setCalendarId(res.data.googleCalendarId || "");
                setSavedCalendarId(res.data.googleCalendarId || ""); // This triggers the useEffect below
                setServiceEmail(res.data.serviceAccountEmail || "");
            }
        } catch {
            // Silent fail — calendarId stays empty
        }
    }, []);

    const performSync = React.useCallback(async () => {
        // Prevent sync if no ID is saved to avoid 400 errors
        if (!savedCalendarId) return;

        try {
            setSyncing(true);
            await syncGoogleCalendar();
            loadSchedule();
        } catch (err) {
            if (err.response?.status !== 400) {
                toast.error(err.response?.data?.message || "Sync failed");
            }
        } finally {
            setSyncing(false);
        }
    }, [loadSchedule, savedCalendarId]);

    // Initial Load & Polling
    useEffect(() => {
        loadProfile();
        loadSchedule();

        const intervalId = setInterval(() => {
            loadSchedule();
        }, 60000);

        return () => clearInterval(intervalId);
    }, [loadProfile, loadSchedule]);

    // Auto-sync ONCE when savedCalendarId is available (e.g. on page reload)
    useEffect(() => {
        if (savedCalendarId) {
            performSync();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [savedCalendarId]);

    const handleSaveSettings = async () => {
        if (!calendarId) {
            toast.warning("Please enter a Calendar ID");
            return;
        }

        try {
            setSyncing(true);
            // 1. Save Profile (Backend triggers async sync, but we want to wait for clear result)
            await updateProfile({ googleCalendarId: calendarId });
            setSavedCalendarId(calendarId);

            // 2. Explicitly Sync to get event count for feedback
            const res = await syncGoogleCalendar();

            setShowSettings(false);
            toast.success(`Connected! Synced ${res.data.count} events.`);
            loadSchedule();
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to save settings";
            // Check if it's a sync error or save error
            Swal.fire({
                icon: "error",
                title: "Connection Failed",
                text: msg,
                footer: "Check that you shared the calendar with the Service Email."
            });
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
        <>
            <div className="flex flex-col h-full min-h-screen bg-gray-50 pb-20">
                {/* Mobile Header */}
                <ITPageHeader title="My Schedule">
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 -mr-2 text-white hover:bg-white/10 rounded-full transition-colors relative"
                    >
                        <User size={24} />
                        {savedCalendarId && <span className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full border border-blue-900 shadow-sm"></span>}
                    </button>
                </ITPageHeader>

                {/* Desktop Header */}
                <div className="hidden lg:block">
                    <ITHeader
                        title="My Schedule"
                        subtitle="Manage your tasks and calendar events"
                        onBack={() => navigate(-1)}
                    >
                        <button
                            onClick={() => setShowSettings(true)}
                            className="p-2 -mr-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative"
                        >
                            <User size={24} />
                            {savedCalendarId && <span className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full border border-white shadow-sm"></span>}
                        </button>
                    </ITHeader>
                </div>



                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                    {/* Left Column: Calendar */}
                    <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-100 h-full flex flex-col">
                        <CalendarGrid
                            currentDate={currentMonth}
                            setCurrentDate={setCurrentMonth}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            events={eventsForCalendar}
                            onDateSelect={setSelectedDate}
                        />
                    </div>

                    {/* Right Column: Daily List */}
                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 h-full flex flex-col">
                        <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2 mb-6 shrink-0">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <Calendar size={20} />
                            </div>
                            Tasks for {selectedDate.format('DD MMM YYYY')}
                        </h3>

                        <div className="flex-1">
                            {loading || syncing ? (
                                <div className="text-center py-20 text-gray-400 animate-pulse">
                                    {syncing ? "Syncing with Google Calendar..." : "Loading schedule..."}
                                </div>
                            ) : selectedItems.length > 0 ? (
                                <div className="space-y-3">
                                    {selectedItems.map((item, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedTask(item)}
                                            className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-start gap-4 hover:bg-blue-50/50 hover:border-blue-100 transition-all cursor-pointer group"
                                        >
                                            <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${item.type === 'ticket' ? 'bg-white text-red-600 shadow-sm' : 'bg-white text-blue-600 shadow-sm'
                                                }`}>
                                                <Clock size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-gray-900 line-clamp-1 group-hover:text-blue-700 transition-colors">{item.details}</h4>
                                                    <span className="text-xs font-medium text-gray-400 whitespace-nowrap ml-2">
                                                        {dayjs(item.start).format('HH:mm')}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description || item.title}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${item.type === 'ticket' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {item.type === 'ticket' ? 'Ticket' : 'Google Calendar'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-center py-10">
                                    <div className="w-20 h-20 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mb-4">
                                        <Calendar size={40} />
                                    </div>
                                    <p className="text-gray-900 font-bold text-lg">No tasks scheduled</p>
                                    <p className="text-sm text-gray-500">Enjoy your free time!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Task Details Modal */}
                {selectedTask && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200 overflow-hidden">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                                w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm
                                                ${selectedTask.status === 'completed' ? 'bg-green-100 text-green-600' :
                                                selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                                            `}>
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Task Details</p>
                                            <h3 className="text-lg font-bold text-gray-800 line-clamp-1">{selectedTask.title}</h3>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedTask(null)}
                                        className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <Clock size={20} className="text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-gray-700">Time & Date</p>
                                            <p className="text-sm text-gray-600 mt-0.5">
                                                {dayjs(selectedTask.date || selectedTask.start).format("MMMM D, YYYY")}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {dayjs(selectedTask.date || selectedTask.start).format("h:mm A")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <MapPin size={20} className="text-red-500 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-gray-700">Location</p>
                                            <p className="text-sm text-gray-600 mt-0.5">
                                                Floor {selectedTask.room?.floor || "-"}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Room {selectedTask.room?.roomNumber || "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                        <p className="text-sm font-bold text-gray-700 mb-2">Description</p>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {selectedTask.description || "No description provided."}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    {selectedTask.type === 'ticket' && (
                                        <button
                                            onClick={() => {
                                                navigate(`/it/ticket/${selectedTask.id}`);
                                            }}
                                            className="w-full bg-[#1e2e4a] text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
                                        >
                                            View Full Ticket
                                            <ChevronRight size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Settings Modal */}
            {
                showSettings && ( // Only show modal if settings are open AND sync is not enabled
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
                                    disabled={syncing}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                                >
                                    {syncing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                                            Connecting...
                                        </>
                                    ) : (
                                        "Save & Connect"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default Schedule;
