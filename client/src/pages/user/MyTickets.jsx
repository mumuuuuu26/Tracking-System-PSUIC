// client/src/pages/user/MyTickets.jsx
import React, { useEffect, useState } from "react";
import { Search, Filter, MapPin, Monitor, Calendar } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { listMyTickets } from "../../api/ticket";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const MyTickets = () => {
  const { token } = useAuthStore();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, activeFilter, searchTerm]);

  const loadTickets = async () => {
    try {
      const res = await listMyTickets(token);
      setTickets(res.data);
      setFilteredTickets(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    // Filter by status
    if (activeFilter !== "All") {
      filtered = filtered.filter((t) => {
        if (activeFilter === "Completed") return t.status === "fixed";
        if (activeFilter === "In Progress") return t.status === "in_progress";
        if (activeFilter === "Pending") return t.status === "pending";
        return true;
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTickets(filtered);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "border-l-4 border-yellow-400 bg-yellow-50";
      case "in_progress":
        return "border-l-4 border-blue-400 bg-blue-50";
      case "fixed":
        return "border-l-4 border-green-400 bg-green-50";
      default:
        return "border-l-4 border-gray-400 bg-gray-50";
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "Critical":
        return "bg-red-100 text-red-700";
      case "High":
        return "bg-orange-100 text-orange-700";
      case "Medium":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-green-100 text-green-700";
    }
  };

  const filters = ["All", "Completed", "In Progress", "Pending"];

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">My Tickets</h1>
      </div>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search by ID or keyword..."
          className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition ${
              activeFilter === filter
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.map((ticket) => (
          <div
            key={ticket.id}
            className={`rounded-xl p-4 ${getStatusColor(
              ticket.status
            )} shadow-sm`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-blue-600 font-semibold text-sm">
                  #TK-{String(ticket.id).padStart(4, "0")}
                </span>
                <span
                  className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getUrgencyBadge(
                    ticket.urgency
                  )}`}
                >
                  {ticket.urgency}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                {dayjs(ticket.createdAt).fromNow()}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-semibold text-gray-800 mb-2">{ticket.title}</h3>

            {/* Meta Info */}
            <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
              {ticket.room && (
                <div className="flex items-center gap-1">
                  <MapPin size={12} />
                  <span>{ticket.room.name}</span>
                </div>
              )}
              {ticket.equipment && (
                <div className="flex items-center gap-1">
                  <Monitor size={12} />
                  <span>{ticket.equipment.name}</span>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    ticket.status === "pending"
                      ? "bg-yellow-400"
                      : ticket.status === "in_progress"
                      ? "bg-blue-400"
                      : "bg-green-400"
                  }`}
                />
                <span className="text-xs font-medium capitalize">
                  {ticket.status.replace("_", " ")}
                </span>
              </div>

              {ticket.assignedTo && (
                <div className="flex items-center gap-1">
                  <img
                    src={`https://ui-avatars.com/api/?name=${ticket.assignedTo.name}&background=random`}
                    alt={ticket.assignedTo.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-xs text-gray-600">
                    {ticket.assignedTo.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredTickets.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No tickets found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
