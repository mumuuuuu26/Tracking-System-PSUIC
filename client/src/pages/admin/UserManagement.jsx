import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, MoreVertical, Filter, Trash2, Shield, User, Power, CheckCircle, XCircle } from "lucide-react";
import { listUsers, changeStatus, removeUser } from "../../api/user";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const UserManagement = () => {
  const { token } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      let roleParam = "all";
      if (filter === "Students") roleParam = "user";
      if (filter === "Staff") roleParam = "it_support";
      if (filter === "Admins") roleParam = "admin";

      const res = await listUsers(token, { role: roleParam });
      setUsers(res.data);
    } catch (err) {
      console.log(err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [token, filter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      await changeStatus(token, { id, enabled: !currentStatus });
      toast.success(currentStatus ? "User Disabled" : "User Enabled");
      loadUsers();
    } catch {
      toast.error("Status Update Failed");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to PERMANENTLY delete this user? This action cannot be undone.")) {
      try {
        await removeUser(token, id);
        toast.success("User Deleted Successfully");
        loadUsers();
      } catch {
        toast.error("Delete Failed");
      }
    }
  };

  const wrapperFilterUsers = () => {
    return users.filter((u) =>
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase())
    );
  };

  const filteredUsers = wrapperFilterUsers();

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700"><Shield size={12} /> Admin</span>;
      case 'it_support': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700"><Shield size={12} /> IT Support</span>;
      default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700"><User size={12} /> User</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 pt-8 pb-6 px-4 mb-8 sticky top-0 z-20 bg-opacity-90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User Management</h1>
          <p className="text-gray-500 text-sm mb-6">Manage user accounts, roles, and access permissions</p>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search users..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
              {["All", "Students", "Staff", "Admins"].map((tab) => {
                const isActive = filter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${isActive
                      ? "bg-gray-900 text-white shadow-md"
                      : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    {tab}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white rounded-xl animate-pulse"></div>)}
          </div>
        ) : (
          <>
            <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 uppercase overflow-hidden border border-gray-100">
                            {user.picture ? (
                              <img src={user.picture} alt="" className="w-full h-full object-cover" />
                            ) : (
                              user.email?.[0] || 'U'
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{user.name || user.username || "No Name"}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleStatusToggle(user.id, user.enabled)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${user.enabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100'
                            : 'bg-red-50 text-red-700 border-red-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'
                            }`}
                        >
                          {user.enabled ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {user.enabled ? "Active" : "Disabled"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {dayjs(user.createdAt).format("DD MMM YYYY")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
              {filteredUsers.map(user => (
                <div key={user.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500 uppercase overflow-hidden">
                        {user.picture ? (
                          <img src={user.picture} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.email?.[0] || 'U'
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{user.name || user.username || "No Name"}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</p>
                      </div>
                    </div>
                    {getRoleBadge(user.role)}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                    <button
                      onClick={() => handleStatusToggle(user.id, user.enabled)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${user.enabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                        }`}
                    >
                      {user.enabled ? "Active" : "Disabled"}
                    </button>

                    <button
                      onClick={() => handleDelete(user.id)}
                      className="flex items-center gap-1 text-red-500 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
