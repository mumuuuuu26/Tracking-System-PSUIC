import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, Edit2, Trash2, ArrowLeft, Mail, Shield, User, GraduationCap, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { listUsers, changeStatus, removeUser, createUser, changeRole } from "../../api/user";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const UserManagement = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add User State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });

  // Edit Role State
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      let roleParam = "all";

      // Map tabs to roles
      if (activeTab === "User") roleParam = "user";
      if (activeTab === "Staff") roleParam = "it_support";
      if (activeTab === "Admin") roleParam = "admin";

      const res = await listUsers(token, { role: roleParam });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token, activeTab]);

  useEffect(() => {
    loadUsers();
    setCurrentPage(1);
  }, [loadUsers]);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      await changeStatus(token, { id, enabled: !currentStatus });
      toast.success(currentStatus ? "User Disabled" : "User Enabled");
      loadUsers();
    } catch {
      toast.error("Status Update Failed");
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Delete User",
      text: "This action cannot be undone. All user data will be permanently removed.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-3xl p-6 md:p-8",
        title: "text-xl md:text-2xl font-bold text-gray-900 mb-2",
        htmlContainer: "text-gray-500 text-base",
        confirmButton: "bg-red-500 hover:bg-red-600 text-white min-w-[120px] py-3 rounded-xl font-bold text-sm shadow-sm transition-colors",
        cancelButton: "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 min-w-[120px] py-3 rounded-xl font-bold text-sm transition-colors",
        actions: "gap-4 w-full px-4 mt-4"
      },
      buttonsStyling: false
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await removeUser(token, id);
          toast.success("User Deleted");
          loadUsers();
        } catch {
          toast.error("Delete Failed");
        }
      }
    });
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      if (!addUserForm.name || !addUserForm.email || !addUserForm.password) {
        return toast.error("Please fill in all required fields");
      }
      await createUser(token, addUserForm);
      toast.success("User Added Successfully");
      setIsAddModalOpen(false);
      setAddUserForm({ name: "", email: "", password: "", role: "user" });
      loadUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to add user");
    }
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    try {
      await changeRole(token, { id: selectedUser.id, role: newRole });
      toast.success("Role Updated Successfully");
      setIsEditRoleModalOpen(false);
      loadUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update role");
    }
  };

  // Filter Logic (Search + Tab Refinement if needed)
  const filteredUsers = users.filter((u) => {
    // Search Filter
    const matchesSearch = (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());

    // Extra Tab Logic (e.g. if Students and Lecturers share 'user' role but differ by some other field)
    // For now, simple role mapping verified in loadUsers is primary.
    // If we want "Lecturers" to show nothing for now (since we don't know how to distinguish):
    // Extra Tab Logic
    if (activeTab === "Lecturers" && u.role !== 'lecturer') return false; // Legacy check, can likely be removed if tab is gone

    return matchesSearch;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'it_support': return 'Staff';
      default: return 'User';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-blue-900';
      case 'it_support': return 'text-blue-700';
      default: return 'text-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Header */}
      {/* Header */}
      <div className="bg-[#193C6C] px-6 pt-12 pb-6 shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center gap-4 text-white hover:text-gray-100 transition-colors">
          <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-2 -ml-2 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">User Management</h1>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto space-y-6">
        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Searching by name or email..."
            className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-gray-700 font-medium placeholder:text-gray-400 text-sm h-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {["All", "User", "Staff", "Admin"].map((tab) => (
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

        {/* Total Users Count & Add Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            Total Users <span className="text-gray-400 ml-1">({filteredUsers.length})</span>
          </h2>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#193C6C] text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-[#15325b] shadow-sm">
            <Plus size={16} /> Add
          </button>
        </div>

        {/* User Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedUsers.map((user) => (
            <div key={user.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm relative group hover:shadow-md transition-all">

              {/* Status Badge */}
              <span className={`absolute top-5 right-5 text-[10px] font-bold px-2 py-1 rounded-full ${user.enabled ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                }`}>
                {user.enabled ? "Active" : "Disabled"}
              </span>

              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                  {user.picture ? (
                    <img src={user.picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 truncate">{user.name || user.username || "No Name"}</h3>
                  <p className={`text-sm font-bold ${getRoleColor(user.role)} mb-0.5`}>
                    {getRoleLabel(user.role)}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-50">
                <button
                  onClick={() => handleStatusToggle(user.id, user.enabled)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Status"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setNewRole(user.role);
                    setIsEditRoleModalOpen(true);
                  }}
                  className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Change Role"
                >
                  <Shield size={18} />
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete User"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && !loading && (
            <div className="col-span-full text-center py-10 text-gray-400">
              <p>No users found matching this filter.</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8 pb-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="text-sm font-bold text-gray-600">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {loading && (
          <div className="col-span-full text-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#193C6C] mx-auto"></div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-[#193C6C]">Add New User</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#193C6C]/20 focus:border-[#193C6C]"
                  value={addUserForm.name}
                  onChange={(e) => setAddUserForm({ ...addUserForm, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#193C6C]/20 focus:border-[#193C6C]"
                  value={addUserForm.email}
                  onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#193C6C]/20 focus:border-[#193C6C]"
                  value={addUserForm.password}
                  onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {['user', 'it_support', 'admin'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setAddUserForm({ ...addUserForm, role })}
                      className={`px-3 py-2 rounded-xl text-sm font-bold border ${addUserForm.role === role
                        ? 'bg-[#193C6C] text-white border-[#193C6C]'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      {role === 'it_support' ? 'Staff' : role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#193C6C] text-white py-3 rounded-xl font-bold hover:bg-[#15325b] transition-colors mt-4 shadow-lg shadow-blue-900/10"
              >
                Create User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {isEditRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-xl">
            <h2 className="text-xl font-bold text-[#193C6C] mb-2">Change User Role</h2>
            <p className="text-gray-500 text-sm mb-6">Select a new role for <span className="font-bold text-gray-800">{selectedUser.name}</span></p>

            <form onSubmit={handleEditRole} className="space-y-4">
              <div className="space-y-2">
                {['user', 'it_support', 'admin'].map((role) => (
                  <label
                    key={role}
                    className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${newRole === role
                      ? 'border-[#193C6C] bg-blue-50/50 ring-1 ring-[#193C6C]'
                      : 'border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={newRole === role}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <span className={`font-bold block ${role === 'admin' ? 'text-blue-900' :
                        role === 'it_support' ? 'text-blue-700' : 'text-blue-600'
                        }`}>
                        {role === 'it_support' ? 'IT Support (Staff)' : role.charAt(0).toUpperCase() + role.slice(1)}
                      </span>
                    </div>
                    {newRole === role && <Check size={20} className="text-[#193C6C]" />}
                  </label>
                ))}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsEditRoleModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#193C6C] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#15325b] transition-colors shadow-lg shadow-blue-900/10"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
