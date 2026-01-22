// client/src/pages/user/MyTickets.jsx
import React, { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, Plus } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { listMyTickets } from "../../api/ticket";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigate } from "react-router-dom";
import CustomSelect from "../../components/ui/CustomSelect";

dayjs.extend(relativeTime);

const MyTickets = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  // Stats Counters
  const [stats, setStats] = useState({
    pending: 0,
    inProgress: 0,
    completed: 0,
  });

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await listMyTickets(token);
      setTickets(res.data);
      calculateStats(res.data);
      setFilteredTickets(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const calculateStats = (ticketData) => {
    let pending = 0;
    let inProgress = 0;
    let completed = 0;

    ticketData.forEach((t) => {
      // Pending
      if (t.status === "pending") pending++;
      // In Progress
      else if (["in_progress", "scheduled", "accepted"].includes(t.status))
        inProgress++;
      // Completed
      else if (["fixed", "closed"].includes(t.status)) completed++;
    });

    setStats({ pending, inProgress, completed });
  };

  const filterTickets = useCallback(() => {
    let filtered = [...tickets];

    // Filter by status (Tabs)
    if (activeFilter !== "All") {
      filtered = filtered.filter((t) => {
        if (activeFilter === "Completed")
          return ["fixed", "closed"].includes(t.status);
        if (activeFilter === "In progress")
          return ["in_progress", "accepted"].includes(t.status);
        if (activeFilter === "Scheduled") return t.status === "scheduled";
        if (activeFilter === "Pending") return t.status === "pending";
        if (activeFilter === "Rejected") return t.status === "rejected";
        return true;
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(t.id).includes(searchTerm) ||
          t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort: Status Priority then Newest First
    const statusOrder = {
      pending: 1,
      in_progress: 2,
      accepted: 2,
      scheduled: 3,
      fixed: 4,
      closed: 4,
      rejected: 5,
    };

    filtered.sort((a, b) => {
      // 1. Status
      const orderA = statusOrder[a.status] || 99;
      const orderB = statusOrder[b.status] || 99;
      if (orderA !== orderB) return orderA - orderB;

      // 2. Priority (Critical > High > Medium > Low)
      const priorityOrder = { Critical: 1, High: 2, Medium: 3, Low: 4 };
      const pA = priorityOrder[a.urgency] || 5;
      const pB = priorityOrder[b.urgency] || 5;
      if (pA !== pB) return pA - pB;

      // 3. Date (Newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    setFilteredTickets(filtered);
  }, [tickets, activeFilter, searchTerm]);

  useEffect(() => {
    filterTickets();
  }, [filterTickets]);

  const getPriorityBadge = (urgency) => {
    switch (urgency) {
      case "High":
      case "Critical":
        return "bg-red-50 text-red-600 border border-red-100";
      case "Medium":
        return "bg-amber-50 text-amber-600 border border-amber-100";
      case "Low":
        return "bg-green-50 text-green-600 border border-green-100";
      default:
        return "bg-gray-50 text-gray-600 border border-gray-100";
    }
  };

  // Status Dot Color
  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-500";
      case "in_progress":
        return "bg-blue-500";
      case "fixed":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status) => {
    if (status === "fixed") return "Completed";
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans relative">
      {/* Deep Blue Header */}
      <div className="bg-[#193C6C] px-6 pt-10 pb-8 rounded-b-[2rem] shadow-lg mb-6 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10 p-2 -ml-2 rounded-full transition-colors"
          >
            <ChevronLeft size={28} />
          </button>
          <h1 className="text-white text-2xl md:text-2xl font-bold flex-1 text-center pr-8">
            Ticket
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 space-y-8 animate-in fade-in duration-500">
        {/* Stats Row */}
        <div className="flex gap-4 justify-between">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1 flex flex-col items-center justify-center text-center">
            <span className="text-[#193C6C] font-bold text-3xl">
              {stats.pending}
            </span>
            <span className="text-gray-400 text-sm font-medium mt-1">
              Pending
            </span>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1 flex flex-col items-center justify-center text-center">
            <span className="text-[#193C6C] font-bold text-3xl">
              {stats.inProgress}
            </span>
            <span className="text-gray-400 text-sm font-medium mt-1">
              In progress
            </span>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1 flex flex-col items-center justify-center text-center">
            <span className="text-[#193C6C] font-bold text-3xl">
              {stats.completed}
            </span>
            <span className="text-gray-400 text-sm font-medium mt-1">
              Completed
            </span>
          </div>
        </div>

        {/* Search & New Ticket Button */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by ID, title, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-sm md:text-base"
            />
          </div>
          <button
            onClick={() => navigate("/user/create-ticket")}
            className="bg-[#193C6C] text-white px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 hover:bg-[#132E52] active:scale-95 transition-all text-sm md:text-base"
          >
            <Plus size={18} /> New Ticket
          </button>
        </div>

        {/* Filter Tabs */}
        <div>
          {/* Mobile: Custom Select Dropdown */}
          <div className="md:hidden">
            <CustomSelect
              options={[
                "All",
                "Pending",
                "In progress",
                "Scheduled",
                "Completed",
                "Rejected",
              ]}
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              placeholder="Filter by Status"
            />
          </div>

          {/* Desktop: Horizontal Buttons */}
          <div className="hidden md:flex md:gap-2 md:overflow-x-auto md:no-scrollbar md:pb-1">
            {[
              "All",
              "Pending",
              "In progress",
              "Scheduled",
              "Completed",
              "Rejected",
            ].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`
                        md:px-6 md:py-2.5 rounded-xl md:text-sm font-bold border transition-all md:w-auto md:whitespace-nowrap md:flex-shrink-0
                        ${activeFilter === filter
                    ? "bg-[#193C6C] text-white border-[#193C6C] shadow-md"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-700"
                  }
                    `}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Ticket Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-20 text-center text-gray-400">
              Loading tickets...
            </div>
          ) : filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/user/ticket/${ticket.id}`)}
                className={`
                            bg-white rounded-2xl p-6 shadow-sm border border-l-4 relative cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300
                            ${ticket.status === "pending"
                    ? "border-l-amber-400 border-gray-100"
                    : ticket.status === "in_progress"
                      ? "border-l-blue-400 border-gray-100"
                      : ticket.status === "fixed" ||
                        ticket.status === "closed"
                        ? "border-l-green-400 border-gray-100"
                        : "border-l-gray-400 border-gray-100"
                  }
                        `}
              >
                {/* Header: ID & Priority & Time */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[#193C6C] font-bold text-sm">
                      #TK-{String(ticket.id).padStart(4, "0")}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${getPriorityBadge(
                        ticket.urgency
                      )}`}
                    >
                      {ticket.urgency}
                    </span>
                  </div>
                  <span className="text-gray-400 text-xs font-medium">
                    {dayjs(ticket.createdAt)
                      .fromNow(true)
                      .replace(" days", "d")
                      .replace(" months", "mo")}{" "}
                    ago
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-gray-900 text-lg mb-1 line-clamp-2 min-h-[56px]">
                  {ticket.title}
                </h3>

                {/* Location */}
                <p className="text-gray-500 text-xs mb-6 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                  {ticket.room
                    ? `Floor ${ticket.room.floor}, ${ticket.room.roomNumber}`
                    : "Location N/A"}
                </p>

                {/* Footer: Status & User */}
                <div className="flex justify-between items-end border-t border-gray-50 pt-4">
                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${getStatusColor(
                        ticket.status
                      )}`}
                    ></div>
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      {getStatusText(ticket.status)}
                    </span>
                  </div>

                  {/* User Avatar */}
                  {ticket.assignedTo ? (
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-400 mb-0.5">
                        Assigned to
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-gray-600">
                          {ticket.assignedTo.name?.split(" ")[0]}
                        </span>
                        <img
                          src={
                            ticket.assignedTo.picture ||
                            `https://ui-avatars.com/api/?name=${ticket.assignedTo.name}&background=random`
                          }
                          alt="Agent"
                          className="w-6 h-6 rounded-full object-cover ring-2 ring-white"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300 italic">
                      Unassigned
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
                <Search size={32} opacity={0.5} />
              </div>
              <h3 className="text-xl font-bold text-[#193C6C]">
                No tickets found
              </h3>
              <p className="text-gray-400 text-sm mt-2">
                No tickets match your current filters.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTickets;
