import React, { useEffect, useState } from 'react';
import useAuthStore from '../../store/auth-store';
import { listMyTickets } from '../../api/ticket';
import { createAppointment, getITAvailability } from '../../api/appointment';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Calendar, Clock, ChevronRight, Check } from 'lucide-react';
import CalendarGrid from '../../components/CalendarGrid';

dayjs.extend(isBetween);

const UserAppointments = () => {
    const { token } = useAuthStore();

    // States
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: Select Ticket, 2: Select Date/Time, 3: Success?
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs().add(1, 'day')); // Object dayjs
    const [currentMonth, setCurrentMonth] = useState(dayjs().add(1, 'day'));
    const [selectedTime, setSelectedTime] = useState('');
    const [note, setNote] = useState('');
    const [modalEvent, setModalEvent] = useState(null);

    // Calendar States
    const [monthlyEvents, setMonthlyEvents] = useState([]);

    // Load user's 'in_progress' tickets that don't have appointment
    useEffect(() => {
        loadTickets();
    }, []);

    // Load availability when date changes (month/year) or entering Step 2
    useEffect(() => {
        if (step === 2) {
            loadMonthlyEvents();
        }
    }, [step, currentMonth.format('YYYY-MM')]);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const res = await listMyTickets(token);
            // Filter: Status is in_progress (accepted by IT) AND no appointment booked yet
            const schedulable = res.data.filter(t => t.status === 'in_progress');
            setTickets(schedulable);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const loadMonthlyEvents = async () => {
        try {
            const startOfMonth = currentMonth.startOf('month').format('YYYY-MM-DD');
            const endOfMonth = currentMonth.endOf('month').format('YYYY-MM-DD');
            const res = await getITAvailability(token, startOfMonth, endOfMonth);
            setMonthlyEvents(res.data);
        } catch (err) {
            console.error("Error loading monthly events:", err);
        }
    };

    const handleTicketSelect = (ticket) => {
        setSelectedTicket(ticket);
        setStep(2);
    };

    const handleBooking = async () => {
        if (!selectedTime || !selectedDate) return toast.error("Please select date and time");

        try {
            const appointmentData = {
                ticketId: selectedTicket.id,
                date: selectedDate.format('YYYY-MM-DD'),
                time: selectedTime,
                note
            };

            await createAppointment(token, appointmentData);
            toast.success("Appointment booked successfully!");
            setStep(1);
            loadTickets(); // Refresh list
        } catch (err) {
            toast.error(err.response?.data?.message || "Booking failed");
        }
    };

    const getBusyEvent = (time) => {
        const slotStart = dayjs(`${selectedDate.format('YYYY-MM-DD')}T${time}:00`);
        const slotEnd = slotStart.add(1, 'hour');

        return monthlyEvents.find(event => {
            const eventDate = dayjs(event.date);
            if (!eventDate.isSame(selectedDate, 'day')) return false;

            if (event.type === 'task' && !event.endTime && !eventDate.hour()) return true;

            const eventStart = dayjs(event.date);
            const eventEnd = event.endTime ? dayjs(event.endTime) : eventStart.add(1, 'hour');

            return slotStart.isBefore(eventEnd) && slotEnd.isAfter(eventStart);
        });
    };

    const isBusyToday = (slots) => {
        return slots.every(time => !!getBusyEvent(time));
    };

    const handleTimeSelect = (time) => {
        const busyEvent = getBusyEvent(time);
        if (busyEvent) {
            setModalEvent(busyEvent);
        } else {
            setSelectedTime(time);
        }
    };

    const timeSlots = [
        "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"
    ];



    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 font-sans relative">
            {/* Modal for Busy Event */}
            {modalEvent && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Slot Unavailable</h3>
                                <p className="text-sm text-gray-500">This time slot is already booked.</p>
                            </div>
                            <button onClick={() => setModalEvent(null)} className="p-1 hover:bg-gray-100 rounded-full">
                                <ChevronRight className="rotate-90 text-gray-400" />
                            </button>
                        </div>

                        <div className={`p-4 rounded-2xl mb-4 ${modalEvent.type === 'appointment' ? 'bg-blue-50' : 'bg-green-50'}`}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-3 h-3 rounded-full ${modalEvent.type === 'appointment' ? 'bg-blue-500' : 'bg-green-500'}`} />
                                <span className={`text-xs font-bold uppercase ${modalEvent.type === 'appointment' ? 'text-blue-600' : 'text-green-600'}`}>
                                    {modalEvent.type}
                                </span>
                            </div>
                            <h4 className="font-bold text-gray-800 text-lg mb-1">{modalEvent.title}</h4>
                            <p className="text-gray-600 text-sm">{modalEvent.description || 'No additional details provided.'}</p>
                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 font-medium">
                                <Clock size={14} />
                                {dayjs(modalEvent.date).format('HH:mm')} - {modalEvent.endTime ? dayjs(modalEvent.endTime).format('HH:mm') : 'N/A'}
                            </div>
                        </div>

                        <button
                            onClick={() => setModalEvent(null)}
                            className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <h1 className="text-2xl font-bold mb-6 text-gray-800">Book an Appointment</h1>

            {/* Steps Indicator */}
            <div className="flex items-center mb-8 bg-gray-50 p-2 rounded-xl">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex-1 flex items-center justify-center">
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                            ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
                        `}>
                            {s}
                        </div>
                        {s < 3 && <div className={`h-1 flex-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <h2 className="text-lg font-semibold text-gray-700">Select a Ticket</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : tickets.length > 0 ? (
                        tickets.map(ticket => (
                            <button
                                key={ticket.id}
                                onClick={() => handleTicketSelect(ticket)}
                                className="w-full bg-white border border-gray-200 p-4 rounded-xl flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all text-left"
                            >
                                <div>
                                    <h3 className="font-bold text-gray-800">{ticket.title}</h3>
                                    <p className="text-sm text-gray-500">#{ticket.id} • {ticket.equipment?.name || 'Unknown Device'}</p>
                                </div>
                                <ChevronRight className="text-gray-400" />
                            </button>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-xl">
                            <p className="text-gray-500">No tickets available for booking.</p>
                            <p className="text-xs text-gray-400 mt-1">Wait for IT to accept your request.</p>
                        </div>
                    )}
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div>
                        <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-800 mb-2">← Back</button>
                        <h2 className="text-lg font-semibold text-gray-700">Select Date & Time</h2>
                        <p className="text-sm text-gray-500">Check IT availability and pick a slot for <span className="text-blue-600 font-bold">{selectedTicket?.title}</span></p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Calendar Column */}
                        <div className="md:w-full">
                            <CalendarGrid
                                currentDate={currentMonth}
                                setCurrentDate={setCurrentMonth}
                                selectedDate={selectedDate}
                                setSelectedDate={setSelectedDate}
                                events={monthlyEvents}
                                onDateSelect={(day) => {
                                    if (day.isBefore(dayjs(), 'day')) return; // Prevent selecting past
                                    setSelectedDate(day);
                                    setSelectedTime(''); // Reset time on date change
                                }}
                            />
                            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Busy (Appt)</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Busy (Task)</div>
                            </div>
                        </div>

                        {/* Time & Note Column */}
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm h-full">
                                <div className="mb-6">
                                    <label className="block text-sm font-medium mb-3 flex items-center gap-2">
                                        <Clock size={16} className="text-blue-500" />
                                        Available Slots for {selectedDate.format('DD MMM')}
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {timeSlots.map(time => {
                                            const busyEvent = getBusyEvent(time);
                                            const isBusy = !!busyEvent;
                                            return (
                                                <button
                                                    key={time}
                                                    onClick={() => handleTimeSelect(time)}
                                                    className={`
                                            py-2.5 px-3 rounded-xl border transition-all font-medium relative overflow-hidden group flex items-center justify-center
                                            ${isBusy
                                                            ? 'bg-red-50 border-red-100 cursor-pointer hover:bg-red-100'
                                                            : selectedTime === time
                                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-100'
                                                                : 'hover:bg-gray-50 border-gray-200 text-gray-600'
                                                        }
                                        `}
                                                >
                                                    {isBusy ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-red-300 line-through decoration-red-300">{time}</span>
                                                            <span className="text-[10px] font-bold text-red-500 uppercase flex items-center bg-white/60 px-2 py-0.5 rounded-md shadow-sm">
                                                                Busy <ChevronRight size={10} className="ml-0.5" />
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm">{time}</span>
                                                    )}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    {isBusyToday(timeSlots) && (
                                        <p className="text-xs text-red-500 mt-2 text-center">Fully booked this day.</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Note (Optional)</label>
                                    <textarea
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        rows="3"
                                        placeholder="Specific request details..."
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleBooking}
                        disabled={!selectedTime}
                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all active:scale-[0.99]"
                    >
                        Confirm Booking
                    </button>
                </div>
            )}

            {step === 3 && (
                <div className="text-center py-10 animate-in zoom-in-95">
                    {/* Success state if we want to show it explicitly */}
                </div>
            )}
        </div>
    );
};

export default UserAppointments;
