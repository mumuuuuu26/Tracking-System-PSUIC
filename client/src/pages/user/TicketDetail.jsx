// client/src/pages/user/TicketDetail.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Clock, AlertCircle, Calendar, XCircle, ArrowLeft } from "lucide-react";
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
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d1b2a] flex items-center justify-center transition-colors">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d1b2a] p-4 flex flex-col items-center justify-center transition-colors">
        <p className="text-red-600 dark:text-red-400 mb-4">{error || "Ticket not found"}</p>
        <button
          onClick={() => navigate("/user/history")}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
        >
          Back to History
        </button>
      </div>
    );
  }

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

  const getTimelineSteps = () => {
    if (!ticket) return [];

    if (ticket.status === 'rejected') {
      return [
        {
          id: 'submitted',
          label: 'Submitted',
          date: ticket.createdAt,
          completed: true,
          icon: <CheckCircle className="w-5 h-5 text-white" />
        },
        {
          id: 'rejected',
          label: 'Rejected',
          date: ticket.updatedAt,
          completed: true,
          icon: <XCircle className="w-5 h-5 text-white" />
        }
      ];
    }

    return [
      {
        id: 'submitted',
        label: 'Submitted',
        date: ticket?.createdAt,
        completed: true,
        icon: <CheckCircle className="w-5 h-5 text-white" />
      },
      {
        id: 'accepted',
        label: 'Accepted',
        date: ticket?.acceptedAt || null,
        completed: ticket?.status !== 'not_start',
        icon: <Clock className="w-5 h-5 text-white" />
      },
      {
        id: 'completed',
        label: 'Completed',
        date: ticket?.status === 'completed' ? ticket?.updatedAt : null,
        completed: ticket?.status === 'completed',
        icon: <CheckCircle className="w-5 h-5 text-white" />
      }
    ];
  };

  const timelineSteps = getTimelineSteps();
  const beforeImage = ticket?.images?.find(img => img.type === "before")?.url;
  const afterImage = ticket?.images?.find(img => img.type === "after")?.url;
  const shouldShowItNotesAndProof = ticket?.status === "completed" && Boolean(ticket?.note || ticket?.proof);
  const resolvedNote = ticket?.note ? ticket.note.replace(/^REJECTED:\s*/i, "") : "";

  return (
    <div className="bg-gray-50 dark:bg-[#0d1b2a] pb-20 font-sans text-gray-900 dark:text-white min-h-screen">

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 lg:hidden px-0">
        <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 dark:from-[#0d1b2a] dark:via-[#193C6C] dark:to-[#0d1b2a] border-b border-transparent dark:border-white/10 shadow-sm dark:shadow-none px-5 py-4 flex items-center rounded-b-[2rem]">
          <button
            onClick={() => navigate(-1)}
            className="text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-base font-bold text-white absolute left-1/2 -translate-x-1/2 tracking-wide truncate max-w-[200px]">
            Ticket #{ticket.id}
          </h1>
        </div>
      </div>

      <div className="max-w-md md:max-w-2xl mx-auto px-4 mt-6 pb-6 space-y-5 animate-in fade-in duration-500 relative z-10">

        {/* Ticket Info Card */}
        <div className="bg-white dark:bg-[#1a2f4e] rounded-2xl border border-gray-200 dark:border-blue-800/30 p-5 space-y-3 shadow-sm dark:shadow-none transition-colors">
          {[
            { label: "Ticket ID", value: "#" + ticket?.id, color: "text-blue-600 dark:text-blue-300 font-bold" },
            {
              label: "Category",
              value: ticket?.category?.name
                ? `${ticket.category.name}${ticket.subComponent ? ` (${ticket.subComponent})` : ""}`
                : "General"
            },
            { label: "Description", value: ticket?.description || "none" },
            { label: "Floor", value: ticket?.room?.floor || "-" },
            { label: "Room", value: ticket?.room?.roomNumber || "-" },
            {
              label: "Priority",
              value: (
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${ticket?.urgency === "High"
                    ? "bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-600/50"
                    : ticket?.urgency === "Medium"
                      ? "bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-600/50"
                      : ticket?.urgency === "Low"
                        ? "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-600/50"
                        : "bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-600/50"
                    }`}
                >
                  {ticket?.urgency || "Medium"}
                </span>
              ),
              isBadge: true
            },
            { label: "Time", value: formatDate(ticket?.createdAt, { hour: '2-digit', minute: '2-digit', hour12: true }) }
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-center border-b border-gray-100 dark:border-blue-800/20 last:border-0 pb-3 last:pb-0">
              <span className="text-gray-500 dark:text-blue-400/70 font-medium text-sm">{item.label}</span>
              {item.isBadge ? (
                item.value
              ) : (
                <span className={`text-right font-semibold text-sm ${item.color || "text-gray-900 dark:text-white"}`}>{item.value}</span>
              )}
            </div>
          ))}
        </div>

        {/* Status Bar */}
        <div className="bg-blue-600 dark:bg-[#193C6C] rounded-xl px-5 py-4 flex justify-between items-center shadow-lg border border-blue-400 dark:border-blue-500/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-1.5 rounded-lg">
              <AlertCircle size={18} className="text-white" />
            </div>
            <span className="font-bold text-white">Status</span>
          </div>
          <span className="font-bold text-white capitalize bg-white/10 px-4 py-1.5 rounded-lg text-sm">
            {ticket?.status ? ticket.status.replace("_", " ") : "Unknown"}
          </span>
        </div>

        {/* Rejection Note */}
        {ticket?.status === 'rejected' && ticket?.note && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-xl p-4 flex items-start gap-3 text-red-600 dark:text-red-300 transition-colors">
            <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm uppercase mb-1">Reason for Rejection</h4>
              <p className="text-sm opacity-90">{ticket.note}</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div>
          <h3 className="font-bold text-gray-500 dark:text-blue-300/80 uppercase text-xs tracking-wider mb-4">Timeline</h3>
          <div className="bg-white dark:bg-[#1a2f4e] rounded-2xl border border-gray-200 dark:border-blue-800/30 p-5 shadow-sm dark:shadow-none transition-colors">
            <div className="space-y-7 relative z-0">
              {/* Vertical Line */}
              <div className="absolute left-[19px] top-5 bottom-5 w-[3px] bg-blue-200 dark:bg-blue-400/50 rounded-full z-[-1]"></div>

              {timelineSteps.map((step) => (
                <div key={step.id} className="flex gap-4 relative z-10">
                  {/* Icon Bubble */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 ${step.completed
                      ? step.id === 'rejected'
                        ? 'bg-red-600 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                        : 'bg-emerald-600 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                      : (step.id === 'accepted' && ticket?.status === 'in_progress')
                        ? 'bg-amber-500 border-amber-400/50'
                        : 'bg-gray-50 dark:bg-[#0d1b2a] border-blue-200 dark:border-blue-700/50'
                      }`}
                  >
                    {step.completed
                      ? (step.id === 'rejected' ? <XCircle size={18} className="text-white" /> : <CheckCircle size={18} className="text-white" />)
                      : (step.id === 'accepted' && ticket?.status === 'in_progress')
                        ? <Clock size={18} className="text-white" />
                        : <div className="w-2.5 h-2.5 bg-blue-300 dark:bg-blue-700 rounded-full"></div>
                    }
                  </div>

                  <div className="pt-1">
                    <h4 className={`font-bold text-sm ${step.id === 'rejected' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{step.label}</h4>
                    {step.date && (
                      <p className="text-gray-400 dark:text-blue-400/60 text-xs mt-0.5">
                        {formatDate(step.date, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                      </p>
                    )}
                    {step.id === 'accepted' && ticket?.status === 'not_start' && (
                      <span className="inline-block bg-blue-100 dark:bg-blue-700/50 text-blue-600 dark:text-blue-300 text-[10px] font-bold px-3 py-1 rounded-full mt-2 border border-blue-200 dark:border-blue-600/40">Waiting</span>
                    )}
                    {step.id === 'completed' && ticket?.status !== 'completed' && ticket?.status !== 'rejected' && (
                      <p className="text-xs text-gray-400 dark:text-blue-400/40 mt-0.5">Pending resolution</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* IT Notes & Proof */}
        {shouldShowItNotesAndProof && (
          <div>
            <h3 className="font-bold text-gray-500 dark:text-blue-300/80 text-xs tracking-wider uppercase mb-4">
              IT Notes & Proof
            </h3>
            <div className="bg-white dark:bg-[#1a2f4e] rounded-2xl border border-gray-200 dark:border-blue-800/30 p-4 shadow-sm dark:shadow-none transition-colors space-y-4">
              <div className="rounded-xl bg-gray-50 dark:bg-[#0d1b2a] border border-gray-100 dark:border-blue-800/30 p-3">
                <p className="text-[11px] tracking-wider uppercase text-blue-600 dark:text-blue-300/80 font-semibold mb-2">
                  IT Notes
                </p>
                <p className="text-sm text-gray-700 dark:text-blue-100 leading-relaxed">
                  {resolvedNote || "No IT notes provided."}
                </p>
              </div>

              {ticket?.proof && (
                <div>
                  <p className="text-[11px] tracking-wider uppercase text-blue-600 dark:text-blue-300/80 font-semibold mb-2">
                    Proof Image
                  </p>
                  <div className="rounded-2xl overflow-hidden border border-blue-100 dark:border-blue-800/30 bg-gray-50 dark:bg-[#0d1b2a]">
                    <img
                      src={ticket.proof}
                      alt="IT proof of fix"
                      className="w-full h-48 object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Photos */}
        <div>
          <h3 className="font-bold text-gray-500 dark:text-blue-300/80 text-xs tracking-wider uppercase mb-4">Photos</h3>
          <div className="bg-white dark:bg-[#1a2f4e] rounded-2xl border border-gray-200 dark:border-blue-800/30 p-4 shadow-sm dark:shadow-none transition-colors">
            <div className="grid grid-cols-2 gap-4">
              {/* Before */}
              <div className="relative rounded-2xl overflow-hidden aspect-square bg-gray-50 dark:bg-[#0d1b2a] border border-blue-100 dark:border-blue-800/30 transition-colors">
                {beforeImage ? (
                  <img src={beforeImage} className="w-full h-full object-cover" alt="Before" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-blue-400/80">
                    <Calendar size={20} className="mb-2 opacity-50" />
                    <span className="text-[10px] font-bold uppercase opacity-50">No Image</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white font-bold px-3 py-0.5 rounded-full backdrop-blur-sm text-[10px] uppercase tracking-wider">BEFORE</div>
              </div>

              {/* After */}
              <div className="relative rounded-2xl overflow-hidden aspect-square bg-gray-50 dark:bg-[#0d1b2a] border border-blue-100 dark:border-blue-800/30 transition-colors">
                {afterImage ? (
                  <img src={afterImage} className="w-full h-full object-cover" alt="After" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-blue-400/80">
                    <Calendar size={20} className="mb-2 opacity-50" />
                    <span className="text-[10px] font-bold uppercase opacity-50">No Photo</span>
                  </div>
                )}
                {afterImage && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white font-bold px-3 py-0.5 rounded-full backdrop-blur-sm text-[10px] uppercase tracking-wider">AFTER</div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TicketDetail;
