import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ScanLine,
  CirclePlus,
  CalendarDays,
  BookOpen,
  Moon,
  Sun
} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { listMyTickets } from "../../api/ticket";
import UserWrapper from "../../components/user/UserWrapper";
import UserTicketCard from "../../components/user/UserTicketCard";
import useThemeStore from "../../store/themeStore";
import ProfileAvatar from "../../components/common/ProfileAvatar";
import { getUserDisplayName } from "../../utils/userIdentity";

const HomeUser = () => {
  const { user, checkUser } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const res = await listMyTickets();
      setTickets(res.data);
    } catch {
      // Silent fail — tickets will just be empty
    }
  }, []);

  useEffect(() => {
    checkUser();
    loadData();
  }, [checkUser, loadData]);

  const services = [
    {
      icon: <ScanLine className="w-6 h-6 text-blue-300" />,
      title: "Scan QR",
      action: () => navigate("/user/scan-qr"),
    },
    {
      icon: <CirclePlus className="w-6 h-6 text-blue-300" />,
      title: "Report Issue",
      action: () => navigate("/user/create-ticket"),
    },
    {
      icon: <CalendarDays className="w-6 h-6 text-blue-300" />,
      title: "IT Schedule",
      action: () => navigate("/user/it-schedule"),
    },
    {
      icon: <BookOpen className="w-6 h-6 text-blue-300" />,
      title: "Knowledge",
      action: () => navigate("/user/quick-fix"),
    },
  ];

  const filteredTickets = tickets.filter((t) => {
    const ticketDate = new Date(t.createdAt);
    const today = new Date();
    return (
      ticketDate.getDate() === today.getDate() &&
      ticketDate.getMonth() === today.getMonth() &&
      ticketDate.getFullYear() === today.getFullYear()
    );
  });

  const displayName = getUserDisplayName(user, "User");

  return (
    <UserWrapper>
      <div className="pb-24 bg-gray-50 dark:bg-[#0d1b2a] min-h-screen">

        {/* === Hero Header === */}
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 dark:from-[#0d1b2a] dark:via-[#193C6C] dark:to-[#0a2a4a] px-4 sm:px-6 pt-10 sm:pt-12 pb-20 md:rounded-b-3xl md:mx-0 overflow-hidden shadow-sm dark:shadow-none border-b border-transparent dark:border-white/10 lg:hidden">
          {/* Background decorative circles */}
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
                onClick={() => navigate("/user/profile")}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-white/30 dark:border-blue-400/30 bg-blue-800/30 dark:bg-blue-700/30 flex items-center justify-center cursor-pointer hover:border-white/60 dark:hover:border-blue-400/60 transition-colors shadow-lg"
              >
                <ProfileAvatar
                  user={user}
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

        {/* === Services Grid (pulled up to overlap header) === */}
        <div className="max-w-5xl mx-auto w-full px-6 -mt-10 relative z-10 lg:hidden">
          <div className="grid grid-cols-4 gap-3 md:gap-4 lg:hidden">
            {services.map((service, index) => (
              <button
                key={index}
                onClick={service.action}
                className="group flex flex-col items-center gap-2"
              >
                <div className="w-full aspect-square bg-white dark:bg-[#1a2f4e] border border-gray-100 dark:border-blue-700/40 rounded-2xl flex items-center justify-center shadow-md dark:shadow-lg transition-all duration-200 active:scale-95 group-hover:bg-blue-50 dark:group-hover:bg-[#1e3558]">
                  {service.icon}
                </div>
                <span className="text-[11px] font-medium text-gray-700 dark:text-blue-300/80 text-center leading-tight whitespace-nowrap">
                  {service.title}
                </span>
              </button>
            ))}
          </div>

          {/* === Desktop services === */}
          <div className="hidden lg:grid grid-cols-4 gap-4 mt-4">
            {services.map((service, index) => (
              <button
                key={index}
                onClick={service.action}
                className="group flex flex-col items-center gap-2"
              >
                <div className="w-full py-6 bg-white dark:bg-[#1a2f4e] border border-gray-100 dark:border-blue-700/40 rounded-2xl flex flex-col items-center justify-center shadow-md dark:shadow-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-[#1e3558] gap-3">
                  {service.icon}
                  <span className="text-sm font-semibold text-gray-700 dark:text-blue-300/80">{service.title}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* === Today's Tickets === */}
        <div className="max-w-5xl mx-auto w-full px-6 mt-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white tracking-tight">Today's Tickets</h2>
            <button
              onClick={() => navigate("/user/report")}
              className="text-sm font-medium text-[#1e2e4a] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              View All →
            </button>
          </div>

          {/* Ticket List */}
          <div className="grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-4">
            {filteredTickets.slice(0, 6).map((ticket) => (
              <UserTicketCard
                key={ticket.id}
                ticket={ticket}
                onClick={() => navigate(`/user/ticket/${ticket.id}`)}
              />
            ))}

            {filteredTickets.length === 0 && (
              <div className="col-span-full text-center py-20">
                <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center mx-auto mb-4 border border-blue-100 dark:border-blue-800/40 shadow-inner">
                  <CirclePlus size={28} className="text-blue-400 dark:text-blue-500" />
                </div>
                <p className="text-gray-500 dark:text-blue-300/60 text-sm font-medium">No tickets today</p>
                <p className="text-gray-400 dark:text-blue-400/40 text-xs mt-1">Tap "Report Issue" to create one</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </UserWrapper>
  );
};

export default HomeUser;
