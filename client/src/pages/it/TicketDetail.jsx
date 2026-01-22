import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Clock, AlertCircle, User, MapPin, Calendar, ArrowLeft, Upload, FileText, Check, X, Ban, CalendarClock, Plus, Trash2, Save, PenTool, ChevronDown } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { getTicket } from "../../api/ticket";
import { acceptJob, closeJob, rejectTicket, saveDraft } from "../../api/it";
import { requestReschedule } from "../../api/appointment";
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
    const [isStatusOpen, setIsStatusOpen] = useState(false);

    // Checklist State
    const [checklistItems, setChecklistItems] = useState([]); // [{id: 1, text: "Check Power", checked: false}]
    const [newChecklistInput, setNewChecklistInput] = useState("");

    // Reschedule Modal State REMOVED

    useEffect(() => {
        loadTicket();
    }, [id, token]);

    useEffect(() => {
        if (ticket) {
            setSelectedStatus(ticket.status);
            // Pre-fill notes and checklist
            if (ticket.note) setItNote(ticket.note);
            if (ticket.checklist) {
                try {
                    const parsed = JSON.parse(ticket.checklist);
                    if (Array.isArray(parsed)) setChecklistItems(parsed);
                } catch (e) {
                    console.error("Failed to parse checklist JSON", e);
                }
            }
        }
    }, [ticket]);

    const loadTicket = async () => {
        try {
            setLoading(true);
            const res = await getTicket(token, id);
            setTicket(res.data);
            // Pre-fill existing note if available and status is fixed/rejected (handled in useEffect above partially, but let's keep logic cleaner there)
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

    // Checklist Handlers
    const addChecklistItem = () => {
        if (!newChecklistInput.trim()) return;
        const newItem = {
            id: Date.now(),
            text: newChecklistInput,
            checked: false
        };
        setChecklistItems([...checklistItems, newItem]);
        setNewChecklistInput("");
    };

    const toggleChecklistItem = (itemId) => {
        if (ticket.status === 'fixed') return; // Read-only if fixed
        setChecklistItems(checklistItems.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
        ));
    };

    const removeChecklistItem = (itemId) => {
        setChecklistItems(checklistItems.filter(item => item.id !== itemId));
    };

    const handleSaveDraft = async () => {
        try {
            await saveDraft(token, id, {
                note: itNote,
                checklist: checklistItems,
                proof: proofImage
            });
            toast.success("Draft saved successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save draft");
        }
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

            // Check if all checklist items are checked (Optional warning)
            const unchecked = checklistItems.filter(i => !i.checked).length;
            if (unchecked > 0) {
                const proceed = await Swal.fire({
                    title: "Unfinished Checklist",
                    text: `You have ${unchecked} unchecked items. Complete anyway?`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Yes, Complete",
                });
                if (!proceed.isConfirmed) return;
            }

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
                        await closeJob(token, id, {
                            note: itNote,
                            proof: proofImage,
                            checklist: checklistItems
                        });
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
            case "Low": return "bg-blue-100 text-blue-600 border border-blue-200";
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
                                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-0.5">Category</label>
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

                {/* Checklist & IT Notes Section */}
                <div className={`${(ticket.status === 'pending' && selectedStatus !== 'fixed') || selectedStatus === 'rejected' ? 'hidden' : ''} transition-opacity`}>

                    {/* Checklist */}
                    <h3 className="font-bold text-gray-900 mb-3 uppercase text-sm tracking-wide flex items-center justify-between">
                        <span>Checklist</span>
                        <span className="text-xs text-gray-400 lowercase font-normal">{checklistItems.filter(i => i.checked).length}/{checklistItems.length} completed</span>
                    </h3>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm mb-6">
                        <div className="space-y-3 mb-4">
                            {checklistItems.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 group">
                                    <button
                                        onClick={() => toggleChecklistItem(item.id)}
                                        className={`transition-colors flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center ${item.checked ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300 hover:border-blue-400'}`}
                                        disabled={ticket.status === 'fixed'}
                                    >
                                        {item.checked && <Check size={14} className="text-white" strokeWidth={3} />}
                                    </button>
                                    <span className={`flex-1 text-sm font-medium transition-all ${item.checked ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                        {item.text}
                                    </span>
                                    {ticket.status !== 'fixed' && (
                                        <button
                                            onClick={() => removeChecklistItem(item.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {checklistItems.length === 0 && (
                                <p className="text-sm text-gray-400 italic text-center py-2">No items in checklist.</p>
                            )}
                        </div>

                        {ticket.status !== 'fixed' && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 bg-gray-50 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                                    placeholder="Add new checklist item..."
                                    value={newChecklistInput}
                                    onChange={(e) => setNewChecklistInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                                />
                                <button
                                    onClick={addChecklistItem}
                                    className="bg-blue-100 text-blue-600 p-2 rounded-xl hover:bg-blue-200 transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        )}
                    </div>

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
                                    <div className="flex flex-col gap-4">
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

                                        {/* Save Draft Button */}
                                        <button
                                            onClick={handleSaveDraft}
                                            className="w-full bg-indigo-50 text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-100 transition flex items-center justify-center gap-2 border border-indigo-100"
                                        >
                                            <Save size={18} />
                                            Save Draft
                                        </button>
                                    </div>
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
                            <button
                                type="button"
                                onClick={() => !(ticket.status === 'fixed' || ticket.status === 'rejected') && setIsStatusOpen(!isStatusOpen)}
                                className={`w-full bg-white font-bold text-gray-700 py-4 pl-4 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 flex items-center justify-between transition-all ${ticket.status === 'fixed' || ticket.status === 'rejected' ? 'bg-gray-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-300'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${getSelectStatusColor(selectedStatus)}`}></div>
                                    <span>
                                        {selectedStatus === 'pending' && "Pending"}
                                        {selectedStatus === 'in_progress' && "In Progress"}
                                        {selectedStatus === 'fixed' && "Completed"}
                                        {selectedStatus === 'rejected' && "Rejected"}
                                        {!selectedStatus && "Select Status"}
                                    </span>
                                </div>
                                <ChevronDown size={20} className={`text-gray-400 transition-transform duration-200 ${isStatusOpen ? "rotate-180" : ""}`} />
                            </button>

                            {isStatusOpen && (
                                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    <div className="p-2 flex flex-col gap-1">
                                        {[
                                            { value: 'pending', label: 'Pending' },
                                            { value: 'in_progress', label: 'In Progress' },
                                            { value: 'fixed', label: 'Completed' },
                                            { value: 'rejected', label: 'Rejected' }
                                        ].map((option) => (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedStatus(option.value);
                                                    setIsStatusOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3 group ${selectedStatus === option.value ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${getSelectStatusColor(option.value)}`}></div>
                                                <span>{option.label}</span>
                                                {selectedStatus === option.value && <Check size={16} className="ml-auto text-blue-600" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
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
                                {selectedStatus === 'fixed' ? 'Complete Job' : 'Update Status'}
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


                {/* Appointment Info & Reschedule */}
                {ticket.appointment && (selectedStatus !== 'fixed' && selectedStatus !== 'rejected') && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 relative overflow-hidden mb-8">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-blue-100 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                        <div className="relative z-10 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-blue-900 text-sm flex items-center gap-2">
                                    <CalendarClock size={16} /> Current Appointment
                                </h3>
                                <p className="text-blue-800 font-bold text-lg mt-1">
                                    {dayjs(ticket.appointment.scheduledAt).format('D MMM YYYY, HH:mm')}
                                </p>
                                {ticket.appointment.status === 'reschedule_requested' && (
                                    <span className="inline-block mt-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                        Reschedule Requested
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => navigate(`/it/ticket/${id}/reschedule`)}
                                className="bg-white text-blue-600 px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-blue-50 transition-colors border border-blue-100"
                            >
                                Reschedule
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};

export default TicketDetail;
