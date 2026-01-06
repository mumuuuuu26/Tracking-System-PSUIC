import React, { useState, useEffect } from "react";
import { Search, Plus, MoreVertical, Filter } from "lucide-react";
import { listUsers, changeStatus, changeRole } from "../../api/user";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const UserManagement = () => {
  const { token } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, [filter]);

  const loadUsers = async () => {
    try {
      let roleParam = "all";
      if (filter === "Students") roleParam = "user";
      if (filter === "Staff") roleParam = "it_support"; // Or admin?

      const res = await listUsers(token, { role: roleParam });
      setUsers(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      await changeStatus(token, { id, enabled: !currentStatus });
      toast.success("Status Updated");
      loadUsers();
    } catch (err) {
      toast.error("Update Failed");
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.name || u.email).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">User Management</h1>
          <button className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
            <Filter size={20} />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="space-y-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-3.5 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {["All", "Students", "Staff"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === tab
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* User List */}
        <div className="mt-6 space-y-3">
          <div className="text-xs font-semibold text-gray-400 uppercase mb-2">
            Total Users: {filteredUsers.length}
          </div>

          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:shadow-md transition-shadow bg-white"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-lg">
                    {user.email[0].toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800 truncate">
                    {user.name || "No Name"}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      user.enabled
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {user.enabled ? "Active" : "Disabled"}
                  </span>
                </div>
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide">
                  {user.role}
                </p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusToggle(user.id, user.enabled)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    user.enabled
                      ? "text-red-600 border-red-200 hover:bg-red-50"
                      : "text-green-600 border-green-200 hover:bg-green-50"
                  }`}
                >
                  {user.enabled ? "Disable" : "Enable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button (Mockup style) */}
      <button className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-colors">
        <Plus size={24} />
      </button>
    </div>
  );
};

export default UserManagement;
