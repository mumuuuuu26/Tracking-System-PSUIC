import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
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
    todayComplete: 0,
    todayTotal: 0,
    urgent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    if (token) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [token]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [ticketsRes, appointmentsRes, statsRes] = await Promise.all([
        getMyTasks(token),
        getTodayAppointments(token),
        getStats(token),
      ]);

      setTickets(ticketsRes.data);
      setAppointments(appointmentsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard:", err);
      // toast.error('Failed to load dashboard data')
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

  const handleReschedule = (ticketId) => {
    navigate(`/it/reschedule/${ticketId}`);
  };

  const getFilteredTickets = () => {
    switch (selectedFilter) {
      case "Accept":
        return tickets.filter((t) => ["in_progress", "scheduled"].includes(t.status));
      case "Reject":
        return tickets.filter((t) => t.status === "rejected"); // Or pending logic if used for actions
      default:
        return tickets;
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case "Critical":
        return "bg-red-100 text-red-600";
      case "High":
        return "bg-orange-100 text-orange-600";
      case "Medium":
        return "bg-yellow-100 text-yellow-600";
      default:
        return "bg-green-100 text-green-600";
    }
  };

  const urgencyWeight = {
    Critical: 3,
    High: 2,
    Medium: 1,
    Low: 0,
  };

  const getFilteredAndSortedTickets = () => {
    let filtered = [];
    switch (selectedFilter) {
      case "Accept":
        filtered = tickets.filter((t) => ["in_progress", "scheduled"].includes(t.status));
        break;
      case "Reject":
        filtered = tickets.filter((t) => t.status === "rejected");
        break;
      default: // "All" -> Pending
        filtered = tickets.filter((t) => t.status === "pending");
    }

    return filtered.sort((a, b) => {
      // 1. Urgency (Highest first)
      const weightA = urgencyWeight[a.urgency] || 0;
      const weightB = urgencyWeight[b.urgency] || 0;
      if (weightA !== weightB) {
        return weightB - weightA;
      }
      // 2. CreatedAt (Oldest first / First come first served)
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  };

  const completionPercentage =
    stats.todayTotal > 0
      ? Math.round((stats.todayComplete / stats.todayTotal) * 100)
      : 0;

  if (loading && !stats.todayTotal) {
    // Only show loader on initial load if no data
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full overflow-hidden">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    👨‍🔧
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Hello!</p>
                <h1 className="text-xl font-bold">
                  {user?.name || "IT Support"}
                </h1>
              </div>
            </div>
            <button
              onClick={() => navigate("/it/notifications")}
              className="relative p-2"
            >
              <Bell size={24} />
              {tickets.filter((t) => !t.readAt && t.assignedToId === user.id)
                .length > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
            </button>
          </div>

          {/* Progress Card */}
          <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-2xl p-4 text-white">
            <h3 className="text-sm opacity-90 mb-1">Your today's tickets</h3>
            <p className="text-lg font-semibold mb-3">
              {stats.todayComplete}/{stats.todayTotal || 0} completed
            </p>

            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate("/it/tickets")}
                className="bg-white text-blue-500 px-4 py-2 rounded-lg text-sm font-semibold"
              >
                View Tickets
              </button>

              {/* Circular Progress */}
              <div className="relative w-20 h-20">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                    opacity="0.3"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="30"
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(2 * Math.PI * 30 * completionPercentage) / 100
                      } ${2 * Math.PI * 30}`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                  {completionPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 mt-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-red-50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <AlertTriangle className="text-red-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.urgent}</p>
            <p className="text-xs text-gray-600">Urgent</p>
          </div>

          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-orange-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <Clock className="text-orange-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
            <p className="text-xs text-gray-600">Pending</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <CheckCircle className="text-blue-500" size={20} />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {stats.inProgress}
            </p>
            <p className="text-xs text-gray-600">In Progress</p>
          </div>
        </div>
      </div>

      {/* New Tickets Section */}
      <div className="px-4 mt-6">
        <h3 className="font-bold text-lg mb-3">Task List</h3>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {["All", "Accept", "Reject"].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium text-sm ${selectedFilter === filter
                ? "bg-blue-500 text-white"
                : "bg-gray-100 text-gray-600"
                }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Tickets List */}
        <div className="space-y-3">
          {getFilteredAndSortedTickets().map((ticket) => (
            <div key={ticket.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${ticket.category?.name === "Hardware"
                      ? "bg-pink-100"
                      : "bg-yellow-100"
                      }`}
                  >
                    {ticket.category?.name === "Hardware" ? "🖥️" : "📱"}
                  </div>
                  <div>
                    <h4 className="font-semibold">
                      {ticket.equipment?.name || ticket.title}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Floor {ticket.room?.floor}, Room {ticket.room?.roomNumber}{" "}
                      - {ticket.category?.name}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${getUrgencyColor(
                    ticket.urgency
                  )}`}
                >
                  {ticket.urgency.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-500">
                  {ticket.createdBy?.name || ticket.createdBy?.username || "Unknown"}
                </p>
                <p className="text-gray-400">
                  {dayjs(ticket.createdAt).fromNow()}
                </p>
              </div>

              {selectedFilter !== "Reject" && ticket.status === "pending" && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowAcceptModal(true);
                    }}
                    className="flex-1 bg-blue-500 text-white py-2 rounded-lg font-medium hover:bg-blue-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowRejectModal(true);
                    }}
                    className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-200"
                  >
                    Reject
                  </button>
                </div>
              )}

              {ticket.status === "rejected" && (
                <div className="mt-3 p-2 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">
                    Rejected: {ticket.rejectedReason}
                  </p>
                </div>
              )}
            </div>
          ))}



          {getFilteredAndSortedTickets().length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No tickets found</p>
            </div>
          )}
        </div>
      </div>



      {/* Accept Modal */}
      {
        showAcceptModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
              <h3 className="text-lg font-bold mb-2 text-center">
                Accept this ticket?
              </h3>
              <p className="text-gray-500 text-center mb-6">
                Are you sure you want to accept this ticket now?
              </p>

              <button
                onClick={handleAccept}
                className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold mb-3 hover:bg-blue-600"
              >
                Accept Now
              </button>

              <button
                onClick={() => {
                  setShowAcceptModal(false);
                  handleReschedule(selectedTicket.id);
                }}
                className="w-full text-gray-600 py-3 font-medium hover:bg-gray-50"
              >
                Reschedule
              </button>
              <button
                onClick={() => {
                  setShowAcceptModal(false);
                }}
                className="w-full text-red-500 py-1 font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )
      }

      {/* Reject Modal */}
      {
        showRejectModal && selectedTicket && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-bold mb-4">Reject Ticket</h3>

              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <p className="font-semibold">
                  {selectedTicket.equipment?.name || selectedTicket.title}
                </p>
                <p className="text-sm text-gray-600">
                  Floor {selectedTicket.room?.floor}, Room{" "}
                  {selectedTicket.room?.roomNumber}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Req: {selectedTicket.createdBy?.name || selectedTicket.createdBy?.username || "Unknown"}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Reason for rejection
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="">Select reason...</option>
                  <option value="Not IT related">Not IT related</option>
                  <option value="Insufficient information">
                    Insufficient information
                  </option>
                  <option value="Duplicate ticket">Duplicate ticket</option>
                  <option value="Equipment not found">Equipment not found</option>
                  <option value="User should try quick fix first">
                    User should try quick fix first
                  </option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  rows="3"
                  placeholder="Please provide details to help the user understand why this request is being rejected..."
                />
              </div>

              <button
                onClick={handleReject}
                className="w-full bg-red-500 text-white py-3 rounded-xl font-semibold mb-3 hover:bg-red-600"
              >
                Confirm Rejection
              </button>

              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason("");
                  setRejectNote("");
                }}
                className="w-full text-gray-600 py-3 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default ITDashboard;
