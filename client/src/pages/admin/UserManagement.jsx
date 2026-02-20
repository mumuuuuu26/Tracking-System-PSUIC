import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, Edit2, Trash2, ArrowLeft, ChevronLeft, ChevronRight, X, Check, ChevronDown } from "lucide-react";
import { listUsers, removeUser, createUser, changeRole } from "../../api/user";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import AdminWrapper from "../../components/admin/AdminWrapper";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminSelect from "../../components/admin/AdminSelect";

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const [viewFilter, setViewFilter] = useState("All");

  // Add User State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    name: "",
    email: "",
    role: "user"
  });

  // Edit Role State
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);

      // Map UI filter to API role
      let roleParam = 'all';
      if (viewFilter === 'User') roleParam = 'user';
      if (viewFilter === 'IT Support') roleParam = 'it_support';
      if (viewFilter === 'Admin') roleParam = 'admin';

      const res = await listUsers({ role: roleParam });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [viewFilter]);

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
          await removeUser(id);
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
      if (!addUserForm.name || !addUserForm.email) {
        return toast.error("Please fill in all required fields");
      }
      await createUser(addUserForm);
      toast.success("User Added Successfully");
      setIsAddModalOpen(false);
      setAddUserForm({ name: "", email: "", role: "user" });
      loadUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to add user");
    }
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    try {
      await changeRole({ id: selectedUser.id, role: newRole });
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
      <div className="flex flex-col h-full px-6 pt-4 pb-6 space-y-4 overflow-hidden">
        {/* Page Header */}
        <AdminHeader
          title="User Management"
          subtitle="Manage student, staff and administrator accounts"
          onBack={() => navigate(-1)}
        />

        {/* Filters & Action Bar */}
        <div className="bg-white p-1.5 pl-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-4 h-auto md:h-14 shrink-0">
          <div className="flex-1 flex items-center gap-3 w-full">
            <Search className="text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, email or ID..."
              className="flex-1 bg-transparent border-none focus:outline-none text-gray-700 placeholder:text-gray-400 text-sm h-12 md:h-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 pl-0 md:pl-4 py-2 md:py-1 w-full md:w-auto justify-between md:justify-start">
            <div className="relative flex-1 md:flex-none">
              <AdminSelect
                value={viewFilter}
                onChange={setViewFilter}
                options={['All', 'User', 'IT Support', 'Admin']}
                placeholder="View: All"
                minWidth="min-w-[140px]"
                className="z-20 w-full md:w-auto"
              />
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#1e2e4a] text-white px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-[#15233b] transition-colors mr-2 whitespace-nowrap"
            >
              <Plus size={16} /> Add User
            </button>
          </div>
        </div>

        {/* User Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedUsers.map((user) => (
              <div key={user.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between hover:shadow-md transition-shadow relative">

                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 border border-gray-100 bg-gray-50">
                    {user.picture ? (
                      <img src={user.picture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <img src={`https://ui-avatars.com/api/?name=${user.name || 'U'}&background=random`} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0">
                    <h3 className="text-[#1e2e4a] text-base leading-tight truncate">{user.name || 'No Name'}</h3>
                    <p className="text-gray-400 text-xs mt-0.5 truncate uppercase">
                      {user.username || user.email || '-'}
                    </p>
                    <div className="mt-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] ${getRoleBadgeStyle(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 text-gray-300 ml-4 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setNewRole(user.role);
                      setIsEditRoleModalOpen(true);
                    }}
                    className="hover:text-blue-600 transition-colors"
                    title="Change Role"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="hover:text-red-500 transition-colors"
                    title="Delete User"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {paginatedUsers.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Search size={48} className="mb-4 opacity-10" />
              <p className="text-sm">No users found matching your search.</p>
            </div>
          )}
        </div>

        {/* Pagination — pinned to the bottom of the viewport */}
        {totalPages > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-100 flex justify-center items-center gap-1 py-3 flex-wrap">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-600"
            >
              <ChevronLeft size={20} />
            </button>

            {(() => {
              const generatePages = () => {
                const pages = [];
                const addPage = (num, type = 'visible') => pages.push({ num, type });
                const addEllipsis = () => pages.push({ num: '...', type: 'visible' });

                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) addPage(i);
                } else {
                  if (currentPage <= 4) {
                    for (let i = 1; i <= 5; i++) addPage(i, i > 3 && i < 5 ? 'desktop-only' : 'visible');
                    addEllipsis();
                    addPage(totalPages);
                  } else if (currentPage >= totalPages - 3) {
                    addPage(1);
                    addEllipsis();
                    for (let i = totalPages - 4; i <= totalPages; i++) {
                      addPage(i, i > totalPages - 4 && i < totalPages - 2 ? 'desktop-only' : 'visible');
                    }
                  } else {
                    addPage(1);
                    addEllipsis();
                    addPage(currentPage - 1, 'desktop-only');
                    addPage(currentPage);
                    addPage(currentPage + 1, 'desktop-only');
                    addEllipsis();
                    addPage(totalPages);
                  }
                }
                return pages;
              };

              return generatePages().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page.num === 'number' && setCurrentPage(page.num)}
                  disabled={page.num === '...'}
                  className={`flex items-center justify-center rounded-lg text-sm transition-all
                    ${page.type === 'desktop-only' ? 'hidden md:flex' : 'flex'}
                    ${page.num === '...' ? 'w-6 md:w-8 cursor-default text-gray-400' : 'w-8 h-8 md:w-9 md:h-9'}
                    ${page.num === currentPage
                      ? 'bg-[#1e2e4a] text-white shadow-md shadow-blue-900/10'
                      : page.num === '...'
                        ? ''
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {page.num}
                </button>
              ));
            })()}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-600"
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
                <h2 className="text-xl text-[#1e2e4a]">Add New User</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1 uppercase">Full Name</label>
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
                  <label className="block text-xs text-gray-500 mb-1 uppercase">Email / Username</label>
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
                  <label className="block text-xs text-gray-500 mb-1 uppercase">Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['user', 'it_support', 'admin'].map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setAddUserForm({ ...addUserForm, role })}
                        className={`px-2 py-2 rounded-lg text-xs border transition-colors ${addUserForm.role === role
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
                  className="w-full bg-[#1e2e4a] text-white py-3 rounded-xl hover:bg-[#15325b] transition-colors mt-2"
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
                <h2 className="text-xl text-[#1e2e4a]">Change Role</h2>
                <button onClick={() => setIsEditRoleModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-6">Select a new role for <span className="text-[#1e2e4a]">{selectedUser?.name}</span></p>

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
                      <span className="text-sm text-[#1e2e4a]">
                        {role === 'it_support' ? 'IT Support' : role === 'admin' ? 'System Admin' : 'User'}
                      </span>
                    </div>
                    {newRole === role && <Check size={18} className="text-[#1e2e4a]" />}
                  </label>
                ))}

                <button
                  type="submit"
                  className="w-full bg-[#1e2e4a] text-white py-3 rounded-xl hover:bg-[#15233b] transition-colors mt-4 shadow-lg shadow-blue-900/10"
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


