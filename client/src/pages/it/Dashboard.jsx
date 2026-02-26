import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Moon, Sun, CirclePlus } from "lucide-react";
import { toast } from "react-toastify";

import { getMyTasks, acceptJob, rejectJob } from "../../api/it";
import { currentUser } from "../../api/auth";
import { getAllTickets } from "../../api/ticket";
import socket from "../../utils/socket";
import DashboardDesktop from "./DashboardDesktop";
import ProfileAvatar from "../../components/common/ProfileAvatar";
import { getUserDisplayName } from "../../utils/userIdentity";
import { normalizeTicketStatus, toTicketStatusLabel } from "../../utils/ticketStatus";
import useThemeStore from "../../store/themeStore";
import { promptRejectReason } from "../../utils/sweetalert";

const ITDashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const [tickets, setTickets] = useState([]);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    notStart: 0,
    inProgress: 0,
    completed: 0,
    rejected: 0,
  });
  const [, setLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [ticketsRes, profileRes, notStartRes, inProgressRes, completedRes, rejectedRes] = await Promise.all([
        getMyTasks(),
        currentUser(),
        getAllTickets({ page: 1, limit: 1, status: "not_start" }),
        getAllTickets({ page: 1, limit: 1, status: "in_progress" }),
        getAllTickets({ page: 1, limit: 1, status: "completed" }),
        getAllTickets({ page: 1, limit: 1, status: "rejected" }),
      ]);

      setProfile(profileRes.data);

      setTickets(Array.isArray(ticketsRes.data) ? ticketsRes.data : []);
      setStats({
        notStart: Number(notStartRes?.data?.total || 0),
        inProgress: Number(inProgressRes?.data?.total || 0),
        completed: Number(completedRes?.data?.total || 0),
        rejected: Number(rejectedRes?.data?.total || 0),
      });
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const handleTicketChange = () => {
      loadDashboardData();
    };

    socket.on("server:new-ticket", handleTicketChange);
    socket.on("server:update-ticket", handleTicketChange);

    return () => {
      socket.off("server:new-ticket", handleTicketChange);
      socket.off("server:update-ticket", handleTicketChange);
    };
  }, [loadDashboardData]);

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

  const handleReject = async (ticketId, rejectReason) => {
    try {
      await rejectJob(ticketId, rejectReason);
      toast.success("Ticket rejected successfully");
      loadDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject ticket");
    }
  };

  const handleRejectClick = async (ticket) => {
    const reason = await promptRejectReason({
      title: "Reject Ticket?",
      text: "Please provide rejection reason.",
      placeholder: "Reason for rejection...",
      confirmButtonText: "Reject",
    });
    if (!reason) return;

    await handleReject(ticket.id, reason);
  };

  const urgencyWeight = { High: 3, Medium: 2, Low: 1 };

  const newTickets = tickets
    .filter((ticket) => normalizeTicketStatus(ticket.status) === "not_start")
    .sort((a, b) => {
      const weightA = urgencyWeight[a.urgency] || 0;
      const weightB = urgencyWeight[b.urgency] || 0;
      if (weightA !== weightB) {
        return weightB - weightA;
      }
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

  const services = [
    {
      title: "Not Start",
      value: stats.notStart,
      action: () => navigate("/it/tickets?status=not_start"),
    },
    {
      title: "In Progress",
      value: stats.inProgress,
      action: () => navigate("/it/tickets?status=in_progress"),
    },
    {
      title: "Completed",
      value: stats.completed,
      action: () => navigate("/it/tickets?status=completed"),
    },
    {
      title: "Rejected",
      value: stats.rejected,
      action: () => navigate("/it/tickets?status=rejected"),
    },
  ];

  const displayName = getUserDisplayName(profile, "IT Support");

  return (
    <>
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

      <div className="md:hidden pb-24 bg-gray-50 dark:bg-[#0d1b2a] min-h-screen">
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 dark:from-[#0d1b2a] dark:via-[#193C6C] dark:to-[#0a2a4a] px-4 sm:px-6 pt-10 sm:pt-12 pb-20 rounded-b-3xl overflow-hidden shadow-sm dark:shadow-none border-b border-transparent dark:border-white/10 -mx-4 -mt-6">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-blue-400/20 dark:bg-blue-500/10 blur-2xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 w-32 h-32 rounded-full bg-blue-300/10 dark:bg-blue-400/5 blur-xl pointer-events-none"></div>

          <div className="max-w-5xl mx-auto grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 sm:gap-4 relative z-10">
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
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 dark:bg-black/20 flex items-center justify-center text-white border border-white/20 hover:bg-white/20 dark:hover:bg-white/10 transition-all hover:scale-105 active:scale-95 shadow-sm"
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDarkMode ? (
                  <Sun size={16} className="text-blue-100" />
                ) : (
                  <Moon size={16} className="text-blue-100" />
                )}
              </button>

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

        <div className="max-w-5xl mx-auto w-full px-6 -mt-10 relative z-10 lg:hidden">
          <div className="grid grid-cols-4 gap-3 md:gap-4">
            {services.map((service, index) => (
              <button
                key={index}
                onClick={service.action}
                className="group flex flex-col items-center"
              >
                <div className="w-full aspect-square bg-white dark:bg-[#1a2f4e] border border-gray-100 dark:border-blue-700/40 rounded-2xl flex items-center justify-center shadow-md dark:shadow-lg transition-all duration-200 active:scale-95 group-hover:bg-blue-50 dark:group-hover:bg-[#1e3558] p-2">
                  <span className="text-[1.6rem] leading-none font-normal text-[#1e2e4a] dark:text-white">
                    {service.value}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-gray-700 dark:text-blue-300/80 text-center leading-tight mt-2 whitespace-nowrap">
                  {service.title}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto w-full px-6 mt-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white tracking-tight">New Tickets</h2>
            <button
              onClick={() => navigate("/it/tickets")}
              className="text-sm font-medium text-[#1e2e4a] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              View All →
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
            {newTickets.slice(0, 5).map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/it/ticket/${ticket.id}`)}
                className="w-full bg-white dark:bg-[#1a2f4e] rounded-2xl p-4 shadow-sm dark:shadow-lg border border-gray-100 dark:border-blue-800/30 hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-base font-semibold text-[#193C6C] dark:text-white truncate">
                    {ticket.category?.name || "General"}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800/40 whitespace-nowrap">
                    {toTicketStatusLabel(ticket.status)}
                  </span>
                </div>

                <p className="text-sm text-gray-700 dark:text-blue-200 line-clamp-2 mb-2">
                  {ticket.description || "No description provided"}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-blue-300/60">
                  <span>
                    Floor {ticket.room?.floor || "-"} , {ticket.room?.roomNumber || "-"}
                  </span>
                  <span className="font-medium truncate ml-2">
                    {getUserDisplayName(ticket.createdBy, ticket.createdById ? `User #${ticket.createdById}` : "User")}
                  </span>
                </div>

                {normalizeTicketStatus(ticket.status) === "not_start" && (
                  <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleAccept(e, ticket.id)}
                      className="flex-1 bg-blue-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectClick(ticket)}
                      className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-semibold py-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}

            {newTickets.length === 0 && (
              <div className="col-span-full text-center py-20">
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-800/40 shadow-inner">
                  <CirclePlus size={28} className="text-blue-400 dark:text-blue-500" />
                </div>
                <p className="text-gray-500 dark:text-blue-300/60 text-sm font-medium">No new tickets</p>
                <p className="text-gray-400 dark:text-blue-400/40 text-xs mt-1">Incoming queue is clear</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  );
};

export default ITDashboard;
