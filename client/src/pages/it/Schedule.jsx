import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronLeft, Clock, User, MapPin, X, ChevronRight, Check } from "lucide-react";
import dayjs from "dayjs";
import { getPublicSchedule, syncGoogleCalendar } from "../../api/it";
import { updateProfile } from "../../api/user";
import { currentUser } from "../../api/auth";
import CalendarGrid from "../../components/CalendarGrid";
import ITHeader from "../../components/it/ITHeader";
import ITPageHeader from "../../components/it/ITPageHeader";
import ITWrapper from "../../components/it/ITWrapper";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const AUTO_SYNC_MIN_INTERVAL_MS = 5 * 60 * 1000;
const AUTO_SYNC_STORAGE_PREFIX = "it_google_sync_last_success:";

const getSyncStorageKey = (calendarId) => `${AUTO_SYNC_STORAGE_PREFIX}${String(calendarId || "").trim()}`;

const readLastSyncAt = (calendarId) => {
    try {
        const raw = window.localStorage.getItem(getSyncStorageKey(calendarId));
        const value = Number.parseInt(String(raw || ""), 10);
        return Number.isFinite(value) && value > 0 ? value : 0;
    } catch {
        return 0;
    }
};

const writeLastSyncAt = (calendarId, timestampMs) => {
    try {
        window.localStorage.setItem(getSyncStorageKey(calendarId), String(timestampMs));
    } catch {
        // Ignore localStorage write errors in private mode.
    }
};

