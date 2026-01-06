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
  LogOut,
} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { listMyTickets } from "../../api/ticket";

const HomeUser = () => {
  const { user, token, actionLogout } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await listMyTickets(token);
      const tickets = res.data;

      setStats({
        total: tickets.length,
        pending: tickets.filter((t) => t.status === "pending").length,
        inProgress: tickets.filter((t) => t.status === "in_progress").length,
        completed: tickets.filter((t) => t.status === "fixed").length,
      });
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = () => {
    actionLogout();
    navigate("/login");
  };

  const services = [
    {
      icon: <QrCode className="w-8 h-8" />,
      title: "Scan QR",
      desc: "Scan to view history",
      bg: "bg-gradient-to-br from-green-100 to-green-50",
      iconColor: "text-green-600",
      action: () => navigate("/user/scan-qr"),
      badge: "New",
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Create Ticket",
      desc: "Report a new issue",
      bg: "bg-gradient-to-br from-blue-100 to-blue-50",
      iconColor: "text-blue-600",
      action: () => navigate("/user/create-ticket"),
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Appointment",
      desc: "Schedule a technician",
      bg: "bg-gradient-to-br from-purple-100 to-purple-50",
      iconColor: "text-purple-600",
      action: () => navigate("/user/appointments"),
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Track Status",
      desc: "Check ticket status",
      bg: "bg-gradient-to-br from-orange-100 to-orange-50",
      iconColor: "text-orange-600",
      action: () => navigate("/user/my-tickets"),
    },
    {
      icon: <AlertCircle className="w-8 h-8" />,
      title: "Quick Fix",
      desc: "Self-service guides",
      bg: "bg-gradient-to-br from-yellow-100 to-yellow-50",
      iconColor: "text-yellow-600",
      action: () => navigate("/user/quick-fix"),
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Satisfaction",
      desc: "Rate our service",
      bg: "bg-gradient-to-br from-pink-100 to-pink-50",
      iconColor: "text-pink-600",
      action: () => navigate("/user/feedback"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 p-4 md:p-6 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2 tracking-tight">
              Hello {user?.name || "User"} <span className="animate-wave origin-bottom-right inline-block">👋</span>
            </h1>
            <p className="text-gray-500 mt-1">Ready to manage your requests today?</p>
          </div>
        </div>

        {/* Hero Card */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-blue-200 transition-transform hover:scale-[1.01] duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 transform rotate-45 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-16 -mb-16 transform rotate-45 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl text-center md:text-left">
              <span className="inline-block px-3 py-1 bg-blue-400/30 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-4 border border-blue-400/30">
                Welcome
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">PSUIC Service Center</h2>
              <p className="text-blue-50 text-base md:text-lg mb-6 leading-relaxed opacity-90">
                Report issues, track repairs, and manage facility requests all in one place. We are here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <button
                  onClick={() => navigate("/user/create-ticket")}
                  className="bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-bold text-sm hover:bg-blue-50 transition-all shadow-lg shadow-blue-900/10 active:scale-95 flex items-center justify-center gap-2"
                >
                  <FileText size={18} />
                  Report Issue
                </button>
                <button
                  onClick={() => navigate("/user/scan-qr")}
                  className="px-8 py-3.5 rounded-2xl font-bold text-sm text-white border border-white/30 hover:bg-white/10 transition-all active:scale-95 backdrop-blur-sm flex items-center justify-center gap-2"
                >
                  <QrCode size={18} />
                  Scan QR
                </button>
              </div>
            </div>
            <div className="hidden md:block opacity-90 transform hover:scale-105 transition-transform duration-500">
              {/* Illustration placeholder or SVG */}
              <div className="w-56 h-48 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-2xl skew-y-3 rotate-3">
                <QrCode size={80} className="text-white opacity-80" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div>
          <h3 className="font-bold text-gray-800 mb-5 text-xl flex items-center gap-2">
            Your Tickets
            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{stats.total} Total</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatusCard
              icon={<AlertCircle size={24} />}
              count={stats.pending}
              label="Uncompleted"
              color="red"
              desc="Items need attention"
            />
            <StatusCard
              icon={<Clock size={24} />}
              count={stats.inProgress}
              label="In Progress"
              color="yellow"
              desc="Being worked on"
            />
            <StatusCard
              icon={<CheckCircle size={24} />}
              count={stats.completed}
              label="Completed"
              color="green"
              desc="Resolved successfully"
            />
          </div>
        </div>

        {/* Services Grid */}
        <div>
          <h3 className="font-bold text-gray-800 mb-5 text-xl">Other Services</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {services.map((service, index) => (
              <button
                key={index}
                onClick={service.action}
                className={`
                                    relative overflow-hidden group rounded-3xl p-6 h-48
                                    flex flex-col items-center justify-center gap-4
                                    bg-white border border-gray-100 shadow-sm
                                    hover:shadow-xl hover:-translate-y-1 hover:border-blue-100
                                    transition-all duration-300
                                `}
              >
                <div className={`
                                    absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                    bg-gradient-to-br ${service.gradient || 'from-blue-50 to-indigo-50'}
                                `}></div>

                {service.badge && (
                  <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
                    {service.badge}
                  </span>
                )}

                <div className={`
                                    relative z-10 w-14 h-14 rounded-2xl flex items-center justify-center
                                    ${service.bg} text-${service.color}-600
                                    group-hover:scale-110 transition-transform duration-300 shadow-sm
                                `}>
                  {service.icon}
                </div>

                <div className="relative z-10 text-center">
                  <span className="block text-gray-800 font-bold text-sm group-hover:text-blue-600 transition-colors">
                    {service.title}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {service.desc}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Component for Stats
const StatusCard = ({ icon, count, label, color, desc }) => {
  const colorStyles = {
    red: { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100', iconBg: 'bg-white' },
    yellow: { bg: 'bg-amber-50', text: 'text-amber-500', border: 'border-amber-100', iconBg: 'bg-white' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-500', border: 'border-emerald-100', iconBg: 'bg-white' }
  };
  const style = colorStyles[color];

  return (
    <div className={`bg-white border rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 ${style.border}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl ${style.bg} ${style.text}`}>
          {icon}
        </div>
        <span className={`text-4xl font-bold ${style.text}`}>{count}</span>
      </div>
      <div>
        <h4 className="font-bold text-gray-800">{label}</h4>
        <p className="text-xs text-gray-400 mt-1">{desc}</p>
      </div>
    </div>
  );
};

export default HomeUser;
