import React, { useEffect, useState, useCallback } from "react";

import useAuthStore from "../../store/auth-store";
import { listMyTickets } from "../../api/ticket";
import { getITAvailability } from "../../api/appointment";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import {
    Calendar,
    ChevronRight,
    ChevronLeft,
    Calendar as CalendarIcon,
    Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CustomSelect from "../../components/ui/CustomSelect";

dayjs.extend(isBetween);

// Mini Calendar Component (Custom for this page to match mockup)
const MiniCalendar = ({
    currentMonth,
    setCurrentMonth,
    selectedDate,
    setSelectedDate,
    events,
}) => {
    const startOfMonth = currentMonth.startOf("month");

    const daysInMonth = currentMonth.daysInMonth();
    const startDayOfWeek = startOfMonth.day() === 0 ? 6 : startOfMonth.day() - 1; // Mon=0, Sun=6

    const days = [];
    // Previous month placeholders
    for (let i = 0; i < startDayOfWeek; i++) {
        days.push(null);
    }
    // Days
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(currentMonth.date(i));
    }

    const hasEvent = (date) => {
        if (!date) return false;
        const dStr = date.format("YYYY-MM-DD");
        return events.some((e) => dayjs(e.date).format("YYYY-MM-DD") === dStr);
    };

    const getEventColor = (date) => {
        if (!date) return "";
        const dStr = date.format("YYYY-MM-DD");
        const event = events.find(
            (e) => dayjs(e.date).format("YYYY-MM-DD") === dStr
        );
        if (!event) return "";
        // Mockup uses Blue and Green dots
        return event.type === "appointment" ? "bg-blue-400" : "bg-green-400";
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-[#193C6C] font-bold text-lg">IT Calendar</h3>
                <div className="flex items-center gap-4">
                    <div className="bg-white border border-gray-200 rounded-xl px-3 py-1 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-gray-600 font-bold text-sm">
                            {currentMonth.format("MMM")}
                        </span>
                        <CalendarIcon size={16} className="text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Navigation (Hidden in mockup but good for UX) */}
            <div className="flex justify-between mb-4 px-2">
                <button
                    onClick={() => setCurrentMonth(currentMonth.subtract(1, "month"))}
                >
                    <ChevronLeft
                        size={20}
                        className="text-gray-300 hover:text-blue-600"
                    />
                </button>
                <button onClick={() => setCurrentMonth(currentMonth.add(1, "month"))}>
                    <ChevronRight
                        size={20}
                        className="text-gray-300 hover:text-blue-600"
                    />
                </button>
            </div>

            <div className="grid grid-cols-7 mb-4 text-center">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                    <span key={d} className="text-gray-400 text-xs font-medium uppercase">
                        {d}
                    </span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-4 gap-x-1 justify-items-center">
                {days.map((date, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 w-8">
                        {date ? (
                            <>
                                <button
                                    onClick={() => setSelectedDate(date)}
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                                        ${date.isSame(selectedDate, "day")
                                            ? "bg-blue-400 text-white shadow-md shadow-blue-200"
                                            : "text-gray-700 hover:bg-gray-100"
                                        }
                                    `}
                                >
                                    {date.date()}
                                </button>
                                {/* Dots */}
                                <div className="h-1 flex gap-0.5">
                                    {hasEvent(date) && (
                                        <div
                                            className={`w-1 h-1 rounded-full ${getEventColor(date)}`}
                                        ></div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="w-8 h-8"></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const UserAppointments = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();

    // States
    const [myTickets, setMyTickets] = useState([]);
    const [monthlyEvents, setMonthlyEvents] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [selectedDate, setSelectedDate] = useState(dayjs());

    const loadMySchedule = useCallback(async () => {
        try {
            const res = await listMyTickets(token);
            // Filter tickets that have appointments, or just list tickets as "Tasks"
            // Mockup shows "AP-01 : Wifi", "AP-02: Projector".
            // Let's show "Scheduled" tickets as appointments.
            setMyTickets(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [token]);

    const loadMonthlyEvents = useCallback(async () => {
        try {
            const startOfMonth = currentMonth.startOf("month").format("YYYY-MM-DD");
            const endOfMonth = currentMonth.endOf("month").format("YYYY-MM-DD");
            const res = await getITAvailability(token, startOfMonth, endOfMonth);
            setMonthlyEvents(res.data);
        } catch (err) {
            console.error("Error loading monthly events:", err);
        }
    }, [token, currentMonth]);

    const monthStr = currentMonth.format("YYYY-MM");

    useEffect(() => {
        loadMySchedule(); // Load user's tickets
        loadMonthlyEvents(); // Load IT calendar availability
    }, [loadMySchedule, loadMonthlyEvents, monthStr]);

    // Filter appointments for "My Schedule" section
    // In mockup: It's a list card.
    // Let's show:
    // 1. Confirmed Appointments (status: scheduled)
    // 2. Pending Requests (status: in_progress/pending)
    const [showAll, setShowAll] = useState(false);
    const [filterPriority, setFilterPriority] = useState("All"); // All, Low, Medium, High
    const [filterTime, setFilterTime] = useState("All"); // All, Today, Yesterday...

    // Filter appointments
    const filteredAppointments = myTickets
        .filter((t) => {
            // 1. Basic Validity Check
            const hasAppointment =
                t.appointment && t.appointment.status !== "cancelled";
            const hasRequest = t.description?.includes("[Requested Appointment:");
            if (!hasAppointment && !hasRequest) return false;

            // 2. Get Date
            let date = null;
            if (hasAppointment) date = dayjs(t.appointment.scheduledAt);
            else {
                const match = t.description?.match(
                    /\[Requested Appointment: (\d{4}-\d{2}-\d{2})/
                );
                if (match) date = dayjs(match[1]);
            }
            if (!date) return false;

            // 3. Time Filter
            const now = dayjs();
            if (filterTime === "Upcoming") {
                // Keep existing behavior or improve: Upcoming usually means >= Today
                // But Original Code was: if (!date.isSame(currentMonth, "month")) return false;
                // Stick to currentMonth check if that was the intention, OR change to future.
                // Giving the user options like "Today" implies they want to drill down.
                // Let's make "Upcoming" mean >= Today.
                if (date.isBefore(now, 'day')) return false;
            } else if (filterTime === "Today") {
                if (!date.isSame(now, 'day')) return false;
            } else if (filterTime === "Yesterday") {
                if (!date.isSame(now.subtract(1, 'day'), 'day')) return false;
            } else if (filterTime === "Last 3 Days") {
                if (!date.isBetween(now.subtract(3, 'day'), now, 'day', '[]')) return false;
            } else if (filterTime === "Last 7 Days") {
                if (!date.isBetween(now.subtract(7, 'day'), now, 'day', '[]')) return false;
            }

            // 4. Priority Filter (Urgency)
            if (filterPriority !== "All" && t.urgency !== filterPriority)
                return false;

            return true;
        })
        .sort((a, b) => {
            const getDate = (ticket) => {
                if (ticket.appointment) return new Date(ticket.appointment.scheduledAt);
                const match = ticket.description?.match(
                    /\[Requested Appointment: (\d{4}-\d{2}-\d{2})/
                );
                return match ? new Date(match[1]) : new Date(0);
            };
            return getDate(a) - getDate(b);
        });

    const displayedAppointments = showAll
        ? filteredAppointments
        : filteredAppointments.slice(0, 3);

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans relative">
            {/* Deep Blue Header */}
            <div className="bg-[#193C6C] px-6 pt-10 pb-8 rounded-b-[2rem] shadow-lg mb-6 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-white hover:bg-white/10 p-2 -ml-2 rounded-full transition-colors"
                    >
                        <ChevronLeft size={28} />
                    </button>

                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 space-y-6 animate-in fade-in duration-500">
                <div className="flex flex-col space-y-6">
                    {/* Calendar Section */}
                    <div className="w-full">
                        <MiniCalendar
                            currentMonth={currentMonth}
                            setCurrentMonth={setCurrentMonth}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            events={monthlyEvents}
                        />

                        {/* IT Schedule for Selected Date */}
                        <div className="bg-white rounded-3xl p-6 shadow-sm mt-6">
                            <h3 className="text-[#193C6C] font-bold text-lg mb-4 flex items-center gap-2">
                                <CalendarIcon size={20} />
                                IT Schedule & Availability
                                <span className="text-sm font-normal text-gray-400 ml-auto">
                                    {selectedDate.format("D MMM YYYY")}
                                </span>
                            </h3>

                            <div className="space-y-3">
                                {(() => {
                                    const dateStr = selectedDate.format("YYYY-MM-DD");
                                    const dailyEvents = monthlyEvents.filter(e =>
                                        dayjs(e.date).format("YYYY-MM-DD") === dateStr
                                    ).sort((a, b) => new Date(a.date) - new Date(b.date));

                                    if (dailyEvents.length === 0) {
                                        return (
                                            <div className="text-center py-6 bg-green-50 rounded-2xl border border-green-100">
                                                <p className="text-green-600 font-bold mb-1">All Clear!</p>
                                                <p className="text-green-500 text-xs text-opacity-80">IT Support is available all day</p>
                                            </div>
                                        );
                                    }

                                    return dailyEvents.map((event, idx) => (
                                        <div key={idx} className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                            <div className={`w-2 h-10 rounded-full ${event.type === 'appointment' ? 'bg-blue-400' : 'bg-red-400'}`}></div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-gray-800 font-bold text-sm">
                                                        {event.title}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-200">
                                                        {dayjs(event.date).format("HH:mm")} - {event.endTime ? dayjs(event.endTime).format("HH:mm") : '...'}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">{event.description || 'Busy'}</p>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    {/* Filters & Schedule Section */}
                    <div className="space-y-6">
                        {/* Filters Row */}
                        <div className="flex gap-3">
                            {/* Urgency Filter */}
                            <div className="w-1/2">
                                <CustomSelect
                                    options={["All", "Low", "Medium", "High"]}
                                    value={filterPriority}
                                    onChange={(e) => setFilterPriority(e.target.value)}
                                    placeholder="Status"
                                />
                            </div>

                            {/* Time Filter */}
                            <div className="w-1/2">
                                <CustomSelect
                                    options={[
                                        "All",
                                        "Today",
                                        "Yesterday",
                                        "Last 3 Days",
                                        "Last 7 Days"
                                    ]}
                                    value={filterTime}
                                    onChange={(e) => setFilterTime(e.target.value)}
                                    placeholder="Time"
                                />
                            </div>
                        </div>

                        {/* My Schedule */}
                        <div>
                            <div className="flex justify-between items-center px-1 mb-4">
                                <h3 className="text-[#193C6C] font-bold text-lg">
                                    My Schedule
                                </h3>
                                {filteredAppointments.length > 3 && (
                                    <button
                                        onClick={() => setShowAll(!showAll)}
                                        className="text-blue-500 text-sm font-bold hover:underline"
                                    >
                                        {showAll ? "Show less" : "See all"}
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {displayedAppointments.length > 0 ? (
                                    displayedAppointments.map((ticket) => {
                                        // Extract date for display
                                        let displayDate = "N/A";
                                        if (ticket.appointment) {
                                            displayDate = dayjs(
                                                ticket.appointment.scheduledAt
                                            ).format("DD MMM YYYY");
                                        } else {
                                            const match = ticket.description?.match(
                                                /\[Requested Appointment: (\d{4}-\d{2}-\d{2})/
                                            );
                                            if (match) {
                                                displayDate = dayjs(match[1]).format("DD MMM YYYY");
                                            }
                                        }

                                        return (
                                            <div
                                                key={ticket.id}
                                                className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
                                                onClick={() => navigate(`/user/ticket/${ticket.id}`)}
                                            >
                                                {/* Image Thumbnail */}
                                                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                                                    {ticket.images && ticket.images.length > 0 ? (
                                                        <img
                                                            src={ticket.images[0].url}
                                                            className="w-full h-full object-cover"
                                                            alt="Ticket"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                            <CalendarIcon size={24} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-gray-900 truncate">
                                                        AP-{ticket.id} : {ticket.category?.name || "Issue"}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1 text-gray-500 text-sm">
                                                        <CalendarIcon size={14} />
                                                        <span>{displayDate}</span>
                                                    </div>
                                                    {!ticket.appointment && (
                                                        <p className="text-xs text-amber-500 font-bold mt-1">
                                                            Waiting for Confirmation
                                                        </p>
                                                    )}
                                                </div>

                                                <ChevronRight className="text-gray-400" />
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                            <CalendarIcon size={24} />
                                        </div>
                                        <p className="text-gray-500 font-medium">
                                            No appointments scheduled.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Add Action Button (To resemble a primary action) */}
            {/* Note: Mockup doesn't show FAB but usually needed to create new appt */}
            {/* Wait, the mockup has Navigation Bar at bottom (Home, Ticket, Scan, Profile). */}
            {/* But User requested to "Adjust Appointment new look like picture". Picture 3 is "Appointment" Form. */}
            {/* So we need a way to get to that form. I'll add a FAB or just rely on Sidebar/Menu? */}
            {/* The mockup shows a flow where you might click a '+' or select a slot. */}
            {/* For now, I'll assume they navigate here via menu, and maybe want to 'Book' something. */}
            <button
                onClick={() => navigate("/user/create-ticket")}
                className="fixed bottom-24 right-6 w-14 h-14 bg-[#193C6C] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-[#132E52] active:scale-95 transition-all z-30"
            >
                <Plus size={28} />
            </button>
        </div>
    );
};

export default UserAppointments;
