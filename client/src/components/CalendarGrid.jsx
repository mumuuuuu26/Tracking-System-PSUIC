import React from 'react';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * CalendarGrid — Dark Navy Theme
 *
 * Props:
 *   currentDate    dayjs  — currently shown month
 *   setCurrentDate fn     — change month
 *   selectedDate   dayjs  — highlighted date
 *   events         []     — [{ date, color, type }]
 *   onDateSelect   fn     — called with dayjs when user clicks a date
 */
const CalendarGrid = ({
    currentDate,
    setCurrentDate,
    selectedDate,
    events = [],
    onDateSelect,
}) => {
    const getDaysArray = () => {
        const startDay = currentDate.startOf('month').startOf('week');
        const endDay = currentDate.endOf('month').endOf('week');
        const days = [];
        let day = startDay;
        while (day.isBefore(endDay)) {
            days.push(day);
            day = day.add(1, 'day');
        }
        return days;
    };

    const getEventDots = (day) => {
        const dateStr = day.format('YYYY-MM-DD');
        const dayEvents = events.filter(e => dayjs(e.date).format('YYYY-MM-DD') === dateStr);
        if (dayEvents.length === 0) return null;
        return (
            <div className="flex gap-0.5 mt-1 justify-center">
                {dayEvents.slice(0, 3).map((e, i) => (
                    <div
                        key={i}
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: e.color || '#60a5fa' }}
                    />
                ))}
            </div>
        );
    };

    const days = getDaysArray();

    return (
        <div className="bg-white dark:bg-[#1a2f4e] rounded-2xl p-4 border border-gray-200 dark:border-blue-800/30">
            {/* Month Header */}
            <div className="flex justify-between items-center mb-5 px-1">
                <button
                    onClick={() => setCurrentDate(currentDate.subtract(1, 'month'))}
                    className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-blue-800/40 text-gray-500 dark:text-blue-400/70 hover:text-gray-900 dark:hover:text-blue-200"
                >
                    <ChevronLeft size={18} />
                </button>
                <span className="font-bold text-gray-900 dark:text-white text-sm tracking-wide capitalize">
                    {currentDate.format('MMMM YYYY')}
                </span>
                <button
                    onClick={() => setCurrentDate(currentDate.add(1, 'month'))}
                    className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-blue-800/40 text-gray-500 dark:text-blue-400/70 hover:text-gray-900 dark:hover:text-blue-200"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Week Headers */}
            <div className="grid grid-cols-7 mb-3 text-center">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                    <div key={i} className="text-xs font-bold text-gray-500 dark:text-blue-400/50">{d}</div>
                ))}
            </div>

            {/* Day Grid */}
            <div className="grid grid-cols-7 gap-y-1 gap-x-1">
                {days.map((day, idx) => {
                    const isSelected = selectedDate && day.isSame(selectedDate, 'day');
                    const isCurrentMonth = day.month() === currentDate.month();
                    const isToday = day.isSame(dayjs(), 'day');

                    return (
                        <button
                            key={idx}
                            onClick={() => onDateSelect && onDateSelect(day)}
                            className={`
                                w-full aspect-square flex flex-col items-center justify-center rounded-xl text-xs
                                ${!isCurrentMonth ? 'text-gray-300 dark:text-blue-900/60' : 'text-gray-700 dark:text-blue-200'}
                                ${isSelected ? 'bg-blue-500 dark:bg-[#193C6C] !text-white shadow-md font-bold' : 'hover:bg-gray-50 dark:hover:bg-blue-800/30'}
                                ${isToday && !isSelected ? 'text-blue-600 dark:text-blue-300 font-extrabold ring-1 ring-blue-500/40' : ''}
                            `}
                        >
                            <span className="z-10">{day.format('D')}</span>
                            {getEventDots(day)}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default CalendarGrid;
