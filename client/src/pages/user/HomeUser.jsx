// client/src/pages/user/HomeUser.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { listMyTickets } from "../../api/ticket";

const HomeUser = () => {
  const { user, token, checkUser } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      const res = await listMyTickets(token);
      const tickets = res.data;

      const pending = tickets.filter((t) => t.status === "not_start").length;
      const inProgress = tickets.filter(
        (t) => t.status === "in_progress"
      ).length;
      const completed = tickets.filter(
        (t) => t.status === "completed"
      ).length;

      setStats({ pending, inProgress, completed, allTickets: tickets });
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    checkUser(); // Sync user data on mount
    loadStats();
  }, [checkUser, loadStats]);

  const services = [
    {
      image: "/icons/qr-code.png",
      title: "Scan QR",
      bgColor: "bg-[#E6EEF8]",
      isNew: false,
      action: () => navigate("/user/scan-qr"),
    },
    {
      image: "/icons/create-ticket.png",
      title: "Create Ticket",
      bgColor: "bg-[#E6EEF8]",
      action: () => navigate("/user/create-ticket"),
    },
    {
      image: "/icons/file-3d.png",
      title: "All Tickets",
      bgColor: "bg-[#E6EEF8]",
      action: () => navigate("/user/my-tickets"),
    },
    {
      image: "/icons/quick-fix.png",
      title: "Quick Fix",
      bgColor: "bg-[#E6EEF8]",
      action: () => navigate("/user/quick-fix"),
    },
    {
      image: "/icons/satisfaction.png",
      title: "Satisfaction",
      bgColor: "bg-[#E6EEF8]",
      action: () => navigate("/user/feedback"),
    },
    {
      image: "/icons/schedule.png",
      title: "IT Schedule",
      bgColor: "bg-[#E6EEF8]",
      action: () => navigate("/user/it-schedule"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-8 font-sans text-gray-900 overflow-hidden">
      {/* Deep Blue Header Section - Compacted */}
      <div className="bg-[#193C6C] pt-6 pb-20 md:pt-8 md:pb-24 px-6 rounded-b-[2rem] md:rounded-b-[2.5rem] shadow-lg relative overflow-hidden transition-all duration-300">
        {/* ... header content ... */}
        {/* Decorative background circle */}
        <div className="absolute top-0 right-0 w-64 h-64 md:w-80 md:h-80 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

        <div className="w-full max-w-7xl mx-auto relative z-10 transition-all duration-300">
          {/* Top Row: Greeting & Menu - Compacted */}
          <div className="flex justify-between items-start mb-1 md:mb-2 text-white">
            <div>
              <p className="text-blue-200 text-xs md:text-sm font-light mb-0.5">
                {(() => {
                  const hour = new Date().getHours();
                  if (hour >= 5 && hour < 12) return "Good Morning";
                  if (hour >= 12 && hour < 18) return "Good Afternoon";
                  return "Good Evening";
                })()}
              </p>
              <h1 className="text-xl md:text-2xl font-bold leading-tight tracking-wide">
                {user?.username || user?.name?.split(' ')[0] || user?.email?.split('@')[0] || "User"}
              </h1>
            </div>
            {/* Buttons removed as requested */}
          </div>
        </div>
      </div>

      {/* Floating Stats Card - Compacted */}
      <div className="w-full max-w-7xl mx-auto px-6 -mt-14 md:-mt-16 relative z-20 transition-all duration-300">
        <div className="bg-white rounded-2xl md:rounded-[1.5rem] shadow-xl p-3 md:p-5 flex justify-between items-center text-center py-3 md:py-5 transform hover:scale-[1.01] transition-transform duration-300">
          <StatItem
            count={stats.pending}
            label="Not Start"
            color="text-gray-800"
          />
          <div className="w-px h-8 md:h-10 bg-gray-100"></div>
          <StatItem
            count={stats.inProgress}
            label="In progress"
            color="text-gray-800"
          />
          <div className="w-px h-8 md:h-10 bg-gray-100"></div>
          <StatItem
            count={stats.completed}
            label="Completed"
            color="text-gray-800"
          />
        </div>
      </div>

      {/* Other Services Grid - Compacted */}
      <div className="w-full max-w-7xl mx-auto px-6 mt-4 md:mt-6 transition-all duration-300">
        <h3 className="font-medium text-gray-800 mb-3 md:mb-4 text-sm md:text-lg">Other Services</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-y-4 gap-x-4 md:gap-6 justify-items-center">
          {services.map((service, index) => (
            <button
              key={index}
              onClick={service.action}
              className="flex flex-col items-center gap-2 group w-full"
            >
              <div
                className={`w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-[1.2rem] md:rounded-[1.5rem] flex items-center justify-center ${service.bgColor} shadow-sm group-hover:scale-105 transition-transform duration-300 relative`}
              >
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 object-contain drop-shadow-sm"
                />

                {service.isNew && (
                  <span className="absolute top-0 right-0 bg-green-500 text-white text-[8px] md:text-[9px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm transform translate-x-1 -translate-y-1">
                    New
                  </span>
                )}
              </div>
              <span className="text-[10px] md:text-xs lg:text-sm font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                {service.title}
              </span>
            </button>
          ))}
        </div>
      </div>



    </div>
  );
};

const StatItem = ({ count, label, color }) => (
  <div className="flex flex-col items-center gap-1 min-w-[30%]">
    <span className={`text-3xl md:text-4xl font-bold ${color}`}>{count}</span>
    <span className="text-sm md:text-base text-gray-800 font-medium">{label}</span>
  </div>
);

export default HomeUser;
