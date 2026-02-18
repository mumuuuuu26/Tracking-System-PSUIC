import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,

} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";

import {
  getMyTasks,
  acceptJob,
  rejectJob
} from "../../api/it";
import { currentUser } from "../../api/auth";
import { getImageUrl } from "../../utils/imageUrl";
import socket from "../../utils/socket";
import DashboardDesktop from "./DashboardDesktop";
import ITWrapper from "../../components/it/ITWrapper";




const ITDashboard = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const [tickets, setTickets] = useState([]);
  const [profile, setProfile] = useState(null);

  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [, setLoading] = useState(true);

  // Modal States
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);



  const loadDashboardData = React.useCallback(async () => {
    try {
      setLoading(true);

      const [ticketsRes, profileRes] = await Promise.all([
        getMyTasks(token),
        currentUser(token)
      ]);

      setProfile(profileRes.data);


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

  // Real-time updates
  // Real-time updates
  useEffect(() => {
    const handleNewTicket = (newTicket) => {
      console.log("Socket: New Ticket Received", newTicket);
      setTickets((prev) => [newTicket, ...prev]);
      setStats((prev) => ({
        ...prev,
        pending: prev.pending + 1,
      }));
    };

    const handleUpdateTicket = (updatedTicket) => {
      console.log("Socket: Ticket Updated", updatedTicket);
      setTickets((prev) => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    }

    socket.on("server:new-ticket", handleNewTicket);
    socket.on("server:update-ticket", handleUpdateTicket);

    return () => {
      socket.off("server:new-ticket", handleNewTicket);
      socket.off("server:update-ticket", handleUpdateTicket);
    };
  }, []);

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
      return new Date(a.createdAt) - new Date(b.createdAt); // Oldest first (FIFO)
    });



  // Handler for Reject Modal trigger
  const handleRejectClick = (ticket) => {
    setSelectedTicket(ticket);
    setShowRejectModal(true);
  };



  const displayName = profile?.name || (profile?.email ? profile.email.split('@')[0] : "IT Support");

  return (
    <>
      {/* Desktop View */}
      <div className="hidden md:block h-full">
        <DashboardDesktop
          tickets={tickets}
          stats={stats}
          profile={profile}
          onAccept={handleAccept}
          onReject={handleRejectClick}
          navigate={navigate}
        />
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        {/* 1. New Header Section (Welcome back) - Matching User Side */}
        <div className="bg-[#193C6C] pt-8 pb-8 rounded-b-[2.5rem] shadow-md relative z-0 -mx-4 md:-mx-8 -mt-6">
          <div className="flex items-center justify-between text-white px-6">
            <div className="flex flex-col">
              <span className="text-base font-medium opacity-90">Welcome back,</span>
              <span className="text-2xl font-bold mt-1 tracking-tight">{displayName}</span>
            </div>
            {/* Profile Picture */}
            <div
              onClick={() => navigate("/it/profile")}
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 bg-white/10 flex items-center justify-center cursor-pointer hover:border-white transition-colors"
            >
              {profile?.picture ? (
                <img src={getImageUrl(profile.picture)} alt="Profile" className="w-full h-full object-cover" onError={(e) => { e.target.src = '/default-profile.png'; }} />
              ) : (
                <span className="text-lg font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 relative z-10 text-gray-900">
          <div className="flex flex-col gap-6">
            {/* Floating Stats Card */}
            <div className="w-full">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex justify-between items-center text-center">
                <StatItem count={stats.pending} label="Booking" />
                <StatItem count={stats.inProgress} label="In progress" />
                <StatItem count={stats.completed} label="Completed" />
              </div>
            </div>

            {/* New Tickets Section */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">New Tickets</h2>
                <button
                  onClick={() => navigate("/it/tickets")}
                  className="text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                  style={{ fontSize: '12px' }}
                >
                  View All
                </button>
              </div>

              <div className="space-y-4">
                {newTickets.length > 0 ? newTickets.slice(0, 3).map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(`/it/ticket/${ticket.id}`)}
                    className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative group cursor-pointer hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xl font-bold text-[#193C6C] group-hover:text-blue-800 transition-colors flex-1 pr-2 break-words">
                        {ticket.category?.name || "General"}
                      </h4>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${ticket.status === 'completed' ? 'border-green-500 text-green-600 bg-green-50' :
                          ticket.status === 'in_progress' ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
                            'border-red-500 text-red-600 bg-red-50'
                          }`}>
                          {ticket.status === 'not_start' ? 'Not Started' :
                            ticket.status === 'in_progress' ? 'In Progress' : 'Completed'}
                        </div>
                      </div>
                    </div>


                    {/* Content */}
                    <div className="flex flex-col gap-1 mb-6">
                      <p className="text-base text-gray-800 font-bold break-words line-clamp-2">
                        {ticket.description || "No description provided"}
                      </p>
                      <p className="text-sm text-gray-500">
                        Floor {ticket.room?.floor || "-"} , {ticket.room?.roomNumber || "-"}
                      </p>
                    </div>

                    {/* Footer Separator */}
                    <div className="h-px w-full bg-gray-100 mb-4"></div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                        <span>{new Date(ticket.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", ".")} PM</span>
                        <span className="w-px h-3 bg-gray-300"></span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-500">
                        {ticket.createdBy?.name || ticket.createdBy?.username || ticket.createdBy?.email || "Unknown User"}
                      </span>
                    </div>

                    <div className="flex gap-3 relative z-20">
                      <button
                        onClick={(e) => handleAccept(e, ticket.id)}
                        className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectClick(ticket);
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
          </div>
        </div>
      </div>

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
    </>
  );
};

const StatItem = ({ count, label }) => (
  <div className="flex flex-col items-center gap-1 min-w-[60px]">
    <span className="text-2xl font-bold text-blue-900">{count}</span>
    <span className="text-xs text-blue-600/80 font-bold">{label}</span>
  </div>
);

export default ITDashboard;
