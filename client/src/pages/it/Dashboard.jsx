import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Moon,
  Sun,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  getMyTasks,
  acceptJob,
  rejectJob
} from "../../api/it";
import { currentUser } from "../../api/auth";
import socket from "../../utils/socket";
import DashboardDesktop from "./DashboardDesktop";
import ITWrapper from "../../components/it/ITWrapper";
import ProfileAvatar from "../../components/common/ProfileAvatar";
import { getUserDisplayName } from "../../utils/userIdentity";
import useThemeStore from "../../store/themeStore";




const ITDashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeStore();

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
        getMyTasks(),
        currentUser()
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

    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);



  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Real-time updates
  useEffect(() => {
    const handleNewTicket = (newTicket) => {
      setTickets((prev) => [newTicket, ...prev]);
      setStats((prev) => ({
        ...prev,
        pending: prev.pending + 1,
      }));
    };

    const handleUpdateTicket = (updatedTicket) => {
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
      await acceptJob(ticketId);
      toast.success("Ticket accepted successfully!");
      navigate(`/it/ticket/${ticketId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept ticket");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.warning("Please provide a reason");
    try {
      await rejectJob(selectedTicket.id, rejectReason);
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
  const urgencyWeight = { 'High': 3, 'Medium': 2, 'Low': 1 };
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



  const displayName = getUserDisplayName(profile, "IT Support");

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
        {/* Hero Header — matching HomeUser.jsx pattern */}
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 dark:from-[#0d1b2a] dark:via-[#193C6C] dark:to-[#0a2a4a] px-4 sm:px-6 pt-10 sm:pt-12 pb-20 rounded-b-3xl overflow-hidden shadow-sm dark:shadow-none border-b border-transparent dark:border-white/10 -mx-4 -mt-6">
          {/* Background decorative circles */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-blue-300/10 dark:bg-blue-400/5 blur-xl pointer-events-none"></div>

          <div className="max-w-5xl mx-auto grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 relative z-10">
            <div className="min-w-0 flex flex-col">
              <span className="text-blue-100 dark:text-blue-300/80 text-xs sm:text-sm font-medium">Welcome back,</span>
              <span
                className="text-white text-[1.15rem] sm:text-[1.85rem] font-bold mt-0.5 tracking-tight leading-tight break-all sm:break-words"
                title={displayName}
              >
                {displayName}
              </span>
              <span className="text-blue-200 dark:text-blue-300/60 text-[11px] sm:text-xs mt-1">IT Helpdesk Ticketing System</span>
            </div>
            {/* Top Right Action Area */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 dark:bg-black/20 flex items-center justify-center text-white border border-white/20 hover:bg-white/20 dark:hover:bg-white/10 transition-all hover:scale-105 active:scale-95 shadow-sm"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? <Sun size={16} className="text-blue-100" /> : <Moon size={16} className="text-blue-100" />}
              </button>

              {/* Profile Avatar */}
              <div
                onClick={() => navigate("/it/profile")}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/30 dark:border-blue-400/30 bg-blue-800/30 dark:bg-blue-700/30 flex items-center justify-center cursor-pointer hover:border-white/60 dark:hover:border-blue-400/60 transition-colors shadow-lg"
              >
                <ProfileAvatar
                  user={profile}
                  alt="Profile"
                  className="w-full h-full"
                  imageClassName="w-full h-full object-cover"
                  fallbackClassName="w-full h-full flex items-center justify-center bg-blue-800/30 dark:bg-blue-700/30 text-white"
                  initialsClassName="text-base sm:text-lg font-extrabold text-white"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 -mt-10 relative z-10 text-gray-900 dark:text-white px-4">
          <div className="flex flex-col gap-6">
            {/* Floating Stats Card */}
            <div className="w-full">
              <div className="bg-white dark:bg-[#1a2f4e] rounded-3xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-blue-800/30 p-6 flex justify-between items-center text-center">
                <StatItem count={stats.pending} label="Booking" />
                <StatItem count={stats.inProgress} label="In progress" />
                <StatItem count={stats.completed} label="Completed" />
              </div>
            </div>

            {/* New Tickets Section */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Tickets</h2>
                <button
                  onClick={() => navigate("/it/tickets")}
                  className="text-sm font-medium text-[#1e2e4a] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                >
                  View All →
                </button>
              </div>

              <div className="space-y-4">
                {newTickets.length > 0 ? newTickets.slice(0, 3).map((ticket) => (
                  <div
                    key={ticket.id}
                    onClick={() => navigate(`/it/ticket/${ticket.id}`)}
                    className="bg-white dark:bg-[#1a2f4e] rounded-2xl p-5 shadow-sm dark:shadow-lg border border-gray-100 dark:border-blue-800/30 relative group cursor-pointer hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xl font-bold text-[#193C6C] dark:text-white group-hover:text-blue-800 dark:group-hover:text-blue-300 transition-colors flex-1 pr-2 break-words">
                        {ticket.category?.name || "General"}
                      </h4>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className={`px-3 py-1 rounded-lg text-[10px] font-bold border ${ticket.status === 'completed' ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700/50' :
                          ticket.status === 'in_progress' ? 'border-yellow-500 text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-700/50' :
                            'border-red-500 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700/50'
                          }`}>
                          {ticket.status === 'not_start' ? 'Not Started' :
                            ticket.status === 'in_progress' ? 'In Progress' : 'Completed'}
                        </div>
                      </div>
                    </div>


                    {/* Content */}
                    <div className="flex flex-col gap-1 mb-6">
                      <p className="text-base text-gray-800 dark:text-gray-200 font-bold break-words line-clamp-2">
                        {ticket.description || "No description provided"}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-blue-300/60">
                        Floor {ticket.room?.floor || "-"} , {ticket.room?.roomNumber || "-"}
                      </p>
                    </div>

                    {/* Footer Separator */}
                    <div className="h-px w-full bg-gray-100 dark:bg-blue-800/40 mb-4"></div>

                    {/* Footer Info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3 text-xs font-medium text-gray-500 dark:text-blue-300/60">
                        <span>{new Date(ticket.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", ".")} PM</span>
                        <span className="w-px h-3 bg-gray-300 dark:bg-blue-700/60"></span>
                        <span>{new Date(ticket.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-500 dark:text-blue-300/70">
                        {ticket.createdBy?.name || ticket.createdBy?.username || ticket.createdBy?.email || "Unknown User"}
                      </span>
                    </div>

                    <div className="flex gap-3 relative z-20">
                      <button
                        onClick={(e) => handleAccept(e, ticket.id)}
                        className="flex-1 bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 dark:shadow-blue-900/30"
                      >
                        Accept
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRejectClick(ticket);
                        }}
                        className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold py-2.5 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="bg-white dark:bg-[#1a2f4e] rounded-2xl p-8 text-center shadow-sm dark:shadow-lg border border-gray-100 dark:border-blue-800/30">
                    <p className="text-gray-500 dark:text-blue-300/60">No new tickets</p>
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
          <div className="bg-white dark:bg-[#1a2f4e] rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-blue-800/30">
            <h3 className="text-xl font-bold mb-2 text-center text-gray-800 dark:text-white">Reject Ticket?</h3>
            <p className="text-gray-500 dark:text-blue-300/70 text-center mb-4 text-sm">
              Please provide a reason for rejecting this ticket.
            </p>
            <textarea
              className="w-full bg-gray-50 dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 rounded-xl p-3 text-sm focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 outline-none mb-4 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-blue-400/40"
              rows="3"
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            ></textarea>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-white/20 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/30 transition"
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
    <span className="text-2xl font-bold text-blue-900 dark:text-white">{count}</span>
    <span className="text-xs text-blue-600/80 dark:text-blue-300/70 font-bold">{label}</span>
  </div>
);

export default ITDashboard;
