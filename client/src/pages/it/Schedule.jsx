import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/auth-store';
import { getSchedule } from '../../api/it';
import dayjs from 'dayjs';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Schedule = () => {
    const { token, user } = useAuthStore();
    const navigate = useNavigate();
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSchedule();
    }, [currentDate, token]);

    const loadSchedule = async () => {
        try {
            // Re-use standard getSchedule but we might need to fetch a WHOLE MONTH for the calendar view
            // The current getSchedule controller only accepts a 'date' query and returns that day (or maybe loop in backend?)
            // For now, let's fetch the current viewing DAY's schedule to list below,
            // and maybe we can enhance the backend later to return month's dots.
            // OR - we iterate and fetch logic.
            // Let's stick to a Daily Schedule View primarily, or a Monthly view where we pick a day?
            // "Calendar view for IT" usually implies Monthly.

            // NOTE: The current backend `getSchedule` (from existing code) filters specific to a day. 
            // To make a proper calendar with dots, we'd need a "getMonthSchedule".
            // Since I didn't add that to the plan, I will implement a UI that focuses on "Selected Day" 
            // and maybe fetch range if possible, or just show list for selected day.

            setLoading(true);
            const res = await getSchedule(token, currentDate.format('YYYY-MM-DD'));
            setAppointments(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const daysInMonth = Array.from({ length: currentDate.daysInMonth() }, (_, i) => i + 1);
    const startDay = currentDate.startOf('month').day(); // 0 (Sun) to 6 (Sat)
    const blanks = Array.from({ length: startDay }, (_, i) => i);

    const isToday = (day) => {
        return dayjs().date() === day && dayjs().month() === currentDate.month() && dayjs().year() === currentDate.year();
    };

    const isSelected = (day) => {
        return currentDate.date() === day;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24 p-4 md:p-6 animate-in fade-in duration-500">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3 tracking-tight">
                            <CalendarIcon className="text-blue-600" size={32} />
                            Technician Schedule
                        </h1>
                        <p className="text-gray-500 text-sm mt-2 ml-1">Manage appointments and service requests</p>
                    </div>
                    <button
                        onClick={() => setCurrentDate(dayjs())}
                        className="self-start md:self-auto px-4 py-2 bg-white border border-gray-200 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all font-medium shadow-sm active:scale-95"
                    >
                        Jump to Today
                    </button>
                </div>

                <div className="grid md:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {/* Calendar Widget */}
                    <div className="md:col-span-5 lg:col-span-4 bg-white rounded-3xl shadow-sm border border-gray-100/50 p-6 sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <button onClick={() => setCurrentDate(currentDate.subtract(1, 'month'))} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                                <ChevronLeft size={24} />
                            </button>
                            <h2 className="font-bold text-xl text-gray-800 tracking-tight">{currentDate.format('MMMM YYYY')}</h2>
                            <button onClick={() => setCurrentDate(currentDate.add(1, 'month'))} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all">
                                <ChevronRight size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center mb-3">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                <div key={d} className="text-xs font-bold text-gray-400 uppercase tracking-widest py-1">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
                            {blanks.map(i => <div key={`blank-${i}`} />)}
                            {daysInMonth.map(day => (
                                <button
                                    key={day}
                                    onClick={() => setCurrentDate(currentDate.date(day))}
                                    className={`
                                        h-10 w-10 md:h-11 md:w-11 rounded-2xl flex items-center justify-center text-sm font-medium transition-all duration-200
                                        ${isSelected(day)
                                            ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200 scale-105'
                                            : 'hover:bg-gray-50 text-gray-700 hover:text-blue-600'
                                        }
                                        ${isToday(day) && !isSelected(day) ? 'ring-2 ring-blue-500/20 text-blue-600 font-bold bg-blue-50/50' : ''}
                                    `}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Schedule List */}
                    <div className="md:col-span-7 lg:col-span-8 space-y-4">
                        <div className="flex items-center gap-3 mb-2 px-1">
                            <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                            <h3 className="font-bold text-xl text-gray-800">
                                {isToday(currentDate.date()) ? "Today's Appointments" : `Appointments for ${currentDate.format('MMM D, YYYY')}`}
                            </h3>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-20 bg-white rounded-3xl border border-gray-100">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-100 border-t-blue-500"></div>
                            </div>
                        ) : appointments.length > 0 ? (
                            appointments.map(apt => (
                                <div key={apt.id} className="bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                                    <div className="flex flex-col sm:flex-row gap-5">
                                        {/* Time Badge */}
                                        <div className="flex sm:flex-col items-center justify-center bg-blue-50/50 text-blue-600 px-5 py-3 sm:py-0 sm:w-24 rounded-2xl border border-blue-100/50 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-500 transition-colors">
                                            <span className="font-bold text-xl sm:text-2xl tracking-tight">{dayjs(apt.scheduledAt).format('HH:mm')}</span>
                                            {/* <span className="text-xs font-bold opacity-60 ml-2 sm:ml-0">{dayjs(apt.scheduledAt).format('A')}</span> */}
                                        </div>

                                        <div className="flex-1 space-y-3">
                                            <div className="flex flex-wrap justify-between items-start gap-2">
                                                <div>
                                                    <h4 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                                                        {apt.ticket.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wide">
                                                            Ticket #{apt.ticket.id}
                                                        </span>
                                                        <span>•</span>
                                                        <span className="font-medium text-gray-700">Room {apt.ticket.room?.roomNumber}</span>
                                                    </div>
                                                </div>
                                                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide shadow-sm">
                                                    Confirmed
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-50">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                        <span className="text-xs">👤</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400 font-medium uppercase">Requester</p>
                                                        <p className="font-semibold text-gray-700">{apt.ticket.createdBy?.name || apt.ticket.createdBy?.username || 'Unknown'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                                                        <span className="text-xs">📞</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400 font-medium uppercase">Contact</p>
                                                        <p className="font-semibold text-gray-700">{apt.ticket.createdBy?.phoneNumber || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {apt.note && (
                                                <div className="mt-3 text-sm bg-yellow-50/50 p-3 rounded-xl text-gray-600 border border-yellow-100/50 flex gap-2">
                                                    <span className="text-yellow-500">📝</span>
                                                    <span className="italic">{apt.note}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white py-16 px-6 rounded-3xl shadow-sm text-center border-2 border-dashed border-gray-100 group hover:border-blue-100 transition-colors">
                                <div className="w-20 h-20 bg-blue-50 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                                    <Clock size={40} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800">No appointments</h3>
                                <p className="text-gray-500 mt-2 max-w-xs mx-auto">There are no tasks scheduled for {currentDate.format('MMMM D, YYYY')}. Enjoy your day!</p>
                                {!isToday(dayjs().date()) &&
                                    <button
                                        onClick={() => setCurrentDate(dayjs())}
                                        className="mt-6 text-blue-600 font-bold hover:underline"
                                    >
                                        Go to Today
                                    </button>
                                }
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Schedule;
