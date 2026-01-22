import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/auth-store';
import { getSchedule } from '../../api/it';
import { createPersonalTask, getPersonalTasks, deletePersonalTask } from '../../api/personalTask';
import { getITAvailability } from '../../api/appointment';
import CalendarGrid from '../../components/CalendarGrid';
import dayjs from 'dayjs';
import 'dayjs/locale/en'; // ensure locale is loaded if needed
import {
    Calendar as CalendarIcon,
    ChevronLeft,
    ChevronRight,
    Clock,
    Plus,
    X,
    Trash2,
    Bell,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    AlertTriangle,
    CalendarClock
} from 'lucide-react';
import { requestReschedule } from '../../api/appointment';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const Schedule = () => {
    const { token, user } = useAuthStore();
    const navigate = useNavigate();

    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [appointments, setAppointments] = useState([]);
    const [personalTasks, setPersonalTasks] = useState([]);
    const [monthlyEvents, setMonthlyEvents] = useState([]); // For calendar dots

    const [isMonthView, setIsMonthView] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        color: '#3B82F6' // Blue default as per Deep Blue theme
    });

    // Reschedule Modal State
    const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
    const [rescheduleData, setRescheduleData] = useState({
        appointmentId: null,
        newDate: '',
        newTime: '',
        reason: ''
    });

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
            console.error("Error loading schedule:", err);
            // toast.error("Failed to load schedule");
        }
    }, [selectedDate, token]);

    const loadMonthlyEvents = React.useCallback(async () => {
        try {
            const startOfMonth = selectedDate.startOf('month').format('YYYY-MM-DD');
            const endOfMonth = selectedDate.endOf('month').format('YYYY-MM-DD');
            const res = await getITAvailability(token, startOfMonth, endOfMonth);
            setMonthlyEvents(res.data);
        } catch (err) {
            console.error("Error loading monthly events:", err);
        }
    }, [selectedDate, token]);

    useEffect(() => {
        loadSchedule();
    }, [loadSchedule]);

    useEffect(() => {
        loadMonthlyEvents();
    }, [loadMonthlyEvents]);

    const handleAddTask = async (e) => {
        e.preventDefault();
        try {
            const dateStr = selectedDate.format('YYYY-MM-DD');
            const payload = {
                ...formData,
                date: dateStr,
                startTime: formData.startTime ? `${dateStr}T${formData.startTime}:00` : null,
                endTime: formData.endTime ? `${dateStr}T${formData.endTime}:00` : null,
            };

            await createPersonalTask(token, payload);
            toast.success("Task added successfully");
            setIsModalOpen(false);
            setFormData({ title: '', description: '', startTime: '', endTime: '', color: '#3B82F6' });
            loadSchedule();
            loadMonthlyEvents();
        } catch (err) {
            console.error(err);
            toast.error("Failed to add task");
        }
    };

    const handleDeleteTask = async (id) => {
        if (!window.confirm("Are you sure you want to delete this task?")) return;
        try {
            await deletePersonalTask(token, id);
            toast.success("Task deleted");
            loadSchedule();
            loadMonthlyEvents();
        } catch (err) {
            console.error(err);
            toast.error("Failed to delete task");
        }
    };

    // Horizontal Calendar Logic
    const getDaysArray = () => {
        // Show 2 weeks around selected date
        const start = selectedDate.startOf('week').subtract(0, 'week'); // Start from current week
        const days = [];
        for (let i = 0; i < 14; i++) {
            days.push(start.add(i, 'day'));
        }
        return days;
    };

    const days = getDaysArray();



    const getEventColorDot = (day) => {
        const dateStr = day.format('YYYY-MM-DD');
        const events = monthlyEvents.filter(e => dayjs(e.date).format('YYYY-MM-DD') === dateStr);
        if (events.length === 0) return null;

        // Prioritize tasks? or just show up to 3 dots
        return (
            <div className="flex gap-0.5 mt-1 justify-center">
                {events.slice(0, 3).map((e, i) => (
                    <div key={i} className={`w-1 h-1 rounded-full ${e.type === 'appointment' ? 'bg-blue-500' : 'bg-green-500'}`} />
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            {/* Header Section */}
            <div className="bg-blue-600 pt-8 pb-6 px-6 rounded-b-[2.5rem] shadow-xl relative overflow-hidden transition-all duration-500 ease-in-out">
                {/* Profile & Bell */}
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full border-2 border-white/30 overflow-hidden">
                            {user?.picture ? (
                                <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                                    {user?.username?.[0] || 'U'}
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-white font-bold text-lg leading-tight">IT Support</h2>
                            <p className="text-blue-200 text-xs">Technician Portal</p>
                        </div>
                    </div>

                </div>

                {/* Banner Card */}
                {!isMonthView && (
                    <div className="bg-blue-500 rounded-3xl p-5 flex items-center gap-4 relative z-10 shadow-lg border border-blue-400/30 animate-in fade-in slide-in-from-top-4">
                        <div className="w-12 h-12 bg-blue-400/30 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm">
                            <CalendarIcon size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-lg">View Schedule</h3>
                            <p className="text-blue-100 text-sm">Manage appointments and availability</p>
                        </div>
                        <div className="bg-green-500 rounded-full p-1 border-2 border-white">
                            <CheckCircle size={12} className="text-white" />
                        </div>
                    </div>
                )}

                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full blur-2xl opacity-30 translate-y-1/4 -translate-x-1/4"></div>
            </div>

            {/* Calendar Strip / Month View */}
            <div className={`px-6 mt-6 transition-all duration-300 ${isMonthView ? 'bg-white rounded-3xl mx-4 p-4 shadow-lg' : ''}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-blue-600 font-bold text-lg">IT Calendar</h3>
                    <button
                        onClick={() => setIsMonthView(!isMonthView)}
                        className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm hover:bg-gray-50 active:scale-95 transition-all"
                    >
                        <span className="text-gray-600 font-medium text-sm">{selectedDate.format('MMM YYYY')}</span>
                        {isMonthView ? <ChevronUp size={14} className="text-blue-500" /> : <ChevronDown size={14} className="text-blue-500" />}
                        <CalendarIcon size={14} className="text-blue-500 ml-1" />
                    </button>
                </div>

                {isMonthView ? (
                    <div className="max-w-lg mx-auto">
                        <CalendarGrid
                            currentDate={selectedDate}
                            setCurrentDate={setSelectedDate}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            events={monthlyEvents}
                            onDateSelect={(day) => setSelectedDate(day)}
                        />
                    </div>
                ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 snap-x">
                        {days.map((day, idx) => {
                            const isSelected = day.isSame(selectedDate, 'day');
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDate(day)}
                                    className={`
                                        snap-center shrink-0 flex flex-col items-center justify-center w-14 h-20 rounded-3xl transition-all duration-300
                                        ${isSelected ? 'bg-blue-50 scale-110 shadow-sm border border-blue-100' : 'hover:bg-gray-100'}
                                    `}
                                >
                                    <span className={`font-bold text-xl mb-1 ${isSelected ? 'text-gray-800' : ''}`}>
                                        {day.format('D')}
                                    </span>
                                    <span className={`text-xs font-medium ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                                        {day.format('dd')}
                                    </span>
                                    {getEventColorDot(day)}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Schedule Today */}
            <div className="px-6 mt-2">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-gray-800 font-bold text-lg">Schedule Today</h3>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-1"
                    >
                        <Plus size={12} />
                        Add Task
                    </button>
                </div>

                <div className="space-y-6 relative ml-2">
                    {/* MERGED LIST LOGIC */}
                    {(() => {
                        const allEvents = [
                            ...personalTasks.map(t => ({ ...t, type: 'task' })),
                            ...appointments.map(a => ({
                                ...a,
                                id: `apt-${a.id}`, // specific ID format
                                realId: a.id,
                                title: `Appointment: ${a.ticket?.title}`,
                                description: `Ticket #${a.ticket?.id} - User: ${a.ticket?.createdBy?.email}`,
                                startTime: a.scheduledAt,
                                color: '#3B82F6', // Blue default for appointments
                                type: 'appointment',
                                ticketId: a.ticketId // Keep ref
                            }))
                        ].sort((a, b) => new Date(a.startTime || a.date) - new Date(b.startTime || b.date));

                        if (allEvents.length === 0) {
                            return (
                                <div className="text-center py-10 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                                    <p className="text-gray-400 text-sm">No tasks for today</p>
                                </div>
                            );
                        }

                        return allEvents.map((item) => (
                            <div key={item.id} className="relative pl-12 group">
                                {/* Time Label */}
                                <div className="absolute left-0 top-0 text-gray-400 text-sm font-medium w-10 text-right">
                                    {item.startTime ? dayjs(item.startTime).format('HH.mm') : 'All Day'}
                                </div>

                                {/* Card */}
                                <div
                                    className={`rounded-[2rem] p-4 flex items-center justify-between shadow-sm relative overflow-hidden transition-transform active:scale-[0.98] cursor-pointer
                                        ${item.type === 'appointment' ? 'bg-blue-600 text-white' : ''}
                                    `}
                                    style={item.type === 'task' ? { backgroundColor: item.color ? `${item.color}40` : '#3B82F640' } : {}}
                                    onClick={() => {
                                        if (item.type === 'appointment') navigate(`/it/ticket/${item.ticketId}`);
                                    }}
                                >
                                    {item.type === 'task' && (
                                        <div className="absolute inset-0 opacity-20" style={{ backgroundColor: item.color || '#3B82F6' }}></div>
                                    )}

                                    <div className="relative z-10 flex items-center gap-4 w-full">
                                        {/* Icon for Appointment */}
                                        {item.type === 'appointment' && (
                                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                                <CalendarIcon size={18} className="text-white" />
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <h4 className={`font-bold ${item.type === 'appointment' ? 'text-white' : 'text-gray-800'}`}>{item.title}</h4>
                                            <p className={`text-xs mt-1 truncate ${item.type === 'appointment' ? 'text-blue-100' : 'text-gray-600'}`}>
                                                {item.description || 'No details'}
                                            </p>
                                            {item.status === 'reschedule_requested' && (
                                                <div className="mt-2 flex flex-col items-start gap-1">
                                                    <span className="inline-block bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                        Reschedule Requested
                                                    </span>
                                                    {item.newDate && (
                                                        <span className="text-[10px] text-yellow-100 font-medium">
                                                            Proposed: {dayjs(item.newDate).format('D MMM, HH:mm')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            {item.type === 'task' ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(item.id); }}
                                                    className="p-2 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            ) : (
                                                // Reschedule Button for Appointment
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setRescheduleData({ ...rescheduleData, appointmentId: item.realId });
                                                        setIsRescheduleModalOpen(true);
                                                    }}
                                                    className="p-2 text-blue-200 hover:text-white transition-colors"
                                                    title="Reschedule"
                                                >
                                                    <CalendarClock size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </div>

            {/* Reschedule Modal */}
            {isRescheduleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <CalendarClock className="text-blue-500" /> Reschedule
                            </h3>
                            <button onClick={() => setIsRescheduleModalOpen(false)}><X className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                await requestReschedule(token, rescheduleData);
                                toast.success("Reschedule request sent");
                                setIsRescheduleModalOpen(false);
                                loadSchedule();
                            } catch (err) {
                                console.error(err);
                                toast.error("Failed to request reschedule");
                            }
                        }} className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-4">
                                Propose a new time for this appointment. The user will need to accept it.
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">New Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-700"
                                        value={rescheduleData.newDate}
                                        onChange={e => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">New Time</label>
                                    <input
                                        type="time"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-700"
                                        value={rescheduleData.newTime}
                                        onChange={e => setRescheduleData({ ...rescheduleData, newTime: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1 block">Reason</label>
                                <textarea
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    placeholder="Why do you need to reschedule?"
                                    rows={3}
                                    value={rescheduleData.reason}
                                    onChange={e => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                                    required
                                />
                            </div>

                            <button className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 mt-2">
                                Send Request
                            </button>
                        </form>
                    </div>
                </div>
            )}



            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-gray-800">New Task</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleAddTask} className="space-y-4">
                            <input
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-700"
                                placeholder="Task Title"
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="time"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    value={formData.startTime}
                                    onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                />
                                <input
                                    type="time"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    value={formData.endTime}
                                    onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2 justify-center py-2">
                                {['#193C6C', '#1E40AF', '#2563EB', '#3B82F6', '#60A5FA'].map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        style={{ backgroundColor: c }}
                                        onClick={() => setFormData({ ...formData, color: c })}
                                        className={`w-8 h-8 rounded-full transition-transform ${formData.color === c ? 'scale-125 ring-2 ring-gray-300' : 'hover:scale-110'}`}
                                    />
                                ))}
                            </div>
                            <button className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200">
                                Add to Schedule
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Schedule;
