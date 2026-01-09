// client/src/pages/user/HomeUser.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  QrCode,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  ScanLine,
  Ticket,
  MessageSquare,
  Smile,
  Bell
} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { listMyTickets } from "../../api/ticket";

const HomeUser = () => {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    verify: 0,
    completed: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await listMyTickets(token);
      const tickets = res.data;

      // Status Logic matching the mockup reqs
      // Pending: status = 'pending'
      // In Progress: status = 'in_progress'
      // To Verify: status = 'fixed' AND NO rating
      // Completed: status = 'fixed' AND HAS rating (or just finished) -> Mockup says "เสร็จสิ้น"
      // Note: If 'rejected' exists, it's not explicitly in the 4 columns, maybe add to completed or ignore? 
      // For now, I'll count 'fixed' with rating as completed.

      const pending = tickets.filter((t) => t.status === "pending").length;
      const inProgress = tickets.filter((t) => t.status === "in_progress").length;
      const verify = tickets.filter((t) => t.status === "fixed" && !t.rating).length;
      const completed = tickets.filter((t) => t.status === "fixed").length; // All fixed tickets count as completed

      setStats({ pending, inProgress, verify, completed });
    } catch (err) {
      console.log(err);
    }
  };

  const services = [
    {
      icon: <ScanLine className="w-8 h-8" />,
      title: "Scan QR",
      color: "text-green-500",
      bg: "bg-green-50",
      action: () => navigate("/user/scan-qr"),
      isNew: true
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Create Ticket",
      color: "text-blue-500",
      bg: "bg-blue-50",
      action: () => navigate("/user/create-ticket"),
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Appointment",
      color: "text-purple-500",
      bg: "bg-purple-50",
      action: () => navigate("/user/appointments"),
    },
    {
      icon: <Ticket className="w-8 h-8" />,
      title: "All Tickets",
      color: "text-pink-500",
      bg: "bg-pink-50",
      action: () => navigate("/user/my-tickets"),
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Quick Fix",
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      action: () => navigate("/user/quick-fix"),
    },
    {
      icon: <Smile className="w-8 h-8" />,
      title: "Satisfaction",
      color: "text-yellow-500",
      bg: "bg-yellow-50",
      action: () => navigate("/user/feedback"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">

      {/* Blue Header Section */}
      <div className="bg-blue-600 pt-6 pb-24 px-6 rounded-b-[2.5rem] shadow-lg relative z-0">
        <div className="max-w-4xl mx-auto">
          {/* Top Row: Greeting & Bell */}
          <div className="flex justify-between items-start mb-6 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 text-xl font-bold overflow-hidden">
                {user?.picture ? (
                  <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  user?.name?.[0]?.toUpperCase() || "U"
                )}
              </div>
              <div>
                <p className="text-blue-100 text-sm">Welcome back,</p>
                <h1 className="text-xl font-bold leading-tight">{user?.email || "User"}</h1>
              </div>
            </div>
            <button className="relative p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <Bell size={24} />
              {/* Notification Badge Demo */}
              <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-600"></span>
            </button>
          </div>

          <h2 className="text-white text-lg font-bold mb-4 opacity-90">Ticket Status</h2>
        </div>
      </div>

      {/* Floating Stats Card - Overlapping the blue header */}
      <div className="max-w-4xl mx-auto px-6 -mt-16 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 flex justify-between items-center text-center">
          <StatItem count={stats.pending} label="Pending" color="text-blue-600" />
          <div className="w-px h-10 bg-gray-100"></div>
          <StatItem count={stats.inProgress} label="In Progress" color="text-blue-600" />
          <div className="w-px h-10 bg-gray-100"></div>
          <StatItem count={stats.verify} label="To Verify" color="text-blue-600" />
          <div className="w-px h-10 bg-gray-100"></div>
          <StatItem count={stats.completed} label="Completed" color="text-blue-600" />
        </div>
      </div>

      {/* Other Services Grid */}
      <div className="max-w-4xl mx-auto px-6 mt-8">
        <h3 className="font-bold text-gray-800 mb-6 text-lg">Other Services</h3>
        <div className="grid grid-cols-3 gap-y-8 gap-x-4">
          {services.map((service, index) => (
            <button
              key={index}
              onClick={service.action}
              className="flex flex-col items-center gap-3 group"
            >
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center ${service.bg} ${service.color} shadow-sm group-hover:scale-105 transition-transform duration-300 relative`}>
                {service.icon}
                {service.isNew && (
                  <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white">
                    New
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors">
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
  <div className="flex flex-col items-center gap-1 min-w-[60px]">
    <span className={`text-2xl font-bold ${color}`}>{count}</span>
    <span className="text-xs text-gray-500 font-medium">{label}</span>
  </div>
);

export default HomeUser;
