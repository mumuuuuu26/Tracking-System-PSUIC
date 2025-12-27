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
    <div className="p-4 max-w-md md:max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Hello {user?.name || "User"} 👋
          </h1>
          <p className="text-gray-600 mt-1">How can we help you today?</p>
        </div>
        {/* <button
          onClick={handleLogout}
          className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
          title="Logout"
        >
          <LogOut size={24} />
        </button> */}
      </div>

      <div className="md:flex md:gap-6">
        {/* Left Column (Hero + Stats) */}
        <div className="md:w-2/3">
          {/* Hero Card */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 mb-6 text-white shadow-lg">
            <h2 className="text-lg font-semibold mb-2">Start Learning</h2>
            <p className="text-blue-100 text-sm mb-4">
              Learn how to use our service system effectively
            </p>
            <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-50 transition">
              Get Started
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {stats.pending}
              </div>
              <div className="text-xs text-gray-600 mt-1">Uncompleted</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.inProgress}
              </div>
              <div className="text-xs text-gray-600 mt-1">In Progress</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.completed}
              </div>
              <div className="text-xs text-gray-600 mt-1">Completed</div>
            </div>
          </div>
        </div>

        {/* Right Column (Services) */}
        <div className="md:w-1/3">
          <h3 className="font-semibold text-gray-800 mb-3">Other Services</h3>
          <div className="grid grid-cols-3 md:grid-cols-2 gap-3">
            {services.map((service, index) => (
              <button
                key={index}
                onClick={service.action}
                className={`${service.bg} rounded-xl p-4 flex flex-col items-center justify-center min-h-[100px] relative hover:scale-105 transition-transform`}
              >
                {service.badge && (
                  <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    {service.badge}
                  </span>
                )}
                <div className={`${service.iconColor} mb-2`}>
                  {service.icon}
                </div>
                <span className="text-xs text-gray-700 font-medium text-center">
                  {service.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeUser;
