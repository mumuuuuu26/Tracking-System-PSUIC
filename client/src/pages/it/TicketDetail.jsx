import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Clock, AlertCircle, User, MapPin, Calendar, ArrowLeft, Upload, FileText, Check, X, Ban } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { getTicket } from "../../api/ticket";
import { acceptJob, closeJob, rejectTicket } from "../../api/it";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

dayjs.extend(relativeTime);

const TicketDetail = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);

    // Technician Action States
    const [itNote, setItNote] = useState("");
    const [proofImage, setProofImage] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState("");

    useEffect(() => {
        loadTicket();
    }, [id, token]);

    useEffect(() => {
        if (ticket) {
            setSelectedStatus(ticket.status);
        }
    }, [ticket]);

    const loadTicket = async () => {
        try {
            setLoading(true);
            const res = await getTicket(token, id);
            setTicket(res.data);
            // Pre-fill existing note if available and status is fixed/rejected
            if (res.data.status === 'fixed' || res.data.status === 'rejected') {
                setItNote(res.data.note || (res.data.rejectedReason ? res.data.rejectedReason.split(':')[1]?.trim() : "") || "");
            }
        } catch (err) {
            console.error("Failed to load ticket:", err);
            toast.error("Failed to load ticket details");
        } finally {
            setLoading(false);
        }
    };

    const handleProofUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            return toast.error("Image too large (max 5MB)");
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            setProofImage(reader.result);
        };
    };

    const handleUpdateStatus = async () => {
        if (!ticket) return;

        if (selectedStatus === ticket.status) {
            return toast.info("No status change detected.");
        }

        // 1. Pending -> In Progress (Accept)
        if (selectedStatus === 'in_progress') {
            try {
                await acceptJob(token, id);
                toast.success("Job accepted successfully!");
                loadTicket();
            } catch (err) {
                console.error(err);
                toast.error("Failed to accept job");
            }
            return;
        }

        // 2. -> Completed (Fixed)
        if (selectedStatus === 'fixed') {
            if (!itNote.trim()) return toast.warning("Please add some internal notes of diagnosis.");

            Swal.fire({
                title: "Complete Job?",
                text: "Are you sure you want to mark this ticket as fixed?",
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#2563eb",
                confirmButtonText: "Yes, Complete",
                cancelButtonText: "Back"
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await closeJob(token, id, { note: itNote, proof: proofImage });
                        toast.success("Ticket closed successfully!");
                        loadTicket();
                    } catch (err) {
                        console.error(err);
                        toast.error("Failed to close ticket");
                    }
                }
            });
            return;
        }

        // 3. -> Rejected
        if (selectedStatus === 'rejected') {
            Swal.fire({
                title: "Reject Ticket",
                text: "Please provide a reason for rejection:",
                input: "text",
                inputPlaceholder: "Reason...",
                showCancelButton: true,
                confirmButtonColor: "#ef4444",
                confirmButtonText: "Reject",
                preConfirm: (reason) => {
                    if (!reason) {
                        Swal.showValidationMessage('Reason is required');
                    }
                    return reason;
                }
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await rejectTicket(token, id, { note: result.value });
                        toast.success("Ticket rejected");
                        loadTicket();
                    } catch (err) {
                        console.error(err);
                        toast.error("Failed to reject ticket");
                    }
                }
            });
            return;
        }

        // 4. Fallback / Pending
        if (selectedStatus === 'pending') {
            toast.warning("Cannot move ticket back to Pending manually.");
            setSelectedStatus(ticket.status); // Revert selection
        }
    };


    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    if (!ticket) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <h2 className="text-xl font-bold text-gray-700 mb-2">Ticket Not Found</h2>
            <button onClick={() => navigate("/it/tickets")} className="text-blue-500 hover:underline">Back to All Tickets</button>
        </div>
    );

    const steps = [
        { label: "OPEN", status: "pending", active: true },
        { label: "WORKING", status: "in_progress", active: ["in_progress", "fixed", "rejected"].includes(ticket.status) },
        { label: "DONE", status: "fixed", active: ["fixed", "rejected"].includes(ticket.status) }
    ];

    const getUrgencyBadge = (urgency) => {
        switch (urgency) {
            case "Critical": return "bg-red-100 text-red-600 border border-red-200";
            case "High": return "bg-orange-100 text-orange-600 border border-orange-200";
            case "Medium": return "bg-yellow-100 text-yellow-600 border border-yellow-200";
            default: return "bg-green-100 text-green-600 border border-green-200";
        }
    };

    // Helper for Select Indicator Color
    const getSelectStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-emerald-400';
            case 'in_progress': return 'bg-yellow-400';
            case 'fixed': return 'bg-blue-500';
            case 'rejected': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="min-h-screen bg-white pb-24">
            {/* Header with Back Button */}
            <div className="px-6 pt-8 pb-4">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={() => navigate("/it/tickets")} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="text-blue-600" strokeWidth={3} size={24} />
                    </button>
                    <div className="text-center">
                        <h1 className="text-lg font-bold text-blue-600">#TK-{String(ticket.id).padStart(2, '0')}</h1>
                        <p className="text-xs text-gray-500">{dayjs(ticket.createdAt).format('MMM D, YYYY')}</p>
                    </div>
                    <div className="w-10"></div>
                </div>

                {/* Status Pipeline */}
                <div className="flex items-center justify-between px-8 mt-6 mb-8 relative">
                    <div className="absolute top-3 left-12 right-12 h-1 bg-gray-200 -z-10"></div>
                    <div className={`absolute top-3 left-12 right-12 h-1 bg-blue-700 transition-all duration-500 -z-10`} style={{
                        width: ticket.status === 'fixed' || ticket.status === 'rejected' ? '80%' : ticket.status === 'in_progress' ? '50%' : '0%'
                    }}></div>

                    {steps.map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-2">
                            <div className={`w-7 h-7 rounded-full border-4 transition-colors ${step.active ? 'bg-blue-700 border-blue-700' : 'bg-gray-200 border-gray-200'}`}></div>
                            <span className={`text-[10px] font-bold tracking-wider ${step.active ? 'text-blue-700' : 'text-gray-400'}`}>{step.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="px-6 space-y-6">
                {/* User & Ticket Info Card */}
                <div className="bg-white rounded-3xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] border border-gray-100 p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-red-100 rounded-full overflow-hidden">
                                {ticket.createdBy?.picture ? (
                                    <img src={ticket.createdBy.picture} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-red-500 font-bold text-xl">
                                        {ticket.createdBy?.name?.[0] || 'U'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-900 text-lg">{ticket.createdBy?.name || ticket.createdBy?.username || ticket.createdBy?.email || "Unknown User"}</h2>
                                <p className="text-gray-400 text-sm capitalize">{ticket.createdBy?.role || "User"}</p>
                            </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getUrgencyBadge(ticket.urgency)}`}>
                            {ticket.urgency}
                        </span>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-0.5">Location</label>
                            <p className="font-bold text-gray-800 text-sm">Floor {ticket.room?.floor}, {ticket.room?.roomNumber}</p>
                        </div>
                        <div className="flex justify-between items-end">
                            <div>
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-0.5">Equipment Type</label>
                                <p className="font-bold text-gray-800 text-sm">{ticket.category?.name || "General"}</p>
                            </div>
                            <span className="text-xs text-gray-400">{dayjs(ticket.createdAt).format('D MMM YY, HH:mm A')}</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <h3 className="font-bold text-gray-900 mb-3 uppercase text-sm tracking-wide">Description</h3>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <p className="text-gray-600 text-sm leading-relaxed mb-4">
                            {ticket.description}
                        </p>
                        {(ticket.images && ticket.images.filter(img => img.type === 'before').length > 0) && (
                            <div className="mt-4 pt-4 border-t border-gray-50">
                                <p className="text-xs text-blue-500 font-bold uppercase tracking-wide mb-3">Attachments</p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {ticket.images.filter(img => img.type === 'before').map((img, index) => (
                                        <div key={index} className="rounded-2xl overflow-hidden border border-gray-100 relative group aspect-[4/3] shadow-sm cursor-pointer" onClick={() => window.open(img.url, '_blank')}>
                                            <img
                                                src={img.url}
                                                alt={`Attachment ${index + 1}`}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* IT Notes Section - Visible when Completing or In Progress */}
                <div className={`${(ticket.status === 'pending' && selectedStatus !== 'fixed') || selectedStatus === 'rejected' ? 'opacity-50 hidden' : ''} transition-opacity`}>
                    <h3 className="font-bold text-gray-900 mb-3 uppercase text-sm tracking-wide">IT Notes & Proof</h3>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">

                        {(selectedStatus === 'fixed' || ticket.status === 'in_progress') && selectedStatus !== 'rejected' ? (
                            <>
                                <textarea
                                    className="w-full bg-gray-50 border-0 rounded-xl p-4 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-100 outline-none resize-none h-32 mb-4"
                                    placeholder="Describe the solution or diagnosis..."
                                    value={itNote}
                                    onChange={(e) => setItNote(e.target.value)}
                                    disabled={ticket.status === 'fixed'}
                                ></textarea>

                                {ticket.status !== 'fixed' && (
                                    <label className="block w-full bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer transition-colors">
                                        {proofImage ? (
                                            <div className="relative h-40 rounded-lg overflow-hidden">
                                                <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-medium">Click to change</div>
                                            </div>
                                        ) : (
                                            <div className="py-4">
                                                <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                                                <span className="text-sm font-bold text-gray-500">Upload Proof of Fix</span>
                                            </div>
                                        )}
                                        <input type="file" className="hidden" accept="image/*" onChange={handleProofUpload} />
                                    </label>
                                )}
                            </>
                        ) : null}

                        {/* Display existing notes if fixed/rejected */}
                        {(ticket.status === 'fixed' || ticket.status === 'rejected') && (
                            <div className="space-y-3">
                                <div className={`p-4 rounded-xl border text-sm ${ticket.status === 'fixed' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                                    <span className="font-bold block mb-1">{ticket.status === 'fixed' ? 'Diagnosis / Notes:' : 'Rejection Reason:'}</span>
                                    {ticket.note || (ticket.rejectedReason ? ticket.rejectedReason.split(':')[1] : null) || "No notes provided."}
                                </div>
                                {ticket.proof && (
                                    <div className="rounded-xl overflow-hidden border border-gray-100 mt-2">
                                        <p className="text-xs text-gray-500 mb-1 px-1">Proof of fix:</p>
                                        <img src={ticket.proof} alt="Proof" className="w-full h-40 object-cover" />
                                    </div>
                                )}
                            </div>
                        )}

                        {(ticket.status === 'pending' && selectedStatus === 'pending') && (
                            <p className="text-sm text-gray-400 italic text-center py-4">Accept the job to add notes.</p>
                        )}
                    </div>
                </div>

                {/* Status Dropdoen & Update */}
                <div className="pb-8">
                    <h3 className="font-bold text-gray-900 mb-3 uppercase text-sm tracking-wide">Status</h3>

                    <div className="bg-white rounded-2xl border border-gray-100 p-2">
                        <div className="relative">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full appearance-none bg-white font-bold text-gray-700 py-4 pl-4 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                disabled={ticket.status === 'fixed' || ticket.status === 'rejected'}
                            >
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="fixed">Completed</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                <div className={`w-3 h-3 rounded-full ${getSelectStatusColor(selectedStatus)}`}></div>
                                <div className="text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {!(ticket.status === 'fixed' || ticket.status === 'rejected') && (
                        <div className="grid grid-cols-3 gap-3 mt-4">
                            <button onClick={() => navigate(-1)} className="col-span-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl hover:bg-gray-200 transition">
                                Back
                            </button>
                            <button
                                onClick={handleUpdateStatus}
                                className="col-span-2 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                {selectedStatus === 'fixed' ? 'Completed' : 'Update'}
                            </button>
                        </div>
                    )}

                    {(ticket.status === 'fixed' || ticket.status === 'rejected') && (
                        <div className="mt-4">
                            <button onClick={() => navigate(-1)} className="w-full bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl hover:bg-gray-200 transition">
                                Back to Tickets
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TicketDetail;
