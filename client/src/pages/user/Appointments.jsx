import React, { useEffect, useState } from 'react';
import useAuthStore from '../../store/auth-store';
import { listMyTickets } from '../../api/ticket';
import { createAppointment, getAvailableSlots } from '../../api/appointment';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import { Calendar, Clock, ChevronRight, Check } from 'lucide-react';

const UserAppointments = () => {
    const { token, user } = useAuthStore();

    // States
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState(1); // 1: Select Ticket, 2: Select Time, 3: Confirm
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [selectedDate, setSelectedDate] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
    const [selectedTime, setSelectedTime] = useState('');
    const [note, setNote] = useState('');

    // Load user's 'in_progress' tickets that don't have appointment
    // (Ideally backend filters this, but we'll filter client side for now)
    useEffect(() => {
        loadTickets();
    }, []);

    const loadTickets = async () => {
        try {
            setLoading(true);
            const res = await listMyTickets(token);
            // Filter: Status is in_progress (accepted by IT) AND no appointment booked yet
            // Note: listMyTickets response structure needs to include appointment info or we assume if status is 'scheduled' it's booked.
            // If ticket model has 'status' = 'scheduled', we filter those OUT.
            // We want 'in_progress' only.
            const schedulable = res.data.filter(t => t.status === 'in_progress');
            setTickets(schedulable);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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
                date: selectedDate,
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

    const timeSlots = [
        "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"
    ];

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Book an Appointment</h1>

            {/* Steps Indicator */}
            <div className="flex items-center mb-8 bg-gray-50 p-2 rounded-xl">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex-1 flex items-center justify-center">
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                            ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
                        `}>
                            {s}
                        </div>
                        {s < 3 && <div className={`h-1 flex-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div className="space-y-4">
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
                <div className="space-y-6">
                    <div>
                        <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-gray-800 mb-2">← Back</button>
                        <h2 className="text-lg font-semibold text-gray-700">Select Date & Time</h2>
                        <p className="text-sm text-gray-500">for {selectedTicket.title}</p>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Date</label>
                            <input
                                type="date"
                                value={selectedDate}
                                min={dayjs().format('YYYY-MM-DD')}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full border rounded-lg p-2"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Available Time Slots</label>
                            <div className="grid grid-cols-3 gap-3">
                                {timeSlots.map(time => (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedTime(time)}
                                        className={`
                                            py-2 text-sm rounded-lg border transition-all
                                            ${selectedTime === time ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50 border-gray-200'}
                                        `}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">Note (Optional)</label>
                            <textarea
                                className="w-full border rounded-lg p-2 text-sm"
                                rows="2"
                                placeholder="Any specific details..."
                                value={note}
                                onChange={e => setNote(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleBooking}
                        disabled={!selectedTime}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        Confirm Booking
                    </button>
                </div>
            )}
        </div>
    );
};

export default UserAppointments;
