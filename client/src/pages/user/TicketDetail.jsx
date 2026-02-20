// client/src/pages/user/TicketDetail.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Clock, AlertCircle, Calendar, XCircle, ChevronDown, ArrowLeft } from "lucide-react";
import MobileHeader from "../../components/ui/MobileHeader";
import { getTicket } from "../../api/ticket";

const TicketDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTicket = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTicket(id);
      setTicket(res.data);
    } catch {
      setError("Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);


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
          Back to My History
        </button>
      </div>
    );
  }

  // Determine status color/label


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
    } catch {
      return "Date Error";
    }
  };

  // Timeline Helper
  const getTimelineSteps = () => {
    if (!ticket) return [];

    // If Rejected, show Submitted -> Rejected
    if (ticket.status === 'rejected') {
      return [
        {
          id: 'submitted',
          label: 'Submitted',
          date: ticket.createdAt,
          completed: true,
          icon: <CheckCircle className="w-6 h-6 text-white" />
        },
        {
          id: 'rejected',
          label: 'Rejected',
          date: ticket.updatedAt,
          completed: true,
          icon: <XCircle className="w-6 h-6 text-white" />
        }
      ];
    }

    // Normal Flow
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
        label: 'Accepted',
        date: ticket?.acceptedAt || null,
        completed: ticket?.status !== 'not_start',
        icon: <Clock className="w-6 h-6 text-white" />
      },
      {
        id: 'completed',
        label: 'Completed',
        date: ticket?.status === 'completed' ? ticket?.updatedAt : null,
        completed: ticket?.status === 'completed',
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
      {/* Standard Header */}
      <MobileHeader className="flex items-center sticky top-0 z-50 lg:hidden shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="text-lg font-bold text-white absolute left-1/2 -translate-x-1/2">
          Ticket Details
        </span>
      </MobileHeader>

      <div className="max-w-md md:max-w-2xl mx-auto px-4 mt-6 pb-6 space-y-6 animate-in fade-in duration-500 relative z-10">

        {/* Ticket Info Card */}
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6 space-y-4">
          {/* Row item helper */}
          {[
            { label: "Ticket ID", value: "#" + ticket?.id, color: "text-blue-600 font-bold" },
            {
              label: "Category",
              value: ticket?.category?.name ? `${ticket.category.name}${ticket.subComponent ? ` (${ticket.subComponent})` : ""}` : "General"
            },
            { label: "Description", value: ticket?.description || "none" },
            { label: "Floor", value: ticket?.room?.floor || "-" },
            { label: "Room", value: ticket?.room?.roomNumber || "-" },
            {
              label: "Priority",
              value: (
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${ticket?.urgency === "High"
                    ? "bg-red-100 text-red-600"
                    : ticket?.urgency === "Medium"
                      ? "bg-orange-100 text-orange-600"
                      : ticket?.urgency === "Low"
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                >
                  {ticket?.urgency || "Medium"}
                </span>
              ),
              isBadge: true
            },
            { label: "Time", value: formatDate(ticket?.createdAt, { hour: '2-digit', minute: '2-digit', hour12: true }) } // e.g. 26-12-2025, 10:30 AM
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-gray-600 font-medium text-[15px]">{item.label}</span>
              {item.isBadge ? (
                item.value
              ) : (
                <span className={`text-right font-bold text-[15px] ${item.color || "text-gray-900"}`}>{item.value}</span>
              )}
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

        {/* Rejection Note */}
        {ticket?.status === 'rejected' && ticket?.note && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3 text-red-700">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm uppercase mb-1">Reason for Rejection</h4>
              <p className="text-sm">{ticket.note}</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <h3 className="font-bold text-[#3B4D68] uppercase text-sm mb-4">TIMELINE</h3>
          <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05)] p-6">
            <div className="space-y-8 relative">
              {/* Vertical Line */}
              <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-gray-200"></div>

              {timelineSteps.map((step) => (
                <div key={step.id} className="flex gap-4 relative z-10 font-sans">
                  {/* Icon Bubble */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-[3px] border-white shadow-sm ring-1 ring-gray-100 ${step.completed ? (step.id === 'rejected' ? 'bg-red-500' : 'bg-green-500') :
                    (step.id === 'accepted' && ticket?.status === 'in_progress') ? 'bg-amber-400' : 'bg-gray-100'
                    }`}>
                    {step.completed ? (step.id === 'rejected' ? <XCircle size={20} className="text-white" /> : <CheckCircle size={20} className="text-white" />) :
                      (step.id === 'accepted' && ticket?.status === 'in_progress') ? <Clock size={20} className="text-white" /> :
                        <div className="w-3 h-3 bg-gray-300 rounded-full"></div>}
                  </div>

                  <div className="pt-0.5">
                    <h4 className={`font-bold text-base ${step.id === 'rejected' ? 'text-red-600' : 'text-gray-900'}`}>{step.label}</h4>
                    {step.date && (
                      <p className="text-gray-400 text-xs mt-1">
                        {formatDate(step.date, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    )}
                    {step.id === 'accepted' && ticket?.status === 'not_start' && (
                      <span className="inline-block bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full mt-2">Waiting</span>
                    )}
                    {step.id === 'completed' && ticket?.status !== 'completed' && ticket?.status !== 'rejected' && (
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
