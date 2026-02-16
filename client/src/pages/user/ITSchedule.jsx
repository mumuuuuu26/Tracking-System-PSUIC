import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronLeft, Clock, User, ArrowLeft } from "lucide-react";
import dayjs from "dayjs";
import useAuthStore from "../../store/auth-store";
import { getPublicSchedule } from "../../api/it";
// Reuse CalendarGrid for consistency
import CalendarGrid from "../../components/CalendarGrid";
import UserWrapper from "../../components/user/UserWrapper";
import UserPageHeader from "../../components/user/UserPageHeader";

const ITSchedule = () => {
    const navigate = useNavigate();
    const { token } = useAuthStore();

    // State
    const [schedule, setSchedule] = useState([]);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [currentMonth, setCurrentMonth] = useState(dayjs());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSchedule = async () => {
            try {
                const res = await getPublicSchedule(token);
                setSchedule(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            loadSchedule();
        }
    }, [token]);

    // Helpers
    // Map schedule to events for calendar dots
    const eventsForCalendar = schedule.map(item => ({
        date: item.start,
        type: item.type,
        color: item.type === 'ticket' ? '#EF4444' : '#3B82F6' // Red for fix, Blue for internal
    }));

    // Filter items for selected day
    const selectedItems = schedule.filter(item =>
        dayjs(item.start).isSame(selectedDate, 'day')
    ).sort((a, b) => dayjs(a.start).diff(dayjs(b.start)));

    return (
        <UserWrapper>
            <div className="pb-8">
                {/* Standard Header */}
                <UserPageHeader title="IT Schedule" />

                <div className="max-w-md md:max-w-2xl mx-auto px-6 mt-6 relative z-20 space-y-6">

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
                            Overview for {selectedDate.format('DD MMM YYYY')}
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
                                        <div className="flex items-center gap-2 mt-1">
                                            {/* Status Badge */}
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${item.type === 'ticket' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {item.type === 'ticket' ? 'Busy' : 'Task'}
                                            </span>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                <User size={12} />
                                                <span>{item.staff || "IT Staff"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
                                <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Calendar size={32} />
                                </div>
                                <p className="text-gray-900 font-bold">No tasks scheduled</p>
                                <p className="text-sm text-gray-500">IT Support is likely available.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </UserWrapper>
    );
};

export default ITSchedule;
