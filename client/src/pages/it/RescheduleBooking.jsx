import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/auth-store';
import { getITAvailability, requestReschedule } from '../../api/appointment';
import { getSchedule } from '../../api/it';
import { getTicket } from '../../api/ticket';
import { getPersonalTasks } from '../../api/personalTask';
import CalendarGrid from '../../components/CalendarGrid';
import dayjs from 'dayjs';
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    Clock,
    X,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    ArrowLeft,
    CalendarClock
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

const RescheduleBooking = () => {
    const { token, user } = useAuthStore();
    const navigate = useNavigate();
    const { id } = useParams(); // Ticket ID


    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [appointments, setAppointments] = useState([]);
    const [personalTasks, setPersonalTasks] = useState([]);
    const [monthlyEvents, setMonthlyEvents] = useState([]);

    const [isMonthView, setIsMonthView] = useState(false);

    // Ticket & Booking State
    const [ticket, setTicket] = useState(null);
    const [selectedTime, setSelectedTime] = useState("");
    const [reason, setReason] = useState("");

    const loadTicket = React.useCallback(async () => {
        try {
            const res = await getTicket(token, id);
            setTicket(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load ticket");
        }
    }, [id, token]);

    const loadSchedule = React.useCallback(async () => {
        try {
            const dateStr = selectedDate.format('YYYY-MM-DD');
            const [aptRes, taskRes] = await Promise.all([
                getSchedule(token, dateStr),
                getPersonalTasks(token, { date: dateStr })
            ]);
            setAppointments(Array.isArray(aptRes?.data) ? aptRes.data : []);
            setPersonalTasks(Array.isArray(taskRes?.data) ? taskRes.data : []);
        } catch (err) {
            console.error(err);
        }
    }, [selectedDate, token]);

    const loadMonthlyEvents = React.useCallback(async () => {
        try {
            const startOfMonth = selectedDate.startOf('month').format('YYYY-MM-DD');
            const endOfMonth = selectedDate.endOf('month').format('YYYY-MM-DD');
            const res = await getITAvailability(token, startOfMonth, endOfMonth);
            setMonthlyEvents(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [selectedDate, token]);

    useEffect(() => {
        loadTicket();
    }, [loadTicket]);

    useEffect(() => {
        loadSchedule();
    }, [loadSchedule]);

    useEffect(() => {
        loadMonthlyEvents();
    }, [loadMonthlyEvents]);

    const handleReschedule = async () => {
        if (!selectedTime) return toast.warning("Please select a time");
        if (!reason) return toast.warning("Please provide a reason");
        if (!ticket?.appointment) return toast.error("No active appointment to reschedule");

        try {
            await requestReschedule(token, {
                appointmentId: ticket.appointment.id,
                newDate: selectedDate.format('YYYY-MM-DD'),
                newTime: selectedTime,
                reason: reason
            });
            toast.success("Reschedule request sent successfully");
            navigate(`/it/ticket/${id}`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to submit reschedule");
        }
    };

    // Helper functions for Calendar
    const getDaysArray = () => {
        const start = selectedDate.startOf('month');
        const end = selectedDate.endOf('month');
        const days = [];
        let curr = start;
        while (curr.isBefore(end) || curr.isSame(end, 'day')) {
            days.push(curr);
            curr = curr.add(1, 'day');
        }
        return days;
    };
    const days = getDaysArray();

    const getEventColorDot = (day) => {
        const dateStr = day.format('YYYY-MM-DD');
        const events = monthlyEvents.filter(e => dayjs(e.date).format('YYYY-MM-DD') === dateStr);
        if (events.length === 0) return null;
        return (
            <div className="flex gap-0.5 mt-1 justify-center">
                {events.slice(0, 3).map((e, i) => (
                    <div key={i} className={`w-1 h-1 rounded-full ${e.type === 'appointment' ? 'bg-blue-500' : 'bg-green-500'}`} />
                ))}
            </div>
        );
    };

    const allEvents = [
        ...personalTasks.map(t => ({ ...t, type: 'task', color: t.color || '#F87171' })),
        ...appointments.map(a => ({
            ...a,
            title: `Appointment: ${a.ticket?.title}`,
            description: `Room: ${a.ticket?.room?.roomNumber}`,
            startTime: a.scheduledAt,
            color: '#3B82F6',
            type: 'appointment'
        }))
    ].sort((a, b) => new Date(a.startTime || a.date) - new Date(b.startTime || b.date));


    return (
        <div className="min-h-screen bg-gray-50 pb-32 font-sans relative">
            {/* Header */}
            <div className="bg-white pt-6 pb-2 px-6 sticky top-0 z-20">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="text-blue-600" size={24} strokeWidth={2.5} />
                    </button>
                    <h1 className="text-xl font-bold text-blue-600">Booking</h1>
                    <div className="w-8"></div>
                </div>

                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-blue-400 font-bold text-sm">IT Calendar</h2>
                    <button
                        onClick={() => setIsMonthView(!isMonthView)}
                        className="flex items-center gap-2 bg-white border border-blue-100 px-3 py-1.5 rounded-xl shadow-sm text-blue-600 font-bold text-sm"
                    >
                        {selectedDate.format('MMM YYYY')}
                        <CalendarIcon size={14} />
                    </button>
                </div>
            </div>

            {/* Calendar Strip */}
            <div className="px-6 mb-6">
                {isMonthView ? (
                    <div className="bg-white rounded-3xl p-4 shadow-lg border border-gray-100">
                        <CalendarGrid
                            currentDate={selectedDate}
                            setCurrentDate={setSelectedDate}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            events={monthlyEvents}
                            onDateSelect={(day) => {
                                setSelectedDate(day);
                                setIsMonthView(false);
                            }}
                        />
                    </div>
                ) : (
                    <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 snap-x">
                        {days.map((day, idx) => {
                            const isSelected = day.isSame(selectedDate, 'day');
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDate(day)}
                                    className={`
                                        snap-center shrink-0 flex flex-col items-center justify-center w-14 h-20 rounded-2xl transition-all duration-300
                                        ${isSelected ? 'bg-blue-50 border-2 border-blue-100 shadow-sm' : 'bg-white hover:bg-gray-50 text-gray-400'}
                                    `}
                                >
                                    <span className={`font-bold text-lg mb-1 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {day.format('D')}
                                    </span>
                                    <span className={`text-xs font-medium ${isSelected ? 'text-blue-500' : 'text-gray-300'}`}>
                                        {day.format('dd')}
                                    </span>
                                    {getEventColorDot(day)}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Time Selection */}
            <div className="px-6 mb-8">
                <h3 className="font-bold text-gray-800 mb-4 text-sm">Select New Time</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Time</label>
                        <input
                            type="time"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Reason</label>
                        <input
                            type="text"
                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 font-bold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Why?"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Schedule Today List */}
            <div className="px-6 mb-8">
                <h3 className="font-bold text-gray-800 mb-4 text-sm">Schedule Today</h3>
                <div className="space-y-3">
                    {allEvents.length > 0 ? allEvents.map((item, idx) => (
                        <div key={idx} className={`rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden ${item.type === 'appointment' ? 'bg-red-50' : 'bg-orange-50'}`}>
                            {/* Mockup styling - using colors from mockup */}
                            {/* Mockup uses Red/Orange bg for items */}
                            <div
                                className="absolute left-0 top-0 bottom-0 w-2"
                                style={{ backgroundColor: item.color }}
                            ></div>

                            <div className="flex-1">
                                <h4 className="font-bold text-gray-800 text-sm">{item.title}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">{dayjs(item.startTime || item.date).format('HH:mm')} - {item.description}</p>
                            </div>

                            {/* Avatars mockup */}
                            <div className="flex -space-x-2">
                                <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-[10px] overflow-hidden">
                                    {user?.picture ? <img src={user.picture} className="w-full h-full object-cover" /> : 'U'}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-400 text-sm">Free schedule</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reminder / Tomorrow's Schedule (Mockup Requirement) */}
            <div className="px-6 mb-8">
                <h3 className="font-bold text-gray-800 mb-1 text-sm">Reminder</h3>
                <p className="text-gray-400 text-xs mb-4">Don't forget schedule for tomorrow</p>

                {/* Just showing a static reminder or next day's first item for now to match mockup structure */}
                <div className="bg-blue-600 rounded-2xl p-4 text-white flex items-center gap-4 shadow-lg shadow-blue-200">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <CalendarIcon size={24} />
                    </div>
                    <div>
                        <h4 className="font-bold text-sm">Upcoming Tasks</h4>
                        <p className="text-blue-100 text-xs mt-1">Check tomorrow's schedule too</p>
                    </div>
                </div>
            </div>

            {/* Bottom Buttons */}
            {/* Bottom Buttons */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-md border-t border-gray-100 flex gap-4 z-50 pb-8 shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.1)]">
                <button
                    onClick={() => navigate(-1)}
                    className="flex-1 bg-gray-50 text-gray-500 font-bold py-4 rounded-2xl hover:bg-gray-100 transition duration-300 transform active:scale-[0.98]"
                >
                    Back
                </button>
                <button
                    onClick={handleReschedule}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 hover:shadow-blue-300 transition duration-300 transform active:scale-[0.98]"
                >
                    Reschedule
                </button>
            </div>

        </div>
    );
};

export default RescheduleBooking;
