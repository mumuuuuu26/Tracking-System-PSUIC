import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  Camera,
  TicketPlus,
  Calendar,
  BookOpen,
  Filter
} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { listMyTickets } from "../../api/ticket";



const HomeUser = () => {
  const { user, token, checkUser } = useAuthStore();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("All");

  const loadData = useCallback(async () => {
    try {
      const res = await listMyTickets(token);
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    checkUser();
    loadData();
  }, [checkUser, loadData]);


  const services = [
    {
      icon: <img src="/icons/camera-3d.png" alt="Scan QR" />,
      title: "Scan QR",
      action: () => navigate("/user/scan-qr"),
      bg: "bg-[#EFF4FF]"
    },
    {
      icon: <img src="/img/3dicons-pencil-dynamic-color.png" alt="Report Issue" />,
      title: "Report Issue",
      action: () => navigate("/user/create-ticket"),
      bg: "bg-[#EFF4FF]"
    },
    {
      icon: <img src="/icons/calendar-3d.png" alt="IT Schedule" />,
      title: "IT Schedule",
      action: () => navigate("/user/it-schedule"),
      bg: "bg-[#EFF4FF]"
    },
    {
      icon: <img src="/icons/notebook-3d.png" alt="Knowledge" />,
      title: "Knowledge",
      action: () => navigate("/user/quick-fix"),
      bg: "bg-[#EFF4FF]"
    },
  ];

  const filteredTickets = tickets.filter((t) => {
    const ticketDate = new Date(t.createdAt);
    const today = new Date();
    const isToday = ticketDate.getDate() === today.getDate() &&
      ticketDate.getMonth() === today.getMonth() &&
      ticketDate.getFullYear() === today.getFullYear();

    if (!isToday) return false;

    if (filter === "All") return true;
    if (filter === "Not Started") return t.status === "not_start";
    if (filter === "In progress") return t.status === "in_progress";
    if (filter === "Completed") return t.status === "completed";
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900">

      {/* 1. Header Section - Curved with Greeting & Icons */}
      <div className="bg-[#193C6C] px-6 pt-10 pb-12 rounded-b-[2.5rem] shadow-lg relative z-0 lg:hidden">
        <div className="w-full max-w-[1920px] mx-auto flex items-start justify-between text-white">
          <div className="flex flex-col">
            <span className="text-sm md:text-lg font-medium opacity-90">Greeting</span>
            <span className="text-3xl md:text-5xl font-bold mt-1 tracking-tight">{user?.name || "User"}</span>
          </div>
        </div>
      </div>

      <div className="px-6 md:px-8 mt-6 w-full max-w-[1920px] mx-auto lg:mx-0 flex flex-col gap-8 relative z-10">

        {/* Mobile/Tablet Grid: Visible only on smaller screens */}
        <div className="grid grid-cols-4 gap-2 md:gap-4 w-full lg:hidden">
          {services.map((service, index) => (
            <button
              key={index}
              onClick={service.action}
              className="group w-full"
            >
              <div className={`w-full aspect-square ${service.bg} rounded-[24px] md:rounded-[32px] flex flex-col items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 p-2`}>
                <div className="w-[60%] h-[60%] flex items-center justify-center mb-1">
                  {React.cloneElement(service.icon, { className: "w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300" })}
                </div>
                <span className="text-[10px] md:text-sm font-bold text-gray-700 text-center leading-tight whitespace-nowrap">
                  {service.title}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* 3. Main Content - Today's Tickets */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-3xl font-bold text-gray-900">Today&apos;s Tickets</h2>
            <button
              onClick={() => navigate("/user/history")}
              className="text-sm md:text-lg font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              View All
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {["All", "Not Started", "In progress", "Completed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`py-2 md:py-3 rounded-xl text-[10px] md:text-sm font-bold whitespace-nowrap transition-all duration-200 border flex items-center justify-center ${filter === f
                  ? "bg-[#193C6C] text-white border-[#193C6C] shadow-md"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                  }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Ticket List */}
          <div className="grid grid-cols-1 gap-5 md:gap-6">
            {filteredTickets.slice(0, 6).map((ticket) => ( // Show up to 6 on larger screens
              <div key={ticket.id}
                onClick={() => navigate(`/user/ticket/${ticket.id}`)}
                className={`bg-white rounded-2xl p-5 md:p-6 border border-gray-200 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-blue-100 group cursor-pointer ${ticket.status === 'completed' || ticket.status === 'closed' ? 'opacity-60 hover:opacity-100' : ''
                  }`}
              >
                {/* Header Row: Category & Status */}
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl md:text-2xl font-bold text-[#193C6C] line-clamp-1 group-hover:text-blue-800 transition-colors">
                    {ticket.category?.name || "General"}
                  </h3>

                  {/* Status Badge */}
                  <div className={`px-3 py-1 rounded-lg text-[10px] md:text-xs font-bold border ${ticket.status === 'completed' ? 'border-green-500 text-green-600 bg-green-50' :
                    ticket.status === 'in_progress' ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
                      'border-red-500 text-red-600 bg-red-50'
                    }`}>
                    {ticket.status === 'not_start' ? 'Not Started' :
                      ticket.status === 'in_progress' ? 'In Progress' : 'Completed'}
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-1 mb-6">
                  <p className="text-base md:text-lg text-gray-800 font-bold line-clamp-1">
                    {ticket.description || "No description provided"}
                  </p>
                  <p className="text-sm md:text-base text-gray-500">
                    Floor {ticket.room?.floor || "-"} , {ticket.room?.roomNumber || "-"}
                  </p>
                </div>

                {/* Footer Separator */}
                <div className="h-px w-full bg-gray-100 mb-4"></div>

                {/* Footer Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs md:text-sm font-medium text-gray-500">
                    <span>{new Date(ticket.updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }).replace(":", ".")} PM</span>
                    <span className="w-px h-3 bg-gray-300"></span>
                    <span>{new Date(ticket.updatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}</span>
                  </div>
                  <span className="text-xs md:text-sm font-bold text-gray-500">
                    {user?.name}
                  </span>
                </div>
              </div>
            ))}

            {filteredTickets.length === 0 && (
              <div className="col-span-full text-center py-20 text-gray-400 text-sm md:text-base">
                No tickets found
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomeUser;
