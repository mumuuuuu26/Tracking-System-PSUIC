import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  ScanLine,
  CirclePlus,
  CalendarDays,
  BookOpen,
  Filter
} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { listMyTickets } from "../../api/ticket";
import UserWrapper from "../../components/user/UserWrapper";
import UserTicketCard from "../../components/user/UserTicketCard";



const HomeUser = () => {
  const { user, token, checkUser } = useAuthStore();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);

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
      icon: <ScanLine className="w-6 h-6 text-[#193C6C]" />,
      title: "Scan QR",
      action: () => navigate("/user/scan-qr"),
      bg: "bg-white"
    },
    {
      icon: <CirclePlus className="w-6 h-6 text-[#193C6C]" />,
      title: "Report Issue",
      action: () => navigate("/user/create-ticket"),
      bg: "bg-white"
    },
    {
      icon: <CalendarDays className="w-6 h-6 text-[#193C6C]" />,
      title: "IT Schedule",
      action: () => navigate("/user/it-schedule"),
      bg: "bg-white"
    },
    {
      icon: <BookOpen className="w-6 h-6 text-[#193C6C]" />,
      title: "Knowledge",
      action: () => navigate("/user/quick-fix"),
      bg: "bg-white"
    },
  ];

  const filteredTickets = tickets.filter((t) => {
    const ticketDate = new Date(t.createdAt);
    const today = new Date();
    const isToday = ticketDate.getDate() === today.getDate() &&
      ticketDate.getMonth() === today.getMonth() &&
      ticketDate.getFullYear() === today.getFullYear();

    if (!isToday) return false;

    return true;
  });

  const displayName = user?.name || user?.username || user?.email || "User";

  return (
    <UserWrapper>
      <div className="pb-24">

        {/* 1. New Header Section (Welcome back) - Matching Image 2 */}
        <div className="bg-[#193C6C] px-6 pt-8 pb-14 rounded-b-[2.5rem] shadow-md relative z-0 lg:hidden">
          <div className="flex items-center justify-between text-white">
            <div className="flex flex-col">
              <span className="text-base font-medium opacity-90">Welcome back,</span>
              <span className="text-2xl font-bold mt-1 tracking-tight">{displayName}</span>
            </div>
            {/* Profile Picture */}
            <div
              onClick={() => navigate("/user/profile")}
              className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 bg-white/10 flex items-center justify-center cursor-pointer hover:border-white transition-colors"
            >
              {user?.picture ? (
                <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-white">{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto w-full px-6 md:px-8 mt-6 flex flex-col gap-8 relative z-10 text-gray-900">

          {/* Services Grid - White Squares with Line Icons */}
          <div className="grid grid-cols-4 gap-4 md:gap-6 lg:hidden">
            {services.map((service, index) => (
              <button
                key={index}
                onClick={service.action}
                className="group w-full flex flex-col items-center gap-2"
              >
                <div className={`w-full aspect-square ${service.bg} rounded-[20px] flex items-center justify-center shadow-sm border border-gray-100 transition-all duration-200 active:scale-95`}>
                  {service.icon}
                </div>
                <span className="text-[11px] font-medium text-gray-600 text-center leading-tight whitespace-nowrap">
                  {service.title}
                </span>
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
                style={{ fontSize: '12px' }}
              >
                View All
              </button>
            </div>

            {/* Ticket List */}
            <div className="grid grid-cols-1 gap-5 md:gap-6">
              {filteredTickets.slice(0, 6).map((ticket) => ( // Show up to 6 on larger screens
                <UserTicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => navigate(`/user/ticket/${ticket.id}`)}
                />
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
    </UserWrapper>
  );
};

export default HomeUser;