const Schedule = () => {
    const navigate = useNavigate();

    const [schedule, setSchedule] = useState([]);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const [selectedTask, setSelectedTask] = useState(null);

    const [showSettings, setShowSettings] = useState(false);
    const [calendarId, setCalendarId] = useState("");
    const [savedCalendarId, setSavedCalendarId] = useState("");
    const [serviceEmail, setServiceEmail] = useState("");
    const [googleServerReady, setGoogleServerReady] = useState(true);
    const [googleServerMissingKeys, setGoogleServerMissingKeys] = useState([]);

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
                setSavedCalendarId(res.data.googleCalendarId || "");
                setServiceEmail(res.data.serviceAccountEmail || "");
                setGoogleServerReady(Boolean(res.data.googleCalendarConfigured));
                setGoogleServerMissingKeys(
                    Array.isArray(res.data.googleCalendarMissingKeys)
                        ? res.data.googleCalendarMissingKeys
                        : []
                );
            }
        } catch {
            // Silent fail
        }
    }, []);

    const performSync = React.useCallback(async ({ force = false, silent = false } = {}) => {
        if (!savedCalendarId || !googleServerReady) return;

        const now = Date.now();
        const lastSyncedAt = readLastSyncAt(savedCalendarId);
        const elapsedMs = now - lastSyncedAt;
        const canAutoSync = force || lastSyncedAt === 0 || elapsedMs >= AUTO_SYNC_MIN_INTERVAL_MS;

        if (!canAutoSync) {
            if (!silent) {
                const retryAfterSec = Math.ceil((AUTO_SYNC_MIN_INTERVAL_MS - elapsedMs) / 1000);
                toast.info(`Google sync was run recently. Retry in ${retryAfterSec}s.`);
            }
            return null;
        }

        try {
            setSyncing(true);
            const res = await syncGoogleCalendar({ force });
            if (!res?.data?.skipped) {
                writeLastSyncAt(savedCalendarId, Date.now());
            }
            await loadSchedule();
            return res;
        } catch (err) {
            if (!silent) {
                toast.error(err.response?.data?.message || "Sync failed");
            }
            return null;
        } finally {
            setSyncing(false);
        }
    }, [googleServerReady, loadSchedule, savedCalendarId]);

    useEffect(() => {
        loadProfile();
        loadSchedule();

        const intervalId = setInterval(() => {
            loadSchedule();
        }, 60000);

        return () => clearInterval(intervalId);
    }, [loadProfile, loadSchedule]);

    useEffect(() => {
        if (savedCalendarId) {
            performSync({ force: false, silent: true });
        }
    }, [savedCalendarId, performSync]);

    const handleSaveSettings = async () => {
        if (!calendarId) {
            toast.warning("Please enter a Calendar ID");
            return;
        }

        try {
            setSyncing(true);
            await updateProfile({ googleCalendarId: calendarId });
            setSavedCalendarId(calendarId);

            if (!googleServerReady) {
                setShowSettings(false);
                toast.warning("Calendar ID saved, but server Google credentials are not configured yet.");
                return;
            }

            const res = await performSync({ force: true, silent: true });
            if (!res) {
                throw new Error("Sync request did not complete");
            }

            setShowSettings(false);
            if (res.data?.skipped) {
                toast.info("Calendar was recently synced. Please wait before syncing again.");
            } else {
                toast.success(`Connected! Synced ${res.data.count} events.`);
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Failed to save settings";
            const missingKeys = err.response?.data?.missingKeys;
            const footer =
                err.response?.status === 503 && Array.isArray(missingKeys) && missingKeys.length > 0
                    ? `Server missing: ${missingKeys.join(", ")}`
                    : 'Check that you shared the calendar with the Service Email.';
            Swal.fire({
                icon: "error",
                title: "Connection Failed",
                text: msg,
                footer
            });
        } finally {
            setSyncing(false);
        }
    };

    const eventsForCalendar = schedule.map(item => ({
        date: item.start,
        type: item.type,
        color: item.type === 'ticket' ? '#EF4444' : '#3B82F6'
    }));

    const selectedItems = schedule.filter(item =>
        dayjs(item.start).isSame(selectedDate, 'day')
    ).sort((a, b) => dayjs(a.start).diff(dayjs(b.start)));

    return (
        <>
            <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-[#0d1b2a] pb-20">
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
                    <ITWrapper>
                        <ITHeader
                            title="My Schedule"
                            subtitle="Manage your tasks and calendar events"
                            onBack={() => navigate(-1)}
                        >
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-2 -mr-2 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-white/10 rounded-full transition-colors relative"
                            >
                                <User size={24} />
                                {savedCalendarId && <span className="absolute top-2 right-2 w-2 h-2 bg-green-400 rounded-full border border-white dark:border-blue-900 shadow-sm"></span>}
                            </button>
                        </ITHeader>
                    </ITWrapper>
                </div>

                <ITWrapper className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                        {/* Left Column: Calendar */}
                        <div className="bg-white dark:bg-[#1a2f4e] rounded-[1.5rem] p-4 shadow-sm dark:shadow-lg border border-gray-100 dark:border-blue-800/30 h-full flex flex-col">
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
                        <div className="bg-white dark:bg-[#1a2f4e] rounded-[1.5rem] p-6 shadow-sm dark:shadow-lg border border-gray-100 dark:border-blue-800/30 h-full flex flex-col">
                            <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2 mb-6 shrink-0">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                    <Calendar size={20} />
                                </div>
                                Tasks for {selectedDate.format('DD MMM YYYY')}
                            </h3>

                            <div className="flex-1">
                                {loading || syncing ? (
                                    <div className="text-center py-20 text-gray-400 dark:text-blue-300/40 animate-pulse">
                                        {syncing ? "Syncing with Google Calendar..." : "Loading schedule..."}
                                    </div>
                                ) : selectedItems.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedItems.map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setSelectedTask(item)}
                                                className="bg-gray-50 dark:bg-blue-900/20 rounded-2xl p-4 border border-gray-100 dark:border-blue-800/30 flex items-start gap-4 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 hover:border-blue-100 dark:hover:border-blue-700/50 transition-all cursor-pointer group"
                                            >
                                                <div className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center transition-transform group-hover:scale-110 ${item.type === 'ticket' ? 'bg-white dark:bg-[#0d1b2a] text-red-600 dark:text-red-400 shadow-sm' : 'bg-white dark:bg-[#0d1b2a] text-blue-600 dark:text-blue-400 shadow-sm'
                                                    }`}>
                                                    <Clock size={20} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start">
                                                        <h4 className="font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{item.details}</h4>
                                                        <span className="text-xs font-medium text-gray-400 dark:text-blue-300/50 whitespace-nowrap ml-2">
                                                            {dayjs(item.start).format('HH:mm')}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-blue-300/60 mt-1 line-clamp-2">{item.description || item.title}</p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${item.type === 'ticket' ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
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
                                        <div className="w-20 h-20 bg-gray-50 dark:bg-blue-900/20 text-gray-300 dark:text-blue-700/50 rounded-full flex items-center justify-center mb-4">
                                            <Calendar size={40} />
                                        </div>
                                        <p className="text-gray-900 dark:text-white font-bold text-lg">No tasks scheduled</p>
                                        <p className="text-sm text-gray-500 dark:text-blue-300/60">Enjoy your free time!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </ITWrapper>

                {/* Task Details Modal */}
                {selectedTask && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-[#1a2f4e] rounded-[2rem] w-full max-w-md shadow-2xl scale-100 animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-100 dark:border-blue-800/30">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className={`
                                                w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm
                                                ${selectedTask.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400' :
                                                selectedTask.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400'}
                                            `}>
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 dark:text-blue-300/50 uppercase tracking-wider mb-0.5">Task Details</p>
                                            <h3 className="text-lg font-bold text-gray-800 dark:text-white line-clamp-1">{selectedTask.title}</h3>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedTask(null)}
                                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-400 dark:text-blue-300/50 hover:text-gray-600 dark:hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-blue-900/20 rounded-2xl border border-gray-100 dark:border-blue-800/30">
                                        <Clock size={20} className="text-blue-500 dark:text-blue-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-gray-700 dark:text-white">Time & Date</p>
                                            <p className="text-sm text-gray-600 dark:text-blue-300/70 mt-0.5">
                                                {dayjs(selectedTask.date || selectedTask.start).format("MMMM D, YYYY")}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-blue-300/60">
                                                {dayjs(selectedTask.date || selectedTask.start).format("h:mm A")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-blue-900/20 rounded-2xl border border-gray-100 dark:border-blue-800/30">
                                        <MapPin size={20} className="text-red-500 dark:text-red-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-bold text-gray-700 dark:text-white">Location</p>
                                            <p className="text-sm text-gray-600 dark:text-blue-300/70 mt-0.5">
                                                Floor {selectedTask.room?.floor || "-"}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-blue-300/60">
                                                Room {selectedTask.room?.roomNumber || "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
                                        <p className="text-sm font-bold text-gray-700 dark:text-white mb-2">Description</p>
                                        <p className="text-sm text-gray-600 dark:text-blue-300/70 leading-relaxed">
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
                                            className="w-full bg-[#1e2e4a] dark:bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 dark:shadow-blue-900/30 hover:shadow-xl hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2"
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
                showSettings && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#1a2f4e] rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-blue-800/30">
                            <h3 className="text-xl font-bold mb-4 text-center text-gray-800 dark:text-white">Connection Setup</h3>

                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4 border border-blue-100 dark:border-blue-800/30">
                                <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">Step 1: Share Calendar</h4>
                                <p className="text-xs text-blue-700 dark:text-blue-400/80 mb-2">
                                    Go to Google Calendar Settings {'>'} "Share with specific people" and add this email:
                                </p>
                                <div className="flex items-center gap-2 bg-white dark:bg-[#0d1b2a] rounded-lg p-2 border border-blue-200 dark:border-blue-800/40">
                                    <code className="text-xs font-mono text-gray-600 dark:text-blue-300/80 flex-1 break-all">
                                        {serviceEmail || "Service email is not configured on server"}
                                    </code>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(serviceEmail);
                                            toast.success("Copied to clipboard!");
                                        }}
                                        disabled={!serviceEmail}
                                        className="text-blue-600 dark:text-blue-400 font-bold text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        COPY
                                    </button>
                                </div>
                                {!googleServerReady && (
                                    <p className="text-[11px] text-red-600 dark:text-red-400 mt-2">
                                        Server Google config is incomplete
                                        {googleServerMissingKeys.length > 0
                                            ? `: ${googleServerMissingKeys.join(", ")}`
                                            : "."}
                                    </p>
                                )}
                            </div>

                            <div className="mb-6">
                                <h4 className="text-sm font-bold text-gray-700 dark:text-white mb-2">Step 2: Enter Calendar ID</h4>
                                <input
                                    type="text"
                                    value={calendarId}
                                    onChange={(e) => setCalendarId(e.target.value)}
                                    placeholder="e.g. your.email@gmail.com"
                                    className="w-full bg-gray-50 dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-blue-400/40"
                                />
                                <p className="text-[10px] text-gray-400 dark:text-blue-300/50 mt-1">
                                    Usually your email address (or finding in Calendar Settings).
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="flex-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveSettings}
                                    disabled={syncing}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
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
