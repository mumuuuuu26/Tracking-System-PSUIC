import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar,
  Clock,
  ChevronRight,
  MoreHorizontal,
  CheckCircle,
  ChevronDown,
  Check,
} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  getMyTasks,
  getSchedule,
  acceptJob,
  rejectTicket,
} from "../../api/it";
import { getPersonalTasks } from "../../api/personalTask";
import { getITAvailability } from "../../api/appointment";
import CalendarGrid from "../../components/CalendarGrid";

const ITDashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [tickets, setTickets] = useState([]);
  const [scheduleItems, setScheduleItems] = useState([]); // Selected Date items
  const [monthlyEvents, setMonthlyEvents] = useState([]); // For calendar dots
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0,
  });
  const [, setLoading] = useState(true);
  const [showAllNew, setShowAllNew] = useState(false);

  // Modal States
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [isRejectDropdownOpen, setIsRejectDropdownOpen] = useState(false);

  // Load monthly events
  const loadMonthlyEvents = React.useCallback(async () => {
    try {
      const start = currentMonth.startOf('month').format('YYYY-MM-DD');
      const end = currentMonth.endOf('month').format('YYYY-MM-DD');
      const res = await getITAvailability(token, start, end);
      setMonthlyEvents(res.data);
    } catch (err) {
      console.error("Failed to load monthly events", err);
    }
  }, [token, currentMonth]);

  // Load daily schedule
  const loadDailySchedule = React.useCallback(async () => {
    try {
      const dateStr = selectedDate.format('YYYY-MM-DD');
      const [appointmentsRes, personalTasksRes] = await Promise.all([
        getSchedule(token, dateStr),
        getPersonalTasks(token, { date: dateStr })
      ]);

      const requestedAppts = tickets
        .filter(t => {
          // Check if ticket has a requested date in description
          const match = t.description?.match(/\[Requested Appointment: (\d{4}-\d{2}-\d{2}) at (\d{2}:\d{2})\]/);
          if (match) {
            const reqDate = match[1];
            return reqDate === dateStr && !t.appointment; // Match date and ensure no formal appointment yet
          }
          return false;
        })
        .map(t => {
          const match = t.description?.match(/\[Requested Appointment: (\d{4}-\d{2}-\d{2}) at (\d{2}:\d{2})\]/);
          const timeStr = match ? match[2] : "00:00";
          // Create a datetime object for sorting
          const dateTime = dayjs(`${dateStr}T${timeStr}`);

          return {
            type: 'request',
            time: dateTime,
            data: t,
            id: `req-${t.id}`
          };
        });

      const combinedSchedule = [
        ...(appointmentsRes.data || []).map(apt => ({
          type: 'appointment',
          time: dayjs(apt.scheduledAt),
          data: apt,
          id: `apt-${apt.id}`
        })),
        ...(personalTasksRes.data || []).map(task => ({
          type: 'personal',
          time: task.startTime ? dayjs(task.startTime) : dayjs(task.date).startOf('day'),
          data: task,
          id: `task-${task.id}`
        })),
        ...requestedAppts
      ].sort((a, b) => a.time.diff(b.time));

      setScheduleItems(combinedSchedule);

    } catch (err) {
      console.error(err);
    }
  }, [token, selectedDate, tickets]);

  const loadDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);

      const [ticketsRes] = await Promise.all([
        getMyTasks(token)
      ]);

      console.log('Dashboard Data Loaded:', { ticketsRes });

      await loadDailySchedule();
      await loadMonthlyEvents();

      // Ensure array
      const allTickets = Array.isArray(ticketsRes.data) ? ticketsRes.data : [];

      const pendingCount = allTickets.filter(t => t.status === "pending").length;
      const inProgressCount = allTickets.filter(t => ["in_progress", "scheduled"].includes(t.status)).length;
      const completedCount = allTickets.filter(t => ["fixed", "closed"].includes(t.status)).length;
      const rejectedCount = allTickets.filter(t => t.status === "rejected").length;

      setStats({
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
        rejected: rejectedCount
      });

      setTickets(allTickets);

    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [token, loadDailySchedule, loadMonthlyEvents]);

  // Load monthly events when month changes
  useEffect(() => {
    if (token) {
      loadMonthlyEvents();
    }
  }, [token, loadMonthlyEvents]);

  // Load specific date schedule when selectedDate changes
  useEffect(() => {
    if (token) {
      loadDailySchedule();
    }
  }, [token, loadDailySchedule]);

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token, loadDashboardData]);

  const handleAccept = async () => {
    try {
      await acceptJob(token, selectedTicket.id);
      toast.success("Ticket accepted successfully!");
      setShowAcceptModal(false);
      setSelectedTicket(null);
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept ticket");
    }
  };

  const handleReject = async () => {
    if (!rejectReason) {
      toast.error("Please select a reason");
      return;
    }

    try {
      await rejectTicket(token, selectedTicket.id, {
        reason: rejectReason,
        notes: rejectNote,
      });

      toast.success("Ticket rejected");
      setShowRejectModal(false);
      setRejectReason("");
      setRejectNote("");
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject ticket");
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "Critical": return "text-red-600 bg-red-50 border border-red-100";
      case "High": return "text-orange-600 bg-orange-50 border border-orange-100";
      case "Medium": return "text-yellow-600 bg-yellow-50 border border-yellow-100";
      default: return "text-green-600 bg-green-50 border border-green-100";
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "Critical": return "HIGH"; // Matching mockup style "HIGH"
      case "High": return "HIGH";
      case "Medium": return "MED";
      case "Low": return "LOW";
      default: return "NORM";
    }
  };

  const getCategoryColor = (categoryName) => {
    // Pink circle for Hardware (Projector etc), Yellow/Orange for Software?
    // Mockup shows: Pink circle for "Projector" (Hardware). Yellow circle for "Projector" (Hardware) too?
    // Wait, second card is Projector too but yellow icon.
    // Let's iterate colors based on id or name hash? Or check category.
    // Assuming Hardware = Pink, Software/Wifi = Blue, etc.
    // Let's stick to a simple mapping or random for now if category not explicit.
    if (categoryName === "Hardware") return "bg-pink-200 text-pink-600";
    if (categoryName === "Network") return "bg-blue-200 text-blue-600";
    if (categoryName === "Software") return "bg-purple-200 text-purple-600";
    return "bg-yellow-200 text-yellow-600";
  };

  // Filter "New Tickets" -> Pending status
  // Sort by Priority (Critical > High > Medium > Low) THEN by Arrival (Oldest First)
  const urgencyWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1, 'Normal': 0 };
  const newTickets = tickets
    .filter(t => t.status === "pending")
    .sort((a, b) => {
      const weightA = urgencyWeight[a.urgency] || 0;
      const weightB = urgencyWeight[b.urgency] || 0;
      if (weightA !== weightB) {
        return weightB - weightA; // Higher priority first
      }
      return new Date(a.createdAt) - new Date(b.createdAt); // Oldest first
    });



  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Blue Header Section */}
      {/* Blue Header Section */}
      <div className="bg-blue-600 pt-6 pb-24 px-6 rounded-b-[2.5rem] shadow-lg relative z-0">
      </div>

      {/* Floating Stats Card */}
      <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 flex justify-between items-center text-center">
          <StatItem count={stats.pending} label="Booking" />
          <StatItem count={stats.inProgress} label="In progress" />
          <StatItem count={stats.completed} label="Completed" />
          <StatItem count={stats.rejected} label="Reject" />
        </div>
      </div>

      {/* My Schedule Section */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-800">My Schedule</h3>
          <button onClick={() => navigate('/it/schedule')} className="text-blue-600 text-sm font-medium hover:underline">See all</button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Calendar Widget */}
          <div className="md:w-1/2">
            <CalendarGrid
              currentDate={currentMonth}
              setCurrentDate={setCurrentMonth}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              events={monthlyEvents}
              onDateSelect={(day) => setSelectedDate(day)}
            />
          </div>

          {/* List for Selected Day */}
          <div className="md:flex-1 space-y-4">
            <h4 className="text-gray-600 font-bold text-sm">Tasks for {selectedDate.format('DD MMM')}</h4>
            {scheduleItems.length > 0 ? (
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {scheduleItems.map((item) => {
                  if (item.type === 'appointment') {
                    const appt = item.data;
                    return (
                      <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-blue-50 text-blue-600">
                            <Calendar size={20} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{appt.ticket?.title}</h4>
                            <div className="flex items-center gap-2 text-gray-500 text-xs mt-0.5">
                              <Clock size={12} />
                              <span>{dayjs(appt.scheduledAt).format('HH:mm')}</span>
                            </div>
                            {appt.status === 'reschedule_requested' && (
                              <div className="mt-1 flex flex-col items-start gap-1">
                                <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  Reschedule Requested
                                </span>
                                {appt.newDate && (
                                  <span className="text-[10px] text-gray-400">
                                    Proposed: {dayjs(appt.newDate).format('D MMM, HH:mm')}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  } else if (item.type === 'request') {
                    const ticket = item.data;
                    return (
                      <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between border border-amber-100 ring-1 ring-amber-50 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/it/ticket/${ticket.id}`)}>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-amber-50 text-amber-600">
                            <Clock size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{ticket.title}</h4>
                              <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase">Request</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-500 text-xs mt-0.5">
                              <Calendar size={12} />
                              <span>{item.time.format('HH:mm')}</span>
                              <span className="text-gray-300">|</span>
                              <span>{ticket.room?.roomNumber || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    const task = item.data;
                    return (
                      <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5`} style={{ backgroundColor: task.color || '#193C6C' }}></div>
                        <div className="flex items-center gap-3 pl-2">
                          <div className="w-12 h-12 rounded-xl shrink-0 flex flex-col items-center justify-center bg-gray-50 text-gray-600">
                            {task.startTime ? (
                              <span className="text-xs font-bold">{dayjs(task.startTime).format('HH:mm')}</span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase">All Day</span>
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{task.title}</h4>
                            <p className="text-xs text-gray-500 line-clamp-1">{task.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-6 text-center shadow-sm h-full flex flex-col justify-center">
                <p className="text-gray-400 text-sm">No tasks for this day</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Tickets Section */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-800">New Tickets</h3>
          <button
            onClick={() => setShowAllNew(!showAllNew)}
            className="text-blue-600 text-sm font-medium hover:underline"
          >
            {showAllNew ? "Show Less" : "See all"}
          </button>
        </div>

        <div className="space-y-4">
          {newTickets.length > 0 ? newTickets.slice(0, showAllNew ? undefined : 5).map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${getCategoryColor(ticket.category?.name)}`}>
                    {/* Show First Letter or Icon */}
                    <span className="text-xl font-bold opacity-80">{ticket.category?.name?.[0] || 'T'}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">{ticket.title}</h4>
                    <p className="text-sm text-gray-500">
                      Floor {ticket.room?.floor} , Room {ticket.room?.roomNumber} - {ticket.category?.name}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${getUrgencyColor(ticket.urgency)}`}>
                  {getUrgencyBadge(ticket.urgency)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-400 mb-4 px-1">
                <span>{ticket.createdBy?.name || "Unknown User"}</span>
                <span>{dayjs(ticket.createdAt).fromNow(true)} ago</span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setShowAcceptModal(true);
                  }}
                  className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                >
                  Accept
                </button>
                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setShowRejectModal(true);
                  }}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <p className="text-gray-500">No new tickets</p>
            </div>
          )}
        </div>
      </div>



      {/* Modals are kept similar but unstyled or minimally styled for now */}
      {/* Accept Modal */}
      {showAcceptModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-2 text-center text-gray-800">Accept this ticket?</h3>
            <p className="text-gray-500 text-center mb-8 text-sm">
              Are you sure you want to accept this ticket now ?
            </p>
            <div className="space-y-3">
              <button onClick={handleAccept} className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:scale-[1.02] transition-transform">
                Accept Now
              </button>
              <button
                onClick={() => {
                  setShowAcceptModal(false);
                  navigate(`/it/ticket/${selectedTicket.id}/reschedule`);
                }}
                className="w-full bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-bold text-lg hover:bg-gray-200"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-gray-800">Reject Ticket</h3>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsRejectDropdownOpen(!isRejectDropdownOpen)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none flex justify-between items-center text-left"
                >
                  <span className={rejectReason ? "text-gray-900" : "text-gray-500"}>
                    {rejectReason || "Select a reason..."}
                  </span>
                  <ChevronDown size={20} className={`text-gray-400 transition-transform duration-200 ${isRejectDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {isRejectDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2 flex flex-col gap-1">
                      {["Out of scope", "Duplicate", "Information missing", "Other"].map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => {
                            setRejectReason(reason);
                            setIsRejectDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between group ${rejectReason === reason ? "bg-red-50 text-red-700 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                        >
                          <span>{reason}</span>
                          {rejectReason === reason && <Check size={16} className="text-red-500" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Note (Optional)</label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 focus:ring-2 focus:ring-red-500 focus:outline-none h-24 resize-none"
                placeholder="Add details..."
              />
            </div>

            <div className="space-y-3">
              <button onClick={handleReject} className="w-full bg-red-500 text-white py-3.5 rounded-2xl font-bold text-lg shadow-lg shadow-red-200 hover:bg-red-600">
                Confirm Reject
              </button>
              <button onClick={() => setShowRejectModal(false)} className="w-full bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-bold text-lg hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const StatItem = ({ count, label }) => (
  <div className="flex flex-col items-center gap-1 min-w-[60px]">
    <span className="text-2xl font-bold text-blue-900">{count}</span>
    <span className="text-xs text-blue-600/80 font-bold">{label}</span>
  </div>
);

export default ITDashboard;
