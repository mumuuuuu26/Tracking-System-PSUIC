
import React, { useState, useEffect } from "react";
import { Search, Calendar, Edit2, UserCheck, UserX, Clock, X, Phone, Briefcase, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { getITStaff, getITStaffStats, listAllTickets, updateTicketStatus } from "../../api/admin";
import { updateUser, removeUser } from "../../api/user";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";

const ITManagement = () => {
    const { token } = useAuthStore();
    const [staff, setStaff] = useState([]);
    const [stats, setStats] = useState({ active: 0, onLeave: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Edit Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStaffId, setCurrentStaffId] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        department: "IT Support",
        phoneNumber: "",
        role: "it_support"
    });

    // Assign Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignStaff, setAssignStaff] = useState(null);
    const [pendingTickets, setPendingTickets] = useState([]);
    const [selectedTicketId, setSelectedTicketId] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [staffRes, statsRes] = await Promise.all([
                getITStaff(token),
                getITStaffStats(token)
            ]);
            setStaff(staffRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.log(err);
            toast.error("Failed to load staff data");
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (member) => {
        setCurrentStaffId(member.id);
        setFormData({
            name: member.name || "",
            department: member.department || "IT Support",
            phoneNumber: member.phoneNumber || "",
            role: "it_support" // Keep role as it_support
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm("Are you sure you want to delete this staff member?")) {
            try {
                await removeUser(token, id);
                toast.success("Staff deleted successfully");
                loadData();
            } catch (err) {
                console.log(err);
                toast.error("Failed to delete staff");
            }
        }
    };

    const handleAssignClick = async (member) => {
        setAssignStaff(member);
        // Load pending tickets
        try {
            const res = await listAllTickets(token);
            // Filter unassigned and pending tickets
            const pending = res.data.filter(t => t.status === "pending" && !t.assignedToId);
            setPendingTickets(pending);
            setIsAssignModalOpen(true);
        } catch (err) {
            console.log(err);
            toast.error("Failed to load tickets");
        }
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();
        if (!selectedTicketId) return toast.error("Please select a ticket");

        try {
            // Assign ticket: update assignedToId and set status to in_progress
            await updateTicketStatus(token, selectedTicketId, {
                assignedToId: assignStaff.id,
                status: "in_progress"
            });
            toast.success(`Ticket assigned to ${assignStaff.name} `);
            setIsAssignModalOpen(false);
            loadData();
        } catch (err) {
            console.log(err);
            toast.error("Failed to assign ticket");
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateUser(token, currentStaffId, formData);
            toast.success("Staff updated successfully");
            setIsModalOpen(false);
            loadData(); // Refresh list
        } catch (err) {
            console.log(err);
            toast.error("Failed to update staff");
        }
    };

    const filteredStaff = staff.filter(member =>
    (member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const activeCount = stats.active;
    const leaveCount = stats.onLeave;

    return (
        <div className="space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-lg text-white flex items-center justify-between col-span-1 md:col-span-3">
                    <div>
                        <p className="text-blue-100 text-sm font-medium mb-1">Total Active Details</p>
                        <h3 className="text-4xl font-bold">{activeCount} Staff Members</h3>
                        <p className="text-blue-100/80 text-sm mt-2 flex items-center gap-2">
                            <UserCheck size={16} /> Online and ready for tasks
                        </p>
                    </div>
                    <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                        <Briefcase size={32} className="text-white" />
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">

                {/* Search */}
                <div className="relative flex-1 max-w-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search staff by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    />
                </div>

                {/* Status Filter (Optional - visual only if not implemented logic for pills yet, but we keep it simple) */}
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Available
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Busy
                    </div>
                </div>
            </div>

            {/* Staff List Grid */}
            <div className="grid grid-cols-1 gap-4">
                {filteredStaff.map((member) => (
                    <div key={member.id} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group">
                        <div className="flex flex-col md:flex-row items-center md:items-startGap-6 gap-6">

                            {/* Avatar */}
                            <div className="relative">
                                <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden shadow-sm">
                                    {member.picture ? (
                                        <img src={member.picture} alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <UserCheck size={32} />
                                        </div>
                                    )}
                                </div>
                                <div className={`absolute -bottom-2 -right-2 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm border-2 border-white ${member.status === 'Available' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                    }`}>
                                    {member.status}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 w-full text-center md:text-left">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800 mb-1">{member.name || member.email}</h3>
                                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-500 text-sm">
                                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                                <Briefcase size={14} className="text-blue-500" />
                                                {member.department || "IT Specialist"}
                                            </span>
                                            {member.phoneNumber && (
                                                <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                                                    <Phone size={14} className="text-blue-500" />
                                                    {member.phoneNumber}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 mt-4 md:mt-0 justify-center">
                                        <button
                                            onClick={() => handleEditClick(member)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                            title="Edit Staff"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(member.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                            title="Delete Staff"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Current Task / Status Area */}
                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                    {member.status === 'Busy' && member.currentTicket ? (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                                    <Clock size={16} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Current Task</p>
                                                    <p className="font-medium text-gray-800 text-sm">#{member.currentTicket.id} - {member.currentTicket.title}</p>
                                                </div>
                                            </div>
                                            <Link
                                                to={`/it/ticket/${member.currentTicket.id}`}
                                                className="px-4 py-2 bg-white border border-gray-200 text-xs font-semibold rounded-lg hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm"
                                            >
                                                View Ticket
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                                    <UserCheck size={16} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Status</p>
                                                    <p className="font-medium text-green-600 text-sm">Ready for new assignment</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAssignClick(member)}
                                                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                                            >
                                                <Edit2 size={12} /> Assign Task
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Edit Staff</h2>
                                <p className="text-gray-500 text-sm">Update profile information</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-gray-700"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-gray-700"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-gray-700"
                                    placeholder="e.g. 081-234-5678"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 mt-2"
                            >
                                Save Changes
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Task Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl transform transition-all scale-100">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Assign Task</h2>
                                <p className="text-gray-500 text-sm">Assign ticket to <span className="font-semibold text-blue-600">{assignStaff?.name}</span></p>
                            </div>
                            <button
                                onClick={() => setIsAssignModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {pendingTickets.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-400 font-medium">No pending tickets available</p>
                            </div>
                        ) : (
                            <form onSubmit={handleAssignSubmit} className="space-y-4">
                                <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                    {pendingTickets.map(ticket => (
                                        <label key={ticket.id} className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition-all ${selectedTicketId == ticket.id
                                                ? 'bg-blue-50 border-blue-500 shadow-sm'
                                                : 'bg-white border-gray-100 hover:bg-gray-50'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="ticket"
                                                value={ticket.id}
                                                onChange={(e) => setSelectedTicketId(e.target.value)}
                                                className="mt-1.5 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-gray-800">#{ticket.id} {ticket.title}</span>
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                                        {ticket.urgency || "Normal"}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mb-2 line-clamp-2">{ticket.description}</p>
                                                <div className="flex items-center gap-3 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1"><Briefcase size={12} /> {ticket.room?.roomNumber || "No Room"}</span>
                                                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!selectedTicketId}
                                >
                                    Assign Selected Ticket
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ITManagement;

