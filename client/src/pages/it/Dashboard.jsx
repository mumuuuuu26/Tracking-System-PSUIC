import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar,
  Clock,
  ChevronRight,
  MoreHorizontal,
  CheckCircle,
} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  getStats,
  getMyTasks,
  getTodayAppointments,
  acceptJob,
  rejectTicket,
} from "../../api/it";
import Swal from "sweetalert2";

dayjs.extend(relativeTime);

const ITDashboard = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  const [tickets, setTickets] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [ticketsRes, appointmentsRes] = await Promise.all([
        getMyTasks(token),
        getTodayAppointments(token),
      ]);

      const allTickets = ticketsRes.data;

      // Calculate stats manually from tickets if needed, or use separate API if consistent
      // The mockup has 4 specific stat blocks: Booking, In progress, Completed, Reject
      // Booking = pending
      // In progress = in_progress + scheduled
      // Completed = fixed + closed
      // Reject = rejected

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
      setAppointments(appointmentsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

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
  const newTickets = tickets.filter(t => t.status === "pending").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Filter "Completed Tickets" -> Fixed status
  const completedTickets = tickets.filter(t => t.status === "fixed").sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

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

        {appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.slice(0, 2).map((appt) => (
              <div key={appt.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    {/* Placeholder or Equipment Image */}
                    <img
                      src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop"
                      alt="Tech"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{appt.ticket?.title || "Ticket #" + appt.ticketId}</h4>
                    <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                      <Calendar size={14} />
                      <span>{dayjs(appt.start).format('DD MMM YY')}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="text-gray-400" />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="text-gray-500 text-sm">No upcoming appointments</p>
          </div>
        )}
      </div>

      {/* New Tickets Section */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-800">New Tickets</h3>
          <button onClick={() => navigate('/it/tickets')} className="text-blue-600 text-sm font-medium hover:underline">See all</button>
        </div>

        <div className="space-y-4">
          {newTickets.length > 0 ? newTickets.map((ticket) => (
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

      {/* Completed Tickets Section */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-800">Completed Tickets</h3>
          <button onClick={() => navigate('/it/tickets')} className="text-blue-600 text-sm font-medium hover:underline">See all</button>
        </div>

        <div className="space-y-4">
          {completedTickets.length > 0 ? completedTickets.slice(0, 5).map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 opacity-80 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => navigate(`/it/ticket/${ticket.id}`)}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-green-100 text-green-600">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">{ticket.title || ticket.description?.substring(0, 30)}</h4>
                    <p className="text-sm text-gray-500">
                      Floor {ticket.room?.floor} , Room {ticket.room?.roomNumber}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded text-[10px] font-bold tracking-wider bg-green-100 text-green-600">
                  DONE
                </span>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-400 pl-[4rem]">
                <span>Fixed by me</span>
                <span>{dayjs(ticket.updatedAt).fromNow()}</span>
              </div>
            </div>
          )) : (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <p className="text-gray-400 text-sm">No completed tickets yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals are kept similar but unstyled or minimally styled for now */}
      {/* Accept Modal */}
      {showAcceptModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-2 text-center text-gray-800">Accept Ticket</h3>
            <p className="text-gray-500 text-center mb-8 text-sm">
              Do you want to accept <strong>{selectedTicket.title}</strong>?
            </p>
            <div className="space-y-3">
              <button onClick={handleAccept} className="w-full bg-blue-600 text-white py-3.5 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:scale-[1.02] transition-transform">
                Accept
              </button>
              <button onClick={() => setShowAcceptModal(false)} className="w-full bg-gray-100 text-gray-600 py-3.5 rounded-2xl font-bold text-lg hover:bg-gray-200">
                Cancel
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
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="">Select a reason...</option>
                <option value="Out of scope">Out of scope</option>
                <option value="Duplicate">Duplicate</option>
                <option value="Information missing">Information missing</option>
                <option value="Other">Other</option>
              </select>
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
