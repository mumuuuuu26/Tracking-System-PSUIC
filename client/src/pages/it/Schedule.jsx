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
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <CalendarIcon className="text-blue-600" />
                    Technician Schedule
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentDate(dayjs())}
                        className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                    >
                        Today
                    </button>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Calendar Widget */}
                <div className="bg-white rounded-2xl shadow-sm p-6 h-fit">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => setCurrentDate(currentDate.subtract(1, 'month'))} className="p-2 hover:bg-gray-100 rounded-full">
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="font-bold text-lg">{currentDate.format('MMMM YYYY')}</h2>
                        <button onClick={() => setCurrentDate(currentDate.add(1, 'month'))} className="p-2 hover:bg-gray-100 rounded-full">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <div key={d} className="text-xs font-semibold text-gray-400 py-1">{d}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {blanks.map(i => <div key={`blank-${i}`} />)}
                        {daysInMonth.map(day => (
                            <button
                                key={day}
                                onClick={() => setCurrentDate(currentDate.date(day))}
                                className={`
                                    h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all
                                    ${isSelected(day) ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-100 text-gray-700'}
                                    ${isToday(day) && !isSelected(day) ? 'border border-blue-600 text-blue-600' : ''}
                                `}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Schedule List */}
                <div className="md:col-span-2 space-y-4">
                    <h3 className="font-semibold text-lg text-gray-700 mb-4">
                        Appointments for {currentDate.format('MMMM D, YYYY')}
                    </h3>

                    {loading ? (
                        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                    ) : appointments.length > 0 ? (
                        appointments.map(apt => (
                            <div key={apt.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4">
                                <div className="bg-blue-50 text-blue-600 p-3 rounded-lg flex flex-col items-center min-w-[80px]">
                                    <span className="font-bold text-lg">{dayjs(apt.scheduledAt).format('HH:mm')}</span>
                                    <span className="text-xs uppercase">{dayjs(apt.scheduledAt).format('A')}</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-800">{apt.ticket.title}</h4>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Confirmed</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">Ticket #{apt.ticket.id} • Room {apt.ticket.room?.roomNumber}</p>
                                    <div className="mt-3 flex gap-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-400">User:</span>
                                            <span className="font-medium">{apt.ticket.createdBy?.name || 'Unknown'}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-gray-400">Tel:</span>
                                            <span className="font-medium">{apt.ticket.createdBy?.phoneNumber || '-'}</span>
                                        </div>
                                    </div>
                                    {apt.note && (
                                        <div className="mt-2 text-sm bg-gray-50 p-2 rounded text-gray-600">
                                            Note: {apt.note}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white p-8 rounded-xl shadow-sm text-center border-2 border-dashed border-gray-200">
                            <Clock className="mx-auto text-gray-300 mb-2" size={48} />
                            <p className="text-gray-500">No appointments scheduled for this day.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Schedule;
