import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Hash,
  Calendar,
  Shield,
  School,
  Award,
  Clock,
  LogOut,
  Camera,
} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { currentUser } from "../../api/auth";
import { listMyTickets } from "../../api/ticket";
import { updateProfileImage } from "../../api/user";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const Profile = () => {
  const { token } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ticketStats, setTicketStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchProfile();
    fetchTicketStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await currentUser(token);
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketStats = async () => {
    try {
      const res = await listMyTickets(token);
      const tickets = res.data;
      setTicketStats({
        total: tickets.length,
        completed: tickets.filter((t) => t.status === "fixed").length,
        pending: tickets.filter((t) => t.status === "pending").length,
      });
    } catch (err) {
      console.error("Failed to load ticket stats:", err);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size/type if needed
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        const base64Image = reader.result;
        await updateProfileImage(token, base64Image);
        toast.success("Profile picture updated!");
        fetchProfile(); // Refresh profile to show new image
      } catch (err) {
        console.error(err);
        toast.error("Failed to update profile picture");
      }
    };
  };

  const stats = [
    {
      label: "Total Tickets",
      value: ticketStats.total,
      icon: <Clock className="w-5 h-5 text-blue-500" />,
    },
    {
      label: "Completed",
      value: ticketStats.completed,
      icon: <Award className="w-5 h-5 text-green-500" />,
    },
    {
      label: "Pending",
      value: ticketStats.pending,
      icon: <User className="w-5 h-5 text-orange-500" />,
    },
  ];

  if (loading)
    return (
      <div className="p-10 text-center text-gray-500 animate-pulse">
        Loading Profile...
      </div>
    );
  if (!profile)
    return (
      <div className="p-10 text-center text-red-500">
        Failed to load profile
      </div>
    );

  // ตรวจสอบว่าเป็นรหัสนักศึกษาหรือไม่ (เช็คว่าเป็นตัวเลข 10 หลัก)
  const isStudent = profile.username && /^\d{10}$/.test(profile.username);
  const displayName = profile.email ? profile.email.split('@')[0] : "User";

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen pb-24">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        {/* ปุ่ม Logout เล็กๆ มุมขวา (Optional) */}
        {/* <button onClick={actionLogout} className="text-red-500 text-sm font-semibold hover:underline">Log Out</button> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* --- Left Column: Identity Card --- */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-center p-6 relative">
            {/* PSU Passport Badge */}
            {isStudent && (
              <div className="absolute top-4 right-4 bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                <School size={12} /> PSU
              </div>
            )}

            {/* Profile Picture */}
            <div className="relative w-32 h-32 mx-auto mb-4 group">
              <div className="w-full h-full bg-gray-200 rounded-full overflow-hidden border-4 border-white shadow-lg ring-2 ring-gray-50">
                {profile.picture ? (
                  <img
                    src={profile.picture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-4xl font-bold">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Camera Overlay */}
              <label
                htmlFor="profile-upload"
                className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
              >
                <Camera size={24} />
              </label>
              <input
                id="profile-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>

            <h2 className="text-xl font-bold text-gray-800 mb-1">
              {displayName}
            </h2>
            <p className="text-sm text-gray-500 mb-4 font-medium tracking-wide">
              {profile.role ? profile.role.toUpperCase() : "USER"}
            </p>

            {/* Status Badge */}
            <div className="flex justify-center gap-2 mb-6">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${profile.enabled
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
                  }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${profile.enabled ? "bg-green-500" : "bg-red-500"
                    }`}
                ></span>
                {profile.enabled ? "Active Account" : "Disabled"}
              </span>
            </div>

            <div className="border-t border-gray-100 pt-4 text-left">
              <p className="text-xs text-gray-400 uppercase font-bold mb-2">
                Member Since
              </p>
              <div className="flex items-center text-gray-600 gap-2 bg-gray-50 p-2 rounded-lg">
                <Calendar size={16} className="text-blue-500" />
                <span className="text-sm font-medium">
                  {profile.createdAt
                    ? dayjs(profile.createdAt).format("MMMM D, YYYY")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- Right Column: Details & Stats --- */}
        <div className="md:col-span-2 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:border-blue-200 transition-colors group"
              >
                <div className="mb-2 p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                  {stat.icon}
                </div>
                <span className="text-2xl font-bold text-gray-800">
                  {stat.value}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Account Details Box */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
              <Shield size={20} className="text-blue-600" /> Account Information
            </h3>

            <div className="space-y-5">
              {/* Username / Student ID */}
              <div className="group">
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">
                  {isStudent ? "Student ID / PSU Passport" : "Username"}
                </label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-transparent group-hover:border-blue-200 group-hover:bg-blue-50/50 transition-all">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Hash size={18} className="text-blue-500" />
                  </div>
                  <span className="font-semibold text-gray-700">
                    {profile.username || "-"}
                  </span>
                </div>
              </div>

              {/* Email */}
              <div className="group">
                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">
                  Email Address
                </label>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-transparent group-hover:border-blue-200 group-hover:bg-blue-50/50 transition-all">
                  <div className="bg-white p-2 rounded-lg shadow-sm">
                    <Mail size={18} className="text-blue-500" />
                  </div>
                  <span className="font-semibold text-gray-700">
                    {profile.email}
                  </span>
                </div>
              </div>

              {/* Connection Status */}
              <div className="mt-8 pt-6 border-t border-dashed border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">
                  Connected Accounts
                </h4>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold text-xs shadow-sm">
                      PSU
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-700">
                        PSU Passport
                      </p>
                      <p className="text-xs text-gray-500">
                        {isStudent
                          ? "Linked via Student Database"
                          : "Not connected"}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-md text-xs font-bold ${isStudent
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-200 text-gray-500"
                      }`}
                  >
                    {isStudent ? "Connected" : "Unlinked"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
