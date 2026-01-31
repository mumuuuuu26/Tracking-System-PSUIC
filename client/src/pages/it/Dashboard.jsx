import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,

} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  getMyTasks,
  acceptJob,
  rejectJob
} from "../../api/it";


const ITDashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [tickets, setTickets] = useState([]);

  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [, setLoading] = useState(true);
  const [showAllNew, setShowAllNew] = useState(false);

  // Modal States
  // Removed custom modal state for instant action or consistent behavior
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);



  const loadDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);

      const [ticketsRes] = await Promise.all([
        getMyTasks(token)
      ]);


      // Ensure array
      const allTickets = Array.isArray(ticketsRes.data) ? ticketsRes.data : [];

      const pendingCount = allTickets.filter(t => t.status === "not_start").length;
      const inProgressCount = allTickets.filter(t => ["in_progress"].includes(t.status)).length;
      const completedCount = allTickets.filter(t => ["completed"].includes(t.status)).length;


      setStats({
        pending: pendingCount,
        inProgress: inProgressCount,
        completed: completedCount,
      });

      setTickets(allTickets);

    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);



  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token, loadDashboardData]);

  const handleAccept = async (e, ticketId) => {
    e.stopPropagation();
    try {
      await acceptJob(token, ticketId);
      toast.success("Ticket accepted successfully!");
      navigate(`/it/ticket/${ticketId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept ticket");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.warning("Please provide a reason");
    try {
      await rejectJob(token, selectedTicket.id, rejectReason);
      toast.success("Ticket rejected successfully");
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedTicket(null);
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



  // Filter "New Tickets" -> Pending status
  // Sort by Priority (Critical > High > Medium > Low) THEN by Arrival (Oldest First)
  const urgencyWeight = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1, 'Normal': 0 };
  const newTickets = tickets
    .filter(t => t.status === "not_start")
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

                  <div className="pt-1">
                    <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1.5">{ticket.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      <span className="font-medium text-gray-700">Floor {ticket.room?.floor}</span>, Room {ticket.room?.roomNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider ${getUrgencyColor(ticket.urgency)}`}>
                    {getUrgencyBadge(ticket.urgency)}
                  </span>
                  <button
                    onClick={() => navigate(`/it/ticket/${ticket.id}`)}
                    className="flex items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors text-xs font-medium"
                  >
                    <Eye size={16} />
                    View
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-400 mb-5 px-1 mt-2">
                <span className="font-medium">{ticket.createdBy?.name || "Unknown User"}</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-gray-300 font-normal">{dayjs(ticket.createdAt).format("D MMM YYYY")}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{dayjs(ticket.createdAt).fromNow(true)} ago</span>
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={(e) => handleAccept(e, ticket.id)}
                  className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                >
                  Accept
                </button>
                <button
                  onClick={() => {
                    setSelectedTicket(ticket);
                    setShowRejectModal(true);
                  }}
                  className="flex-1 bg-red-50 text-red-600 font-semibold py-2.5 rounded-xl hover:bg-red-100 transition-colors"
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



      {/* Modals removed for instant action */}
      {/* Reject Modal */}
      {showRejectModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold mb-2 text-center text-gray-800">Reject Ticket?</h3>
            <p className="text-gray-500 text-center mb-4 text-sm">
              Please provide a reason for rejecting this ticket.
            </p>
            <textarea
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-100 outline-none mb-4"
              rows="3"
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            ></textarea>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition"
              >
                Reject
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
