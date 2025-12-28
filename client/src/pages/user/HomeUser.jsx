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
      desc: "สแกนเพื่อดูประวัติอุปกรณ์",
      bg: "bg-gradient-to-br from-green-100 to-green-50",
      iconColor: "text-green-600",
      action: () => navigate("/user/scan-qr"),
      badge: "New",
    },
    {
      icon: <FileText className="w-8 h-8" />,
      title: "Create Ticket",
      desc: "แจ้งปัญหาใหม่",
      bg: "bg-gradient-to-br from-blue-100 to-blue-50",
      iconColor: "text-blue-600",
      action: () => navigate("/user/create-ticket"),
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Appointment",
      desc: "นัดหมายช่าง",
      bg: "bg-gradient-to-br from-purple-100 to-purple-50",
      iconColor: "text-purple-600",
      action: () => navigate("/user/appointments"),
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Track Status",
      desc: "ติดตามสถานะ",
      bg: "bg-gradient-to-br from-orange-100 to-orange-50",
      iconColor: "text-orange-600",
      action: () => navigate("/user/my-tickets"),
    },
    {
      icon: <AlertCircle className="w-8 h-8" />,
      title: "Quick Fix",
      desc: "วิธีแก้ปัญหาเบื้องต้น",
      bg: "bg-gradient-to-br from-yellow-100 to-yellow-50",
      iconColor: "text-yellow-600",
      action: () => navigate("/user/quick-fix"),
    },
    {
      icon: <CheckCircle className="w-8 h-8" />,
      title: "Satisfaction",
      desc: "ประเมินความพึงพอใจ",
      bg: "bg-gradient-to-br from-pink-100 to-pink-50",
      iconColor: "text-pink-600",
      action: () => navigate("/user/feedback"),
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Hello {user?.name || "User"} 👋
          </h1>
          <p className="text-gray-600 mt-1">How can we help you today?</p>
        </div>
      </div>

      {/* Hero Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Start Learning</h2>
          <p className="text-blue-100 mb-4 max-w-lg">
            Learn how to use our service system effectively. We have prepared a guide to help you get started quickly.
          </p>
          <button className="bg-white text-blue-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition shadow-sm">
            Get Started
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div>
        <h3 className="font-bold text-gray-800 mb-4 text-lg">Your Tickets</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-red-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="p-2 bg-red-50 text-red-600 rounded-xl mb-2">
              <AlertCircle size={20} />
            </div>
            <h4 className="text-2xl font-bold text-gray-800">{stats.pending}</h4>
            <p className="text-gray-500 text-xs font-medium">Uncompleted</p>
          </div>
          <div className="bg-white border border-yellow-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-xl mb-2">
              <Clock size={20} />
            </div>
            <h4 className="text-2xl font-bold text-gray-800">{stats.inProgress}</h4>
            <p className="text-gray-500 text-xs font-medium">In Progress</p>
          </div>
          <div className="bg-white border border-green-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
            <div className="p-2 bg-green-50 text-green-600 rounded-xl mb-2">
              <CheckCircle size={20} />
            </div>
            <h4 className="text-2xl font-bold text-gray-800">{stats.completed}</h4>
            <p className="text-gray-500 text-xs font-medium">Completed</p>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div>
        <h3 className="font-bold text-gray-800 mb-4 text-lg">Other Services</h3>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {services.map((service, index) => (
            <button
              key={index}
              onClick={service.action}
              className={`${service.bg} rounded-2xl p-6 flex flex-col items-center justify-center gap-3 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md group relative h-40`}
            >
              {service.badge && (
                <span className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {service.badge}
                </span>
              )}
              <div className={`${service.iconColor} p-3 bg-white/60 rounded-full shadow-sm group-hover:bg-white group-hover:scale-110 transition-all`}>
                {service.icon}
              </div>
              <span className="text-sm text-gray-700 font-bold text-center">
                {service.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeUser;
