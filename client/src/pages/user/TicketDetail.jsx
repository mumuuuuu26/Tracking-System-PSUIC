// client/src/pages/user/TicketDetail.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Clock, AlertCircle, Calendar, XCircle, ChevronDown } from "lucide-react";
import { getTicket } from "../../api/ticket";
import { respondReschedule } from "../../api/appointment";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";

const TicketDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = useAuthStore((state) => state.token);

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await getTicket(token, id);
      setTicket(res.data);
    } catch (err) {
      console.error("Error fetching ticket:", err);
      setError("Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error || "Ticket not found"}</p>
        <button
          onClick={() => navigate("/user/my-tickets")}
          className="text-blue-600 hover:underline"
        >
          Back to My Tickets
        </button>
      </div>
    );
  }

  // Determine status color/label
  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "text-yellow-600";
      case "in_progress": return "text-blue-600";
      case "fixed": return "text-green-600";
      case "rejected": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending": return "Pending";
      case "in_progress": return "In Progress";
      case "fixed": return "Completed";
      case "rejected": return "Rejected";
      default: return status || "Unknown";
    }
  };

  // Safe date formatter
  const formatDate = (dateString, options = {}) => {
    try {
      if (!dateString) return "N/A";
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "Invalid Date";
      return d.toLocaleString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
        ...options
      });
    } catch (e) {
      return "Date Error";
    }
  };

  // Timeline Helper
  const getTimelineSteps = () => {
    if (!ticket) return [];

    const steps = [
      {
        id: 'submitted',
        label: 'Submitted',
        date: ticket?.createdAt,
        completed: true,
        icon: <CheckCircle className="w-6 h-6 text-white" />
      },
      {
        id: 'accepted',
        label: ticket?.description?.includes("[Requested Appointment") ? 'Confirmed' : 'Accepted',
        date: ticket?.status !== 'pending' ? ticket?.updatedAt : null, // Approximate
        completed: ticket?.status !== 'pending' && ticket?.status !== 'rejected',
        icon: <Clock className="w-6 h-6 text-white" />
      },
      {
        id: 'completed',
        label: 'Completed',
        date: ticket?.status === 'fixed' ? ticket?.updatedAt : null,
        completed: ticket?.status === 'fixed',
        icon: <CheckCircle className="w-6 h-6 text-white" />
      }
    ];
    return steps;
  };

  const timelineSteps = getTimelineSteps();

  // Helper to find specific images (Safe access)
  const beforeImage = ticket?.images?.find(img => img.type === "before")?.url;
  const afterImage = ticket?.images?.find(img => img.type === "after")?.url;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
      {/* Deep Blue Header */}
      <div className="bg-[#193C6C] px-6 pt-10 pb-10 rounded-b-[2rem] shadow-lg w-full mb-6">
        <div className="max-w-md md:max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10 p-3 -ml-3 rounded-full transition-colors"
          >
            <ChevronDown className="rotate-90" size={28} />
          </button>
          <h1 className="text-white text-xl md:text-2xl font-bold flex-1 text-center pr-10">
            {ticket?.description?.includes("[Requested Appointment") ? "Appointment Details" : "Ticket Details"}
          </h1>
        </div>
      </div>

      <div className="max-w-md md:max-w-2xl mx-auto px-4 pb-6 space-y-6 animate-in fade-in duration-500">

        {/* Ticket Info Card */}
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6 space-y-4">
          {/* Row item helper */}
          {[
            { label: "Ticket ID", value: "#" + ticket?.id, color: "text-blue-600 font-bold" },
            { label: "Equipment Type", value: ticket?.category?.name || "General" },
            { label: "Description", value: ticket?.description || "none" },
            { label: "Floor", value: ticket?.room?.floor || "-" },
            { label: "Room", value: ticket?.room?.roomNumber || "-" },
            { label: "Priority", value: ticket?.urgency || "Normal" },
            { label: "Time", value: formatDate(ticket?.createdAt, { hour: '2-digit', minute: '2-digit', hour12: true }) } // e.g. 26-12-2025, 10:30 AM
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-start">
              <span className="text-gray-600 font-medium text-[15px]">{item.label}</span>
              <span className={`text-right font-bold text-[15px] ${item.color || "text-gray-900"}`}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Status Bar */}
        <div className="bg-[#193C6C] rounded-lg px-5 py-4 flex justify-between items-center text-white shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-1.5 rounded-md">
              <AlertCircle size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg">Status</span>
          </div>
          <span className="font-bold text-lg capitalize">
            {ticket?.status ? ticket.status.replace("_", " ") : "Unknown"}
          </span>
        </div>

        {/* Timeline */}
        <div>
          <h3 className="font-bold text-[#3B4D68] uppercase text-sm mb-4">TIMELINE</h3>
          <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6">
            <div className="space-y-8 relative pl-2">
              {/* Vertical Line */}
              <div className="absolute left-[19px] top-3 bottom-6 w-0.5 bg-gray-200"></div>

              {timelineSteps.map((step, index) => (
                <div key={step.id} className="flex gap-4 relative z-10 font-sans">
                  {/* Icon Bubble */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-[3px] border-white shadow-sm ring-1 ring-gray-100 ${step.completed ? 'bg-green-500' :
                    (step.id === 'accepted' && ticket?.status === 'in_progress') ? 'bg-amber-400' : 'bg-gray-100' // Amber for hourglass
                    }`}>
                    {step.completed ? <CheckCircle size={20} className="text-white" /> :
                      (step.id === 'accepted' && ticket?.status === 'in_progress') ? <Clock size={20} className="text-white" /> :
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>}
                  </div>

                  <div className="pt-0.5">
                    <h4 className="font-bold text-gray-900 text-base">{step.label}</h4>
                    {step.date && (
                      <p className="text-gray-400 text-xs mt-1">
                        {formatDate(step.date, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    )}
                    {step.id === 'accepted' && ticket?.status === 'pending' && (
                      <span className="inline-block bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full mt-2">Waiting</span>
                    )}
                    {step.id === 'completed' && ticket?.status !== 'fixed' && (
                      <p className="text-xs text-gray-400 mt-1">Pending resolution</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upload Photo */}
        <div>
          <h3 className="font-bold text-[#3B4D68] text-base mb-4">Upload Photo</h3>
          <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Before Photo */}
              <div className="relative group rounded-2xl overflow-hidden aspect-square bg-gray-100 shadow-inner">
                {beforeImage ? (
                  <img src={beforeImage} className="w-full h-full object-cover" alt="Before" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <span className="bg-gray-200 p-2 rounded-full mb-2"><Calendar size={20} /></span> {/* Placeholder icon */}
                    <span className="text-[10px] font-bold uppercase">No Image</span>
                  </div>
                )}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 text-white font-bold px-3 py-1 rounded-full backdrop-blur-sm text-sm uppercase tracking-wider">BEFORE</div>
              </div>

              {/* After Photo */}
              <div className="relative group rounded-2xl overflow-hidden aspect-square bg-gray-100 shadow-inner">
                {afterImage ? (
                  <img src={afterImage} className="w-full h-full object-cover" alt="After" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <span className="bg-gray-200 p-2 rounded-full mb-2"><Calendar size={20} /></span> {/* Placeholder icon */}
                    <span className="text-[10px] font-bold uppercase">No Photo</span>
                  </div>
                )}
                {afterImage && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/40 text-white font-bold px-3 py-1 rounded-full backdrop-blur-sm text-sm uppercase tracking-wider">AFTER</div>}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TicketDetail;
