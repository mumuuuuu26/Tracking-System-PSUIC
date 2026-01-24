import React, { useState, useEffect, useCallback } from "react";
import { Search, Calendar, Edit2, UserPlus, Clock, X, CheckCircle, ArrowLeft, Mail, Briefcase, Trash2, Ticket } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getITStaff } from "../../api/admin"; // removed listAllTickets unused refernece if not needed for this UI
import { updateUser, removeUser, createUser } from "../../api/user"; // Added createUser
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const ITManagement = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState("All");

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

    // Form States
    const [currentMember, setCurrentMember] = useState(null);
    const [inviteForm, setInviteForm] = useState({ email: "", role: "it_support" });
    const [editForm, setEditForm] = useState({ name: "", department: "", phoneNumber: "" });

    const loadData = useCallback(async () => {
        try {
            const staffRes = await getITStaff(token);
            setStaff(staffRes.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load staff data");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleInviteSubmit = async (e) => {
        e.preventDefault();
        try {
            await createUser(token, { ...inviteForm, password: "password123" }); // Default password
            toast.success("User invited successfully");
            setIsInviteModalOpen(false);
            setInviteForm({ email: "", role: "it_support" });
            loadData();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to invite user");
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            await updateUser(token, currentMember.id, editForm);
            toast.success("Staff updated successfully");
            setIsEditModalOpen(false);
            loadData();
        } catch (err) {
            console.error(err);
            toast.error("Failed to update staff");
        }
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Delete Staff",
            text: "Are you sure you want to delete this staff member?",
            showCancelButton: true,
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
            customClass: {
                popup: "rounded-3xl p-6 md:p-8",
                title: "text-xl md:text-2xl font-bold text-gray-900 mb-2",
                htmlContainer: "text-gray-500 text-base",
                confirmButton: "bg-red-500 hover:bg-red-600 text-white min-w-[120px] py-3 rounded-xl font-bold text-sm shadow-sm transition-colors",
                cancelButton: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 min-w-[120px] py-3 rounded-xl font-bold text-sm transition-colors",
                actions: "gap-4 w-full px-4 mt-4"
            },
            buttonsStyling: false
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await removeUser(token, id);
                    toast.success("Staff deleted");
                    loadData();
                } catch (err) {
                    console.error(err);
                    toast.error("Delete failed");
                }
            }
        });
    };

    const openEditModal = (member) => {
        setCurrentMember(member);
        setEditForm({
            name: member.name || "",
            department: member.department || "",
            phoneNumber: member.phoneNumber || ""
        });
        setIsEditModalOpen(true);
    };

    // Filter Logic
    const filteredStaff = staff.filter(member => {
        const matchesSearch = (member.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (member.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());

        let matchesTab = true;
        if (activeTab === "Available") matchesTab = member.status === "Available" || member.status === "Busy";
        if (activeTab === "On leave") matchesTab = member.status === "On Leave";

        return matchesSearch && matchesTab;
    });

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            {/* Header */}
            <div className="bg-[#193C6C] px-6 pt-12 pb-6 shadow-md sticky top-0 z-20">
                <div className="flex items-center gap-4 text-white mb-2">
                    <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-2 -ml-2 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">IT Management</h1>
                </div>
            </div>

            <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto space-y-6">
                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Searching by name or email..."
                        className="w-full pl-4 pr-10 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 shadow-sm text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>

                {/* Tabs & Invite Button */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide w-full sm:w-auto">
                        {["All", "Available", "On leave"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-xl text-sm font-bold whitespace-nowrap border transition-all ${activeTab === tab
                                    ? "bg-[#193C6C] text-white border-[#193C6C] shadow-md"
                                    : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Invite Button */}
                    <button
                        onClick={() => setIsInviteModalOpen(true)}
                        className="bg-[#193C6C] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#15325b] shadow-sm w-full sm:w-auto justify-center"
                    >
                        <UserPlus size={18} /> Invite User
                    </button>
                </div>

                {/* Staff List */}
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
                        Total Users <span className="text-gray-400 ml-1">({filteredStaff.length})</span>
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredStaff.map((member) => (
                            <div key={member.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative group hover:shadow-md transition-all">
                                {/* Status Chip */}
                                <div className={`absolute top-5 right-5 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 ${member.status === 'Available' ? "bg-green-100 text-green-600" :
                                    member.status === 'On Leave' ? "bg-amber-100 text-amber-600" :
                                        member.status === 'Busy' ? "bg-blue-100 text-blue-600" :
                                            "bg-gray-100 text-gray-500"
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full ${member.status === 'Available' ? "bg-green-500" :
                                        member.status === 'On Leave' ? "bg-amber-500" :
                                            member.status === 'Busy' ? "bg-blue-500" :
                                                "bg-gray-400"
                                        }`}></div>
                                    {member.status === 'Busy' ? 'Working' : member.status || "Unknown"}
                                </div>

                                <div className="flex items-center gap-4 mb-4">
                                    {/* Avatar */}
                                    <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                                        {member.picture ? (
                                            <img src={member.picture} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={`https://ui-avatars.com/api/?name=${member.name}&background=random`} alt="" className="w-full h-full object-cover" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{member.name || "No Name"}</h3>
                                        <p className="text-blue-600 text-sm font-bold">{member.department || "IT Support"}</p>
                                    </div>
                                </div>

                                {/* Active Task (If Busy) */}
                                {member.status === 'Busy' && member.currentTicket && (
                                    <div className="mb-4 bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-start gap-3">
                                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600 shrink-0">
                                            <Ticket size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Currently Working On</p>
                                            <p className="text-sm text-gray-700 font-bold truncate">{member.currentTicket.title}</p>
                                            <Link to={`/admin/ticket/${member.currentTicket.id}`} className="text-xs text-slate-400 hover:text-blue-600 transition-colors mt-0.5 inline-block">
                                                Ticket #{member.currentTicket.id}
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="grid grid-cols-[1fr,auto,auto] gap-2">
                                    <button className="flex items-center justify-center gap-2 border border-gray-100 rounded-xl py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
                                        <Calendar size={16} /> View Schedule
                                    </button>
                                    <button
                                        onClick={() => openEditModal(member)}
                                        className="w-10 flex items-center justify-center bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(member.id)}
                                        className="w-10 flex items-center justify-center bg-red-50 rounded-xl text-red-500 hover:bg-red-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredStaff.length === 0 && !loading && (
                        <div className="text-center py-10 text-gray-400">
                            <p>No staff found.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold">Invite New User</h2>
                            <button onClick={() => setIsInviteModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleInviteSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
                                    placeholder="user@psu.ac.th"
                                    value={inviteForm.email}
                                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Role</label>
                                <div className="relative">
                                    <select
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                                        value={inviteForm.role}
                                        onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value })}
                                    >
                                        <option value="user">User</option>
                                        <option value="it_support">IT Support</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-[#193C6C] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#15325b] flex items-center justify-center gap-2">
                                <Mail size={16} /> Send Invitation
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold">Edit Staff</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Name</label>
                                <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
                                <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1">Phone</label>
                                <input type="text" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm" value={editForm.phoneNumber} onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })} />
                            </div>
                            <button type="submit" className="w-full bg-[#193C6C] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#15325b]">Save Changes</button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
};

export default ITManagement;
