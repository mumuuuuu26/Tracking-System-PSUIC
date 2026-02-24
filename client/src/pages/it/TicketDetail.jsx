import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle, Clock, AlertCircle, User, MapPin, Calendar, ArrowLeft, Upload, FileText, Check, X, Ban, CalendarClock, Plus, Trash2, Save, PenTool, ChevronDown } from "lucide-react";

import ITPageHeader from "../../components/it/ITPageHeader";
import ITWrapper from "../../components/it/ITWrapper";
import { getTicket } from "../../api/ticket";
import { acceptJob, closeJob, saveDraft, previewJob, rejectJob } from "../../api/it";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

dayjs.extend(relativeTime);

const TicketDetail = () => {
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

    // Reject Modal State
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [newChecklistInput, setNewChecklistInput] = useState("");

    // Reschedule Modal State REMOVED

    const loadTicket = React.useCallback(async () => {
        try {
            setLoading(true);
            const res = await getTicket(id);
            setTicket(res.data);
            // Pre-fill existing note if available and status is completed (handled in useEffect above partially, but let's keep logic cleaner there)
            if (res.data.status === 'completed') {
                setItNote(res.data.note || "");
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || "Failed to load ticket details");
        } finally {
            setLoading(false);
        }
    }, [id]);

    const loadPreview = React.useCallback(async () => {
        try {
            setLoading(true);
            const res = await previewJob(id);
            setTicket(res.data);
            setLoading(false);
        } catch {
            // Fallback to getTicket if preview fails or for compatibility
            await loadTicket();
        }
    }, [id, loadTicket]);

    useEffect(() => {
        if (id) {
            loadPreview();
        }
    }, [id, loadPreview]);

    useEffect(() => {
        if (ticket) {
            setSelectedStatus(ticket.status);
            // Pre-fill notes and checklist
            if (ticket.note) setItNote(ticket.note);
            if (ticket.checklist) {
                try {
                    const parsed = JSON.parse(ticket.checklist);
                    if (Array.isArray(parsed)) setChecklistItems(parsed);
                } catch {
                    // Checklist JSON is malformed, ignore
                }
            }
        }
    }, [ticket]);



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
        if (ticket.status === 'completed') return; // Read-only if completed
        setChecklistItems(checklistItems.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
        ));
    };

    const removeChecklistItem = (itemId) => {
        setChecklistItems(checklistItems.filter(item => item.id !== itemId));
    };

    const handleSaveDraft = async () => {
        if (ticket.status === 'rejected') return;
        try {
            await saveDraft(id, {
                note: itNote,
                checklist: checklistItems,
                proof: proofImage
            });
            toast.success("Draft saved successfully!");
        } catch {
            toast.error("Failed to save draft");
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return toast.warning("Please provide a reason");
        try {
            await rejectJob(id, rejectReason);
            toast.success("Ticket rejected successfully");
            setShowRejectModal(false);

            // Navigate back to dashboard or reload? Preview mode implies we probably go back to list as it's done.
            // But let's follow accept pattern (stay or reload). Actually reject = closed/completed.
            // Let's go back to dashboard to avoid confusion or reload to show updated state (which is probably restricted access now).
            // Dashboard is safer.
            navigate('/it');
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to reject ticket");
        }
    };

    const handleUpdateStatus = async () => {
        if (!ticket) return;

        // 1. Special Handler for Accept Button Click (If ticket is not_start, the ONLY action is Accept)
        if (ticket.status === 'not_start') {
            try {
                await acceptJob(id);
                toast.success("Job accepted successfully!");
                // Reload with standard loadTicket to get full edit capabilities
                loadTicket();
            } catch (err) {
                toast.error(err.response?.data?.message || "Failed to accept job");
            }
            return;
        }

        if (selectedStatus === ticket.status) {
            return toast.info("No status change detected.");
        }

        // 2. -> Completed
        if (selectedStatus === 'completed') {
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
                text: "Are you sure you want to mark this ticket as completed?",
                icon: "question",
                showCancelButton: true,
                confirmButtonColor: "#2563eb",
                confirmButtonText: "Yes, Complete",
                cancelButtonText: "Back"
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        await closeJob(id, {
                            note: itNote,
                            proof: proofImage,
                            checklist: checklistItems
                        });
                        toast.success("Ticket closed successfully!");
                        loadTicket();
                    } catch {
                        toast.error("Failed to close ticket");
                    }
                }
            });
            return;
        }



        // 4. Fallback / Not Start
        if (selectedStatus === 'not_start') {
            toast.warning("Cannot move ticket back to Not Start manually.");
            setSelectedStatus(ticket.status); // Revert selection
        }
    };


    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0d1b2a]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
    );

    if (!ticket) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0d1b2a] px-4">
            <h2 className="text-xl font-bold text-gray-700 dark:text-white mb-2">Ticket Not Found (ID: {id})</h2>
            <p className="text-gray-500 dark:text-blue-300/70 mb-4 text-center">The ticket may have been deleted or you do not have permission to view it.</p>
            <button onClick={() => navigate("/it/tickets")} className="text-blue-600 dark:text-blue-400 hover:underline">Back to All Tickets</button>
        </div>
    );

    const steps = [
        { label: "NOT START", status: "not_start", active: true },
        { label: "IN PROGRESS", status: "in_progress", active: ["in_progress", "completed", "rejected"].includes(ticket.status) },
        { label: "COMPLETED", status: "completed", active: ["completed"].includes(ticket.status) },
        { label: "REJECTED", status: "rejected", active: ["rejected"].includes(ticket.status) }
    ].filter(s => ticket.status === 'rejected' ? s.status !== 'completed' : s.status !== 'rejected');

    const getUrgencyBadge = (urgency) => {
        switch (urgency) {
            case "High": return "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300";
            case "Medium": return "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-300";
            case "Low": return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300";
            default: return "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300";
        }
    };

    // Helper for Select Indicator Color
    const getSelectStatusColor = (status) => {
        switch (status) {
            case 'not_start': return 'bg-emerald-400';
            case 'in_progress': return 'bg-yellow-400';
            case 'completed': return 'bg-blue-500';
            case 'rejected': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    return (
        <ITWrapper>
            <div className="min-h-screen bg-gray-50 dark:bg-[#0d1b2a] pb-24 text-gray-900 dark:text-white">
                {/* Mobile Header */}
                <ITPageHeader title="Ticket Details" />

                <div className="max-w-4xl mx-auto mt-6">
                    {/* Header with Back Button - HIDDEN on Mobile as ITPageHeader takes over */}
                    <div className="px-6 pb-4 hidden lg:block">
                        <div className="flex items-center justify-between mb-2">
                            <button onClick={() => navigate("/it/tickets")} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors">
                                <ArrowLeft className="text-blue-600 dark:text-blue-400" strokeWidth={3} size={24} />
                            </button>
                            <div className="text-center">
                                <h1 className="text-lg font-bold text-blue-600 dark:text-blue-400">#TK-{String(ticket.id).padStart(2, '0')}</h1>
                                <p className="text-xs text-gray-500 dark:text-blue-300/70">{dayjs(ticket.createdAt).format('MMM D, YYYY')}</p>
                            </div>
                            <div className="w-10"></div>
                        </div>
                    </div>

                    {/* Status Pipeline - Redesigned for Lines */}
                    <div className="mt-6 mb-8">
                        <div className="relative flex items-center justify-between px-8 z-0">
                            {/* Background Line */}
                            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 dark:bg-blue-900/40 -z-10 mx-10"></div>

                            {/* Active Line (Progress) */}
                            <div
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#1e2e4a] -z-10 mx-10 transition-all duration-500"
                                style={{
                                    width: ticket.status === 'completed' || ticket.status === 'rejected' ? 'calc(100% - 5rem)' : ticket.status === 'in_progress' ? '50%' : '0%',
                                    backgroundColor: ticket.status === 'rejected' ? '#ef4444' : '#1e2e4a'
                                }}
                            ></div>

                            {steps.map((step, idx) => (
                                <div key={idx} className="bg-white dark:bg-[#0d1b2a] p-1 rounded-full"> {/* White background wrapper to hide line behind dot */}
                                    <div className={`w-6 h-6 rounded-full border-[3px] transition-colors ${step.active ? (ticket.status === 'rejected' ? 'bg-red-500 border-red-500' : 'bg-[#1e2e4a] dark:bg-blue-500 dark:border-blue-500 border-[#1e2e4a]') : 'bg-white dark:bg-[#0d1b2a] border-gray-300 dark:border-blue-800/40'}`}></div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between px-4 mt-2">
                            {steps.map((step, idx) => (
                                <span key={idx} className={`text-[10px] font-bold tracking-wider uppercase w-20 text-center ${step.active ? (ticket.status === 'rejected' ? 'text-red-500 dark:text-red-400' : 'text-[#1e2e4a] dark:text-blue-300') : 'text-gray-400 dark:text-blue-300/50'}`}>
                                    {step.label}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="px-6 space-y-6">
                        {/* User & Ticket Info Card */}
                        <div className="bg-white dark:bg-[#1a2f4e] rounded-3xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-lg border border-gray-100 dark:border-blue-800/30 p-6">
                            <div className="flex items-start justify-between mb-6 gap-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden shrink-0">
                                        {ticket.createdBy?.picture ? (
                                            <img src={ticket.createdBy.picture} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-red-500 dark:text-red-300 font-bold text-xl">
                                                {ticket.createdBy?.name?.[0] || 'U'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="font-bold text-gray-900 dark:text-white text-lg truncate">{ticket.createdBy?.name || ticket.createdBy?.username || ticket.createdBy?.email || "Unknown User"}</h2>
                                        <p className="text-gray-400 dark:text-blue-300/60 text-sm capitalize truncate">{ticket.createdBy?.role || "User"}</p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase shrink-0 ${getUrgencyBadge(ticket.urgency)}`}>
                                    {ticket.urgency}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] font-bold text-blue-500 dark:text-blue-300 uppercase tracking-widest block mb-0.5">Location</label>
                                    <p className="font-bold text-gray-800 dark:text-white text-sm">Floor {ticket.room?.floor}, {ticket.room?.roomNumber}</p>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <label className="text-[10px] font-bold text-blue-500 dark:text-blue-300 uppercase tracking-widest block mb-0.5">Category</label>
                                        <p className="font-bold text-gray-800 dark:text-white text-sm">
                                            {ticket.category?.name || "General"}
                                            {ticket.subComponent ? ` (${ticket.subComponent})` : ""}
                                        </p>
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-blue-300/60">{dayjs(ticket.createdAt).format('D MMM YY, HH:mm A')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 uppercase text-sm tracking-wide">Description</h3>
                            <div className="bg-white dark:bg-[#1a2f4e] rounded-3xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-lg border border-gray-100 dark:border-blue-800/30 p-6 mb-8">
                                <p className="text-gray-600 dark:text-blue-200/90 text-sm leading-relaxed mb-4">
                                    {ticket.description}
                                </p>
                                {(ticket.images && ticket.images.filter(img => img.type === 'before').length > 0) && (
                                    <div className="mt-4 pt-4 border-t border-gray-50 dark:border-blue-800/30">
                                        <p className="text-xs text-blue-500 dark:text-blue-300 font-bold uppercase tracking-wide mb-3">Attachments</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {ticket.images.filter(img => img.type === 'before').map((img, index) => (
                                                <div key={index} className="rounded-2xl overflow-hidden border border-gray-100 dark:border-blue-800/40 relative group aspect-[4/3] shadow-sm cursor-pointer" onClick={() => window.open(img.url, '_blank')}>
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
                        <div className={`${(ticket.status === 'not_start' && selectedStatus !== 'completed') ? 'hidden' : ''} transition-opacity`}>

                            {/* Checklist */}
                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 uppercase text-sm tracking-wide flex items-center justify-between">
                                <span>Checklist</span>
                                <span className="text-xs text-gray-400 dark:text-blue-300/60 lowercase font-normal">{checklistItems.filter(i => i.checked).length}/{checklistItems.length} completed</span>
                            </h3>
                            <div className="bg-white dark:bg-[#1a2f4e] rounded-3xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-lg border border-gray-100 dark:border-blue-800/30 p-6 mb-8">
                                <div className="space-y-3 mb-4">
                                    {checklistItems.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3 group">
                                            <button
                                                onClick={() => toggleChecklistItem(item.id)}
                                                className={`transition-colors flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center ${item.checked ? 'bg-blue-500 border-blue-500' : 'bg-white dark:bg-[#0d1b2a] border-gray-300 dark:border-blue-800/40 hover:border-blue-400 dark:hover:border-blue-500'}`}
                                                disabled={ticket.status === 'completed'}
                                            >
                                                {item.checked && <Check size={14} className="text-white" strokeWidth={3} />}
                                            </button>
                                            <span className={`flex-1 text-sm font-medium transition-all ${item.checked ? 'text-gray-400 dark:text-blue-300/40 line-through' : 'text-gray-700 dark:text-blue-100'}`}>
                                                {item.text}
                                            </span>
                                            {ticket.status !== 'completed' && (
                                                <button
                                                    onClick={() => removeChecklistItem(item.id)}
                                                    className="text-gray-300 dark:text-blue-300/40 hover:text-red-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {checklistItems.length === 0 && (
                                        <p className="text-sm text-gray-400 dark:text-blue-300/50 italic text-center py-2">No items in checklist.</p>
                                    )}
                                </div>

                                {ticket.status !== 'completed' && (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 bg-gray-50 dark:bg-[#0d1b2a] border border-transparent dark:border-blue-800/40 rounded-xl px-4 py-2 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-blue-300/50 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none"
                                            placeholder="Add new checklist item..."
                                            value={newChecklistInput}
                                            onChange={(e) => setNewChecklistInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                                        />
                                        <button
                                            onClick={addChecklistItem}
                                            className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 p-2 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <h3 className="font-bold text-gray-900 dark:text-white mb-3 uppercase text-sm tracking-wide">IT Notes & Proof</h3>
                            <div className="bg-white dark:bg-[#1a2f4e] rounded-3xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-lg border border-gray-100 dark:border-blue-800/30 p-6 mb-8">

                                {(selectedStatus === 'completed' || ticket.status === 'in_progress') && ticket.status !== 'rejected' ? (
                                    <>
                                        <textarea
                                            className="w-full bg-gray-50 dark:bg-[#0d1b2a] border border-transparent dark:border-blue-800/40 rounded-xl p-4 text-sm text-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-blue-300/50 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none resize-none h-32 mb-4"
                                            placeholder="Describe the solution or diagnosis..."
                                            value={itNote}
                                            onChange={(e) => setItNote(e.target.value)}
                                            disabled={ticket.status === 'completed'}
                                        ></textarea>

                                        {ticket.status !== 'completed' && (
                                            <div className="flex flex-col gap-4">
                                                <label className="block w-full bg-gray-50 dark:bg-[#0d1b2a] hover:bg-gray-100 dark:hover:bg-blue-900/20 border border-dashed border-gray-300 dark:border-blue-800/40 rounded-2xl p-6 text-center cursor-pointer transition-colors shadow-sm dark:shadow-none">
                                                    {proofImage ? (
                                                        <div className="relative h-48 rounded-2xl overflow-hidden">
                                                            <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center text-white font-bold backdrop-blur-[2px]">Click to change</div>
                                                        </div>
                                                    ) : (
                                                        <div className="py-4">
                                                            <Upload className="mx-auto text-blue-500 dark:text-blue-400 mb-2" size={32} strokeWidth={2.5} />
                                                            <span className="text-sm font-bold text-gray-500 dark:text-blue-300/70">Upload Proof of Fix</span>
                                                        </div>
                                                    )}
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleProofUpload} />
                                                </label>
                                            </div>
                                        )}
                                    </>
                                ) : null}

                                {/* Display existing notes if completed */}
                                {(ticket.status === 'completed' || ticket.status === 'rejected') && (
                                    <div className="space-y-3">
                                        <div className={`p-4 rounded-xl border text-sm ${ticket.status === 'completed' ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/40 text-green-800 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800/40 text-red-800 dark:text-red-300'}`}>
                                            <span className="font-bold block mb-1">{ticket.status === 'rejected' ? 'Rejection Reason:' : 'Diagnosis / Notes:'}</span>
                                            {ticket.note ? ticket.note.replace('REJECTED: ', '') : "No notes provided."}
                                        </div>
                                        {ticket.proof && (
                                            <div className="rounded-xl overflow-hidden border border-gray-100 dark:border-blue-800/40 mt-2">
                                                <p className="text-xs text-gray-500 dark:text-blue-300/60 mb-1 px-1">Proof of fix:</p>
                                                <img src={ticket.proof} alt="Proof" className="w-full h-40 object-cover" />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {(ticket.status === 'not_start' && selectedStatus === 'not_start') && (
                                    <p className="text-sm text-gray-400 dark:text-blue-300/50 italic text-center py-4">Accept the job to add notes.</p>
                                )}
                            </div>
                        </div>

                        {/* Save Draft Button - Moved outside the card for consistency */}
                        {ticket.status === 'in_progress' && (
                            <button
                                onClick={handleSaveDraft}
                                className="w-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 font-bold py-4 rounded-3xl hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition flex items-center justify-center gap-2 border border-indigo-100 dark:border-indigo-800/40 shadow-sm dark:shadow-none"
                            >
                                <Save size={18} />
                                Save Draft
                            </button>
                        )}

                        {/* Status Section - Moved inside for consistent spacing */}
                        {(ticket.status !== 'not_start' && ticket.status !== 'rejected') && (
                            <div className="">
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3 uppercase text-sm tracking-wide">Status</h3>

                                <div className="bg-white dark:bg-[#1a2f4e] rounded-3xl shadow-[0_2px_20px_-5px_rgba(0,0,0,0.1)] dark:shadow-lg border border-gray-100 dark:border-blue-800/30 p-6 mb-6">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => !(ticket.status === 'completed') && setIsStatusOpen(!isStatusOpen)}
                                            className={`w-full bg-gray-50 dark:bg-[#0d1b2a] font-bold text-gray-700 dark:text-white py-4 pl-4 pr-10 rounded-2xl border border-gray-200 dark:border-blue-800/40 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/30 flex items-center justify-between transition-all ${ticket.status === 'completed' ? 'bg-gray-100 dark:bg-blue-900/20 cursor-not-allowed opacity-75' : 'cursor-pointer hover:border-blue-300 dark:hover:border-blue-600'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${getSelectStatusColor(selectedStatus)}`}></div>
                                                <span>
                                                    {selectedStatus === 'not_start' && "Not Start"}
                                                    {selectedStatus === 'in_progress' && "In Progress"}
                                                    {selectedStatus === 'completed' && "Completed"}
                                                    {!selectedStatus && "Select Status"}
                                                </span>
                                            </div>
                                            <ChevronDown size={20} className={`text-gray-400 dark:text-blue-300/60 transition-transform duration-200 ${isStatusOpen ? "rotate-180" : ""}`} />
                                        </button>

                                        {isStatusOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-full bg-white dark:bg-[#1a2f4e] border border-gray-100 dark:border-blue-800/40 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                <div className="p-2 flex flex-col gap-1">
                                                    {[
                                                        { value: 'not_start', label: 'Not Start' },
                                                        { value: 'in_progress', label: 'In Progress' },
                                                        { value: 'completed', label: 'Completed' }
                                                    ].map((option) => (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedStatus(option.value);
                                                                setIsStatusOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center gap-3 group ${selectedStatus === option.value ? "bg-gray-100 dark:bg-blue-900/30 text-gray-900 dark:text-white font-bold" : "text-gray-600 dark:text-blue-300/80 hover:bg-gray-50 dark:hover:bg-blue-900/20"}`}
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

                                {!(ticket.status === 'completed') && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => navigate(-1)} className="bg-gray-100 dark:bg-blue-900/20 text-gray-600 dark:text-blue-200 font-bold py-4 rounded-3xl hover:bg-gray-200 dark:hover:bg-blue-900/30 transition">
                                            Back
                                        </button>
                                        <button
                                            onClick={handleUpdateStatus}
                                            className="bg-[#193C6C] dark:bg-blue-600 text-white font-bold py-4 rounded-3xl shadow-lg shadow-blue-100 dark:shadow-blue-900/30 hover:opacity-90 transition flex items-center justify-center gap-2"
                                        >
                                            {selectedStatus === 'completed' ? 'Complete Job' : 'Update'}
                                        </button>
                                    </div>
                                )}

                                {(ticket.status === 'completed' || ticket.status === 'rejected') && (
                                    <div className="">
                                        <button onClick={() => navigate(-1)} className="w-full bg-gray-100 dark:bg-blue-900/20 text-gray-600 dark:text-blue-200 font-bold py-4 rounded-3xl hover:bg-gray-200 dark:hover:bg-blue-900/30 transition">
                                            Back to Tickets
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Show Accept Button ONLY if Not Start (Preview Mode) */}
                        {ticket.status === 'not_start' && (
                            <div className="mt-6 flex flex-col items-center">
                                <div className="flex gap-4 w-full justify-center">
                                    <button
                                        onClick={handleUpdateStatus}
                                        className="flex-1 bg-[#193C6C] dark:bg-blue-600 text-white font-bold py-4 rounded-3xl shadow-lg shadow-blue-100 dark:shadow-blue-900/30 hover:opacity-90 transition text-base"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        className="flex-1 bg-white dark:bg-red-900/20 text-red-500 dark:text-red-300 border border-red-200 dark:border-red-800/40 font-bold py-4 rounded-3xl hover:bg-red-50 dark:hover:bg-red-900/30 transition text-base"
                                    >
                                        Reject
                                    </button>
                                </div>
                                <p className="text-center text-gray-400 dark:text-blue-300/60 text-xs mt-3">
                                    You are in <strong>Read-Only Preview Mode</strong>. Accept to start or Reject to decline.
                                </p>
                            </div>
                        )}
                    </div>

                    {
                        showRejectModal && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                                <div className="bg-white dark:bg-[#1a2f4e] rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-blue-800/40">
                                    <h3 className="text-xl font-bold mb-2 text-center text-gray-800 dark:text-white">Reject Ticket?</h3>
                                    <p className="text-gray-500 dark:text-blue-300/70 text-center mb-4 text-sm leading-relaxed">
                                        Please provide a reason for <br className="hidden sm:block" /> rejecting this ticket.
                                    </p>
                                    <textarea
                                        className="w-full bg-gray-50 dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 rounded-xl p-3 text-sm text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-blue-300/50 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30 outline-none mb-4"
                                        rows="3"
                                        placeholder="Reason for rejection..."
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                    ></textarea>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowRejectModal(false)}
                                            className="flex-1 bg-gray-100 dark:bg-blue-900/20 text-gray-700 dark:text-blue-200 py-3 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-blue-900/30 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleReject}
                                            className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 dark:shadow-red-900/30 transition"
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>
        </ITWrapper >
    );
};

export default TicketDetail;
