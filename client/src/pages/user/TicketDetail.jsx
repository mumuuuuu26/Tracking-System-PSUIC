// client/src/pages/user/TicketDetail.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Clock, AlertCircle, Calendar, XCircle } from "lucide-react";
import { getTicket } from "../../api/ticket";
import useAuthStore from "../../store/auth-store";

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

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "fixed": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "scheduled": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending": return "Pending";
      case "in_progress": return "In Progress";
      case "fixed": return "Completed";
      case "rejected": return "Rejected";
      case "scheduled": return "Scheduled";
      default: return status;
    }
  };

  // Helper to find specific images
  const beforeImage = ticket.images?.find(img => img.type === "before")?.url;
  const afterImage = ticket.images?.find(img => img.type === "after")?.url;

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/user/my-tickets")}
          className="text-blue-600 font-medium flex items-center gap-1"
        >
          ← Back
        </button>
        <h1 className="font-semibold text-lg">Ticket Details</h1>
        <div className="w-8"></div> {/* Spacer for centering */}
      </div>

      {/* Content Container */}
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Status Pipeline / Progress Bar (Mobile/Desktop friendly) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 -z-10 rounded-full"></div>
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 -z-10 rounded-full transition-all duration-700"
              style={{ width: ticket.status === 'fixed' ? '100%' : ticket.status === 'in_progress' ? '50%' : '0%' }}
            ></div>

            {['pending', 'in_progress', 'fixed'].map((step, idx) => {
              const isActive =
                (step === 'pending') ||
                (step === 'in_progress' && ['in_progress', 'fixed'].includes(ticket.status)) ||
                (step === 'fixed' && ticket.status === 'fixed');

              const isRejected = ticket.status === 'rejected';

              // Icons based on step
              const stepIcon = step === 'pending' ? '1' : step === 'in_progress' ? '2' : '3';
              const stepLabel = step === 'pending' ? 'Open' : step === 'in_progress' ? 'Processing' : 'Done';

              return (
                <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${isActive ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-300 text-gray-400'
                    } ${isRejected ? 'opacity-50 grayscale' : ''}`}>
                    {isActive ? <CheckCircle size={16} /> : stepIcon}
                  </div>
                  <span className={`text-xs font-semibold ${isActive ? 'text-blue-700' : 'text-gray-400'}`}>{stepLabel}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Info Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Card Header */}
          <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                #{ticket.id} <span className="text-gray-400 font-normal">|</span> {ticket.title}
              </h2>
              <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                <Clock size={14} />
                Submitted on {new Date(ticket.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm whitespace-nowrap text-center ${getStatusColor(ticket.status)}`}>
              {getStatusLabel(ticket.status)}
            </span>
          </div>

          {/* Card Body */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Details */}
            <div className="space-y-6">

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Issue Description</label>
                <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {ticket.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Category</label>
                  <div className="font-semibold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    {ticket.category?.name || "General"}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">Priority</label>
                  <div className={`font-semibold flex items-center gap-2 ${ticket.urgency === 'High' ? 'text-red-600' :
                    ticket.urgency === 'Medium' ? 'text-orange-500' : 'text-green-600'
                    }`}>
                    {ticket.urgency}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Location & Equipment */}
            <div className="space-y-6">
              <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-50 space-y-4">
                <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                  <div className="w-1 h-4 bg-blue-500 rounded-full"></div> Detail Info
                </h4>

                <div className="grid grid-cols-1 gap-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                    <span className="text-gray-500 text-xs">Room</span>
                    <span className="font-bold text-gray-800">{ticket.room?.roomNumber || "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                    <span className="text-gray-500 text-xs">Equipment</span>
                    <span className="font-bold text-gray-800">{ticket.equipment?.name || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Rejection / Schedule Alert */}
        {ticket.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Ticket Rejected</h3>
                <p className="text-sm text-red-700">{ticket.rejectedReason || "No reason provided."}</p>
                {ticket.rejectedAt && (
                  <p className="text-xs text-red-500 mt-2">
                    Rejected on {new Date(ticket.rejectedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Appointment Info */}
        {ticket.appointment && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <Calendar className="text-purple-500 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="font-semibold text-purple-800 mb-1">Scheduled Appointment</h3>
                <p className="text-sm text-purple-700">
                  IT Support has scheduled a visit for: <br />
                  <span className="font-bold">
                    {new Date(ticket.appointment.scheduledAt).toLocaleString()}
                  </span>
                </p>
                {ticket.appointment.note && (
                  <p className="text-xs text-purple-600 mt-2 italic">
                    Note: {ticket.appointment.note}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Timeline / Update History */}
        <div className="bg-white rounded-xl p-5 shadow-sm mb-4 border border-gray-100">
          <h3 className="font-semibold mb-4 text-gray-800 border-b pb-2">Update History</h3>

          <div className="space-y-6">
            {ticket.logs?.length > 0 ? (
              ticket.logs.map((log, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${index === 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                      {index === 0 ? <Clock size={16} /> : <div className="w-2 h-2 bg-gray-400 rounded-full" />}
                    </div>
                    {index < ticket.logs.length - 1 && (
                      <div className="w-0.5 h-full bg-gray-200 my-1"></div>
                    )}
                  </div>
                  <div className="pb-2">
                    <p className="text-sm font-medium text-gray-900">{log.action}</p>
                    <p className="text-xs text-gray-500 mb-1">{log.detail}</p>
                    <span className="text-[10px] text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))) : (
              <p className="text-sm text-gray-500 text-center py-4">No updates yet.</p>
            )}
          </div>
        </div>

        {/* Before/After Photos */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-6 text-gray-800 flex items-center gap-2">
            Photos
            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Click to enlarge</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Before Image */}
            <div className="flex flex-col gap-3">
              <div
                className="bg-gray-100 rounded-2xl aspect-[4/3] flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm relative group cursor-pointer"
                onClick={() => beforeImage && window.open(beforeImage, '_blank')}
              >
                {beforeImage ? (
                  <>
                    <img
                      src={beforeImage}
                      alt="Before"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">
                        View Fullsize
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xl">📷</span>
                    </div>
                    <span className="text-xs font-medium">No before image</span>
                  </div>
                )}
              </div>
              <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest">Before</p>
            </div>

            {/* After Image */}
            <div className="flex flex-col gap-3">
              <div
                className="bg-gray-100 rounded-2xl aspect-[4/3] flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm relative group cursor-pointer"
                onClick={() => afterImage && window.open(afterImage, '_blank')}
              >
                {afterImage ? (
                  <>
                    <img
                      src={afterImage}
                      alt="After"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">
                        View Fullsize
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                    {ticket.status === 'fixed' ? (
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xl">🚫</span>
                        </div>
                        <span className="text-xs font-medium">No proof provided</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-400 flex items-center justify-center animate-pulse">
                          <Clock size={24} />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-gray-500 block">Pending</span>
                          <span className="text-[10px] text-gray-400">Waiting for staff to complete</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-widest">After</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
