// client/src/pages/user/HomeUser.jsx
import React, { useEffect, useState, useCallback } from "react";
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
  Bell,
  BookOpen,
  MapPin,
  HelpCircle,
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

      const pending = tickets.filter((t) => t.status === "pending").length;
      const inProgress = tickets.filter(
        (t) => t.status === "in_progress"
      ).length;
      const completed = tickets.filter(
        (t) => t.status === "fixed" || t.status === "rejected"
      ).length; // Count fixed and rejected as completed history

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
      icon: <ScanLine />,
      title: "Scan QR",
      bgColor: "bg-[#E8F5E9]", // Light Green
      iconColor: "text-[#2E7D32]", // Green
      isNew: false,
      action: () => navigate("/user/scan-qr"),
    },
    {
      icon: <Ticket />,
      title: "Create Ticket",
      bgColor: "bg-[#E3F2FD]", // Light Blue
      iconColor: "text-[#1565C0]", // Blue
      action: () => navigate("/user/create-ticket"),
    },
    {
      icon: <Calendar />,
      title: "Appointment",
      bgColor: "bg-[#F3E5F5]", // Light Purple
      iconColor: "text-[#7B1FA2]", // Purple
      action: () => navigate("/user/appointments"),
    },
    {
      icon: <MapPin />,
      title: "All Tickets",
      bgColor: "bg-[#FFEBEE]", // Light Red
      iconColor: "text-[#C62828]", // Red
      action: () => navigate("/user/my-tickets"),
    },
    {
      icon: <HelpCircle />,
      title: "Quick Fix",
      bgColor: "bg-[#EDE7F6]", // Deep Purple scale
      iconColor: "text-[#673AB7]", // Deep Purple
      action: () => navigate("/user/quick-fix"),
    },
    {
      icon: <Smile />,
      title: "Satisfaction",
      bgColor: "bg-[#FFFDE7]", // Light Yellow
      iconColor: "text-[#FBC02D]", // Yellow
      action: () => navigate("/user/feedback"),
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
            label="Pending"
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
                {/* Clone element to increase size on desktop and apply specific color */}
                {React.cloneElement(service.icon, { className: `w-7 h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 ${service.iconColor}` })}

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

      {/* Upcoming Appointment Section - Compacted */}
      <div className="w-full max-w-7xl mx-auto px-6 mt-4 md:mt-6 mb-16 transition-all duration-300">
        <div className="flex justify-between items-center mb-2 md:mb-3">
          <h3 className="font-medium text-gray-800 text-sm md:text-base">Upcoming appointment</h3>
          <button
            onClick={() => navigate('/user/appointments')}
            className="text-gray-500 text-xs md:text-xs font-semibold hover:text-blue-600 transition-colors"
          >
            View All
          </button>
        </div>

        {(() => {
          // Logic to find the nearest upcoming appointment (Confirmed OR Requested)
          const upcomingAppointments = stats.allTickets
            ?.map(t => {
              // Check for confirmed appointment
              if (t.appointment && new Date(t.appointment.scheduledAt) > new Date()) {
                return { ...t, _apptDate: new Date(t.appointment.scheduledAt), _isConfirmed: true };
              }
              // Check for requested appointment in description
              const match = t.description?.match(/\[Requested Appointment: (\d{4}-\d{2}-\d{2})/);
              if (match) {
                const reqDate = new Date(match[1]);
                // If the requested date is in the future (or today), count it
                if (reqDate >= new Date().setHours(0, 0, 0, 0)) {
                  return { ...t, _apptDate: reqDate, _isConfirmed: false };
                }
              }
              return null;
            })
            .filter(Boolean)
            .sort((a, b) => a._apptDate - b._apptDate);

          const nextAppointment = upcomingAppointments?.[0];

          if (!nextAppointment) {
            return (
              <div className="bg-white rounded-3xl md:rounded-[2rem] p-4 text-center shadow-sm border border-gray-100">
                <p className="text-gray-500 font-medium text-sm">No upcoming appointments</p>
                <button
                  onClick={() => navigate('/user/create-ticket')}
                  className="mt-2 px-6 py-2 bg-blue-50 text-blue-600 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors"
                >
                  Book Now
                </button>
              </div>
            );
          }

          const formattedDate = nextAppointment._apptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          // Calculate Progress
          let progress = 0;
          if (nextAppointment.checklist) {
            try {
              const checklist = JSON.parse(nextAppointment.checklist);
              if (Array.isArray(checklist) && checklist.length > 0) {
                const checkedCount = checklist.filter(item => item.checked).length;
                progress = Math.round((checkedCount / checklist.length) * 100);
              } else {
                // Fallback based on status if checklist is empty array
                if (nextAppointment.status === 'scheduled') progress = 50;
                if (nextAppointment.status === 'in_progress') progress = 25;
                if (nextAppointment.status === 'fixed') progress = 100;
              }
            } catch (e) {
              console.error("Error parsing checklist for progress", e);
              progress = 50; // Default error fallback
            }
          } else {
            // No checklist, fallback to status
            if (nextAppointment.status === 'pending') progress = 5;
            if (nextAppointment.status === 'in_progress') progress = 25;
            if (nextAppointment.status === 'scheduled') progress = 50;
            if (nextAppointment.status === 'fixed') progress = 100;
          }

          // Ensure progress is valid number
          if (isNaN(progress)) progress = 0;

          const radius = 35;
          const circumference = 2 * Math.PI * radius;
          const strokeDashoffset = circumference - (progress / 100) * circumference;

          return (
            <div className="bg-[#E3F5FF] rounded-2xl md:rounded-[1.5rem] p-3 md:p-5 relative overflow-hidden transform hover:scale-[1.01] transition-transform duration-300 cursor-pointer" onClick={() => navigate(`/user/ticket/${nextAppointment.id}`)}>
              <div className="flex justify-between items-start md:items-center">
                <div className="flex-1">
                  {/* Blue accent line */}
                  <div className="w-1 h-5 md:h-6 bg-blue-600 rounded-full absolute left-0 top-5 md:top-6"></div>
                  <h4 className="font-medium text-gray-800 mb-0.5 ml-2 text-xs md:text-sm truncate max-w-[150px] md:max-w-xs cursor-help" title={nextAppointment.title}>{nextAppointment.title}</h4>
                  <p className="text-gray-500 text-[9px] md:text-[10px] ml-2 mb-2 md:mb-3 truncate">{nextAppointment.room?.roomNumber || "Location N/A"}</p>

                  <div className="flex gap-8 ml-2 md:gap-12">
                    <div>
                      <p className="text-gray-400 text-[10px] md:text-[10px] uppercase font-bold mb-2">Teammates</p>
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-300 overflow-hidden border-2 border-white shadow-sm">
                        {nextAppointment.assignedTo?.picture ? (
                          <img src={nextAppointment.assignedTo.picture} alt="IT Support" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white font-bold text-xs">
                            {nextAppointment.assignedTo?.username?.charAt(0).toUpperCase() || "IT"}
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] md:text-[10px] uppercase font-bold mb-2">Due date</p>
                      <div className="flex items-center gap-1 text-gray-600 text-xs md:text-sm font-semibold">
                        <Calendar size={14} className="md:w-4 md:h-4" />
                        <span>{formattedDate}</span>
                      </div>
                      {!nextAppointment._isConfirmed && (
                        <span className="text-[9px] text-amber-500 font-bold block mt-0.5">Wait Confirm</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Circular Progress */}
                <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="50%" cy="50%" r="45%" stroke="white" strokeWidth="6" fill="none" />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      stroke={nextAppointment._isConfirmed ? "#3B82F6" : "#F59E0B"} // Blue if confirmed, Amber if pending
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className={`absolute text-xs md:text-lg font-bold ${nextAppointment._isConfirmed ? "text-blue-600" : "text-amber-500"}`}>{progress}%</span>
                </div>
              </div>
            </div>
          );
        })()}
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
