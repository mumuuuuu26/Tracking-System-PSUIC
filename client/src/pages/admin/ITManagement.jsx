import React, { useState, useEffect, useCallback } from "react";
import { Search, Calendar, Edit2, UserCheck, UserX, Clock, X, Phone, Briefcase, Trash2, CheckCircle, AlertCircle, Shield, History } from "lucide-react";
import { Link } from "react-router-dom";
import { getITStaff, getITStaffStats, listAllTickets, updateTicketStatus } from "../../api/admin";
import { updateUser, removeUser } from "../../api/user";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";

const ITManagement = () => {
    const { token } = useAuthStore();
    const [staff, setStaff] = useState([]);
    const [stats, setStats] = useState({ active: 0, onLeave: 0, busy: 0, available: 0 });
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

    const loadData = useCallback(async () => {
        try {
            const [staffRes, statsRes] = await Promise.all([
                getITStaff(token),
                getITStaffStats(token)
            ]);
            setStaff(staffRes.data);

            // Calculate stats manually if API doesn't return full details
            const active = staffRes.data.length;
            const busy = staffRes.data.filter(s => s.status === 'Busy').length;
            const available = staffRes.data.filter(s => s.status === 'Available').length;

            setStats({
                active,
                onLeave: statsRes.data.onLeave || 0,
                busy,
                available
            });
        } catch (err) {
            console.log(err);
            toast.error("Failed to load staff data");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleEditClick = (member) => {
        setCurrentStaffId(member.id);
        setFormData({
            name: member.name || "",
            department: member.department || "IT Support",
            phoneNumber: member.phoneNumber || "",
            role: "it_support"
        });
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (id) => {
        if (window.confirm("Are you sure you want to PERMANENTLY delete this staff member?")) {
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
        try {
            const res = await listAllTickets(token);
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
            loadData();
        } catch (err) {
            console.log(err);
            toast.error("Failed to update staff");
        }
    };

    const filteredStaff = staff.filter(member =>
    (member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 pt-8 pb-6 px-4 mb-8 sticky top-0 z-20 bg-opacity-90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">IT Staff Management</h1>
                            <p className="text-gray-500 text-sm mt-1">Manage support team, assignments, and availability</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                                    <UserCheck size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">Total</span>
                                    <span className="text-sm font-bold text-gray-800 leading-none mt-1">{stats.active}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <div className="p-1.5 bg-green-50 text-green-600 rounded-md">
                                    <CheckCircle size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">Free</span>
                                    <span className="text-sm font-bold text-gray-800 leading-none mt-1">{stats.available}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                                <div className="p-1.5 bg-blue-50 text-[#193C6C] rounded-md">
                                    <Briefcase size={16} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 leading-none">Busy</span>
                                    <span className="text-sm font-bold text-gray-800 leading-none mt-1">{stats.busy}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search staff by name or email..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Staff Grid */}
            <div className="max-w-7xl mx-auto px-4">
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-48 bg-white rounded-2xl animate-pulse"></div>)}
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UserCheck className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No staff found</h3>
                        <p className="text-gray-400 text-sm">Try adjusting your search</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredStaff.map((member) => (
                            <div key={member.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1 h-full ${member.status === 'Available' ? 'bg-emerald-500' : 'bg-[#193C6C]'}`}></div>

                                <div className="flex justify-between items-start mb-4 pl-3">
                                    <div className="flex gap-4">
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-500 overflow-hidden border-2 border-white shadow-sm">
                                                {member.picture ? (
                                                    <img src={member.picture} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    member.name?.[0] || 'S'
                                                )}
                                            </div>
                                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${member.status === 'Available' ? 'bg-emerald-500' : 'bg-[#193C6C]'
                                                }`}>
                                                {member.status === 'Available' ? <CheckCircle size={10} className="text-white" /> : <Clock size={10} className="text-white" />}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg leading-tight">{member.name || "No Name"}</h3>
                                            <p className="text-xs text-gray-500 mb-1">{member.email}</p>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-md uppercase tracking-wide">
                                                    {member.department || "IT Support"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <button
                                            onClick={() => handleEditClick(member)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="Edit Profile"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <Link
                                            to={`/admin/tickets?search=${member.name}`}
                                            className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all flex items-center justify-center"
                                            title="View History / All Tickets"
                                        >
                                            <History size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteClick(member.id)}
                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="pl-3 mt-4 pt-4 border-t border-gray-100">
                                    {member.status === 'Busy' && member.currentTicket ? (
                                        <div className="bg-white rounded-xl p-3 border border-blue-200 shadow-sm relative overflow-hidden group-hover:border-blue-300 transition-colors">
                                            <div className="absolute left-0 top-0 w-1 h-full bg-[#193C6C]"></div>
                                            <div className="flex items-center gap-2 mb-2 text-[#193C6C] pl-2">
                                                <Clock size={14} />
                                                <span className="text-xs font-bold uppercase">Working on</span>
                                            </div>
                                            <p className="text-sm font-bold text-gray-800 line-clamp-1 mb-2 pl-2">#{member.currentTicket.id} {member.currentTicket.title}</p>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded-xl p-3 border border-emerald-200 shadow-sm relative overflow-hidden group-hover:border-emerald-300 transition-colors">
                                            <div className="absolute left-0 top-0 w-1 h-full bg-emerald-400"></div>
                                            <div className="flex items-center gap-2 mb-2 text-emerald-600 pl-2">
                                                <CheckCircle size={14} />
                                                <span className="text-xs font-bold uppercase">Available</span>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-3 pl-2">Ready for task</p>
                                            <button
                                                onClick={() => handleAssignClick(member)}
                                                className="w-full py-2 bg-white text-emerald-600 border border-emerald-200 text-xs font-bold rounded-lg hover:bg-emerald-50 transition-all"
                                            >
                                                + Assign Task
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Edit Staff Profile</h2>
                                <p className="text-gray-500 text-xs">Update information for this staff member</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Department</label>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">Phone Number</label>
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
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
                    <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Assign Task</h2>
                                <p className="text-gray-500 text-xs">Select a pending ticket for <span className="font-bold text-blue-600">{assignStaff?.name}</span></p>
                            </div>
                            <button
                                onClick={() => setIsAssignModalOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {pendingTickets.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                                    <CheckCircle className="text-green-500" size={24} />
                                </div>
                                <p className="text-gray-900 font-bold text-sm">All caught up!</p>
                                <p className="text-gray-400 text-xs">No pending tickets available to assign.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleAssignSubmit}>
                                <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar mb-4">
                                    {pendingTickets.map(ticket => (
                                        <label key={ticket.id} className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all ${selectedTicketId == ticket.id
                                            ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500'
                                            : 'bg-white border-gray-100 hover:bg-gray-50 hover:border-gray-200'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="ticket"
                                                value={ticket.id}
                                                onChange={(e) => setSelectedTicketId(e.target.value)}
                                                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-gray-800 text-sm truncate">#{ticket.id} {ticket.title}</span>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${ticket.urgency === 'High' ? 'bg-red-100 text-red-700' :
                                                        ticket.urgency === 'Medium' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-green-100 text-green-700'
                                                        }`}>
                                                        {ticket.urgency || "Normal"}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mb-2 line-clamp-2">{ticket.description}</p>
                                                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                                                    <span className="flex items-center gap-1"><Briefcase size={10} /> {ticket.room?.roomNumber || "No Room"}</span>
                                                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
