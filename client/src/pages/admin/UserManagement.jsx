import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, Edit2, Trash2, ArrowLeft, ChevronLeft, ChevronRight, X, Check, ChevronDown } from "lucide-react";
import { listUsers, removeUser, createUser, changeRole } from "../../api/user";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AdminWrapper from "../../components/admin/AdminWrapper";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminSelect from "../../components/admin/AdminSelect";

const UserManagement = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [viewFilter, setViewFilter] = useState("All");

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
      // Fetch all users mostly
      const res = await listUsers(token, { role: 'all' });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadUsers();
    setCurrentPage(1);
  }, [loadUsers]);

  // Reset page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);



  const handleDelete = (id) => {
    Swal.fire({
      title: "Delete User",
      text: "This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-3xl p-6",
        confirmButton: "bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-xl",
        cancelButton: "bg-white border border-gray-200 text-gray-700 py-2 px-4 rounded-xl ml-2"
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

  // Filter Logic
  const filteredUsers = users.filter((u) => {
    const matchesSearch = (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.username || "").toLowerCase().includes(search.toLowerCase());

    let matchesRole = true;
    if (viewFilter === 'User') matchesRole = u.role === 'user';
    if (viewFilter === 'IT Support') matchesRole = u.role === 'it_support';
    if (viewFilter === 'Admin') matchesRole = u.role === 'admin';

    return matchesSearch && matchesRole;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'System Admin';
      case 'it_support': return 'IT Support';
      default: return 'User';
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin': return 'bg-blue-100 text-blue-700'; // System Admin
      case 'it_support': return 'bg-purple-100 text-purple-700'; // IT Support
      default: return 'bg-gray-100 text-gray-600'; // User
    }
  };

  return (
    <AdminWrapper>
      <div className="flex flex-col h-full px-6 pt-6 pb-6 space-y-6 overflow-y-auto">
        {/* Page Header */}
        <AdminHeader
          title="User Management"
          subtitle="Manage student, staff and administrator accounts"
          onBack={() => navigate(-1)}
        />

        {/* Filters & Action Bar */}
        <div className="bg-white p-2 pl-4 rounded-2xl shadow-sm mb-6 flex items-center gap-4 h-16 shrink-0">
          <div className="flex-1 flex items-center gap-3">
            <Search className="text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              className="flex-1 bg-transparent border-none focus:outline-none text-gray-700 placeholder:text-gray-400 text-sm h-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 border-l border-gray-100 pl-4 py-1">
            <div className="relative">
              <AdminSelect
                value={viewFilter}
                onChange={setViewFilter}
                options={['All', 'User', 'IT Support', 'Admin']}
                placeholder="View: All"
                minWidth="min-w-[140px]"
                className="z-20"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#1e2e4a] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#15233b] transition-colors mr-2"
            >
              <Plus size={16} /> Add User
            </button>
          </div>
        </div>

        {/* User Cards Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedUsers.map((user) => (
              <div key={user.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-50 flex items-start gap-4 hover:shadow-md transition-shadow">

                {/* Avatar */}
                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-100">
                  {user.picture ? (
                    <img src={user.picture} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="" className="w-full h-full object-cover" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-[#1e2e4a] text-sm truncate pr-2">{user.name}</h3>

                    {/* Action Buttons */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* You can show/hide actions on hover or keep them visible. Screenshot shows pencil/trash lightly */}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setNewRole(user.role);
                          setIsEditRoleModalOpen(true);
                        }}
                        className="text-gray-300 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-400 text-xs mb-2 truncate">
                    {/* Display Username (Student ID) for users, Email for others */}
                    {user.role === 'user' ? (user.username || user.email) : user.email}
                  </p>

                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold ${getRoleBadgeStyle(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {paginatedUsers.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-400">
              <p>No users found matching your search.</p>
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-4 shrink-0">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            <span className="text-xs font-bold text-gray-500">
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

        {/* Modals (Keep existing structure but maybe minimal style tweaks) */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#1e2e4a]">Add New User</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e2e4a]/10 focus:border-[#1e2e4a] text-sm"
                    value={addUserForm.name}
                    onChange={(e) => setAddUserForm({ ...addUserForm, name: e.target.value })}
                    placeholder="e.g. Somchai Jai-dee"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Email / Username</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e2e4a]/10 focus:border-[#1e2e4a] text-sm"
                    value={addUserForm.email}
                    onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                    placeholder="e.g. student@psu.ac.th"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e2e4a]/10 focus:border-[#1e2e4a] text-sm"
                    value={addUserForm.password}
                    onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                    placeholder="Enter secure password"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['user', 'it_support', 'admin'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setAddUserForm({ ...addUserForm, role })}
                        className={`px-2 py-2 rounded-lg text-xs font-bold border transition-colors ${addUserForm.role === role
                          ? 'bg-[#1e2e4a] text-white border-[#1e2e4a]'
                          : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        {role === 'it_support' ? 'IT Support' : role === 'admin' ? 'System Admin' : 'User'}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-[#1e2e4a] text-white py-3 rounded-xl font-bold hover:bg-[#15325b] transition-colors mt-2"
                >
                  Create User
                </button>
              </form>
            </div>
          </div>
        )}

        {isEditRoleModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-[#1e2e4a]">Change Role</h2>
                <button onClick={() => setIsEditRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-6">Select a new role for <span className="font-bold text-[#1e2e4a]">{selectedUser?.name}</span></p>

              <form onSubmit={handleEditRole} className="space-y-3">
                {['user', 'it_support', 'admin'].map((role) => (
                  <label
                    key={role}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${newRole === role
                      ? 'border-[#1e2e4a] bg-blue-50/50 ring-1 ring-[#1e2e4a]/10'
                      : 'border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={newRole === role}
                        onChange={(e) => setNewRole(e.target.value)}
                        className="accent-[#1e2e4a]"
                      />
                      <span className={`font-bold text-sm ${role === 'admin' ? 'text-blue-900' :
                        role === 'it_support' ? 'text-purple-700' : 'text-gray-700'
                        }`}>
                        {role === 'it_support' ? 'IT Support' : role === 'admin' ? 'System Admin' : 'User'}
                      </span>
                    </div>
                    {newRole === role && <Check size={18} className="text-[#1e2e4a]" />}
                  </label>
                ))}

                <button
                  type="submit"
                  className="w-full bg-[#1e2e4a] text-white py-3 rounded-xl font-bold hover:bg-[#15233b] transition-colors mt-4 shadow-lg shadow-blue-900/10"
                >
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminWrapper>
  );
};

export default UserManagement;


