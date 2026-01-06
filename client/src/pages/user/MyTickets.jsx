// client/src/pages/user/MyTickets.jsx
import React, { useEffect, useState } from "react";
import { Search, MapPin, Monitor, Star, Clock, AlertCircle, CheckCircle, Activity, Filter } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { listMyTickets } from "../../api/ticket";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useNavigate } from "react-router-dom";

dayjs.extend(relativeTime);

const MyTickets = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, activeFilter, searchTerm]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await listMyTickets(token);
      setTickets(res.data);
      setFilteredTickets(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
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
          String(t.id).includes(searchTerm) ||
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

  const filters = ["All", "Pending", "In Progress", "Completed"];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100 pt-8 pb-6 px-4 mb-8 sticky top-0 z-10 bg-opacity-80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Tickets</h1>
              <p className="text-gray-500 mt-1">Track and manage your support requests</p>
            </div>
            <button
              onClick={() => navigate('/user/create-ticket')}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:bg-blue-700 transition-all hover:-translate-y-0.5"
            >
              + New Ticket
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by ID, title, or keyword..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-5 py-3 rounded-xl whitespace-nowrap text-sm font-medium transition-all ${activeFilter === filter
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white h-48 rounded-xl animate-pulse shadow-sm border border-gray-100"></div>
            ))}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-lg mx-auto">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No tickets found</h3>
            <p className="text-gray-500 max-w-xs mx-auto">
              {searchTerm || activeFilter !== "All" ? "No matches for your search filters." : "You haven't created any support tickets yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/user/ticket/${ticket.id}`)}
                className={`rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full ${getStatusColor(ticket.status)}`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 font-bold text-sm">
                      #TK-{String(ticket.id).padStart(4, "0")}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getUrgencyBadge(ticket.urgency)}`}>
                      {ticket.urgency}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 font-medium">
                    {dayjs(ticket.createdAt).fromNow()}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-1">{ticket.title}</h3>

                {/* Meta Info */}
                <div className="flex flex-col gap-1 text-xs text-gray-600 mb-4 flex-1">
                  {ticket.room && (
                    <div className="flex items-center gap-1.5">
                      <MapPin size={14} />
                      <span className="truncate">{ticket.room.name}</span>
                    </div>
                  )}
                </div>

                {/* Status & User */}
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${ticket.status === "pending" ? "bg-yellow-400" :
                      ticket.status === "in_progress" ? "bg-blue-400" :
                        "bg-green-400"
                      }`} />
                    <span className="text-sm font-semibold text-gray-700 capitalize">
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>

                  {ticket.assignedTo && (
                    <div className="flex items-center gap-2 bg-white/50 px-2 py-1 rounded-full">
                      <img
                        src={ticket.assignedTo.picture || `https://ui-avatars.com/api/?name=${ticket.assignedTo.name}&background=random`}
                        alt={ticket.assignedTo.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-xs text-gray-600 font-medium truncate max-w-[80px]">
                        {(ticket.assignedTo.name || ticket.assignedTo.username || "IT Support").split(' ')[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Rate Button */}
                {ticket.status === 'fixed' && !ticket.rating && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/user/feedback/${ticket.id}`);
                    }}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-yellow-100 text-yellow-700 py-2.5 rounded-lg text-sm font-bold hover:bg-yellow-200 transition-colors"
                  >
                    <Star size={16} /> Rate Service
                  </button>
                )}
                {ticket.rating && (
                  <div className="mt-4 w-full flex items-center justify-center gap-1 text-yellow-600 text-sm font-bold bg-yellow-50/80 py-2.5 rounded-lg border border-yellow-100">
                    <Star size={16} fill="#EAB308" className="text-yellow-500" />
                    <span>Rated {ticket.rating}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
