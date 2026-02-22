import React, { useState, useEffect } from "react";
import { Calendar, Clock, User } from "lucide-react";
import dayjs from "dayjs";
import { getPublicSchedule } from "../../api/it";
import CalendarGrid from "../../components/CalendarGrid";
import UserWrapper from "../../components/user/UserWrapper";
import UserPageHeader from "../../components/user/UserPageHeader";

const ITSchedule = () => {
    const [schedule, setSchedule] = useState([]);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSchedule = async () => {
            try {
                const res = await getPublicSchedule();
                setSchedule(res.data);
            } catch {
                // Silent fail
            } finally {
                setLoading(false);
            }
        };
        loadSchedule();
    }, []);

    const eventsForCalendar = schedule.map(item => ({
        date: item.start,
        type: item.type,
        color: item.type === 'ticket' ? '#EF4444' : '#3B82F6'
    }));

    const selectedItems = schedule.filter(item =>
        dayjs(item.start).isSame(selectedDate, 'day')
    ).sort((a, b) => dayjs(a.start).diff(dayjs(b.start)));

    return (
        <UserWrapper>
            <div className="pb-8 bg-gray-50 dark:bg-[#0d1b2a] min-h-screen">
                {/* Header */}
                <UserPageHeader title="IT Schedule" />

                <div className="max-w-md md:max-w-2xl mx-auto px-6 mt-6 relative z-20 space-y-6">

                    {/* Calendar */}
                    <div className="bg-white dark:bg-[#1a2f4e] rounded-2xl border border-gray-200 dark:border-blue-800/30 overflow-hidden shadow-sm dark:shadow-lg">
                        <CalendarGrid
                            currentDate={currentMonth}
                            setCurrentDate={setCurrentMonth}
                            selectedDate={selectedDate}
                            setSelectedDate={setSelectedDate}
                            events={eventsForCalendar}
                            onDateSelect={setSelectedDate}
                        />
                    </div>

                    {/* Daily List */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-600 dark:text-blue-200/80 text-sm flex items-center gap-2 uppercase tracking-wide">
                            <Calendar className="text-blue-600 dark:text-blue-400" size={16} />
                            Overview · {selectedDate.format('DD MMM YYYY')}
                        </h3>

                        {loading ? (
                            <div className="text-center py-10 text-gray-500 dark:text-blue-400/60 text-sm animate-pulse">Loading schedule...</div>
                        ) : selectedItems.length > 0 ? (
                            selectedItems.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-[#1a2f4e] rounded-2xl p-4 border border-gray-200 dark:border-blue-800/30 flex items-start gap-4 shadow-sm dark:shadow-none">
                                    <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center border ${item.type === 'ticket'
                                        ? 'bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 border-red-200 dark:border-red-700/40'
                                        : 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-700/40'
                                        }`}>
                                        <Clock size={18} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">{item.details}</h4>
                                            <span className="text-xs font-medium text-gray-500 dark:text-blue-400/60 shrink-0 ml-2">
                                                {dayjs(item.start).format('HH:mm')}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${item.type === 'ticket'
                                                ? 'bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 border-red-200 dark:border-red-700/40'
                                                : 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-700/40'
                                                }`}>
                                                {item.type === 'ticket' ? 'Busy' : 'Task'}
                                            </span>
                                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-blue-400/60">
                                                <User size={11} />
                                                <span>{item.staff || "IT Staff"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white dark:bg-[#1a2f4e] rounded-2xl p-8 text-center border border-gray-200 dark:border-blue-800/30 shadow-sm dark:shadow-none">
                                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-700/40">
                                    <Calendar size={26} />
                                </div>
                                <p className="text-gray-900 dark:text-white font-bold text-sm">No tasks scheduled</p>
                                <p className="text-sm text-gray-500 dark:text-blue-400/60 mt-1">IT Support is likely available.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </UserWrapper>
    );
};

export default ITSchedule;
