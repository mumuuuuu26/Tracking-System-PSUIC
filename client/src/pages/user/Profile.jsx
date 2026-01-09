import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Shield,
  Calendar,
  Camera,
  LogOut,
  Edit2,
  Check,
  X,
} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { currentUser } from "../../api/auth";
import { updateProfileImage, updateProfile } from "../../api/user";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import Swal from "sweetalert2";

const Profile = () => {
  const { token, checkUser, actionLogout } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");

  useEffect(() => {
    fetchProfile();
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

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

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
        await checkUser();
        fetchProfile();
      } catch (err) {
        console.error(err);
        toast.error("Failed to update profile picture");
      }
    };
  };

  const handleUpdateName = async () => {
    if (!nameInput.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    try {
      await updateProfile(token, { name: nameInput });
      toast.success("Name updated successfully!");
      setProfile({ ...profile, name: nameInput });
      await checkUser(); // Sync header
      setIsEditingName(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update name");
    }
  };

  const handleUpdateUsername = async () => {
    try {
      await updateProfile(token, { username: usernameInput });
      toast.success("Username updated successfully!");
      setProfile({ ...profile, username: usernameInput });
      await checkUser(); // Sync header
      setIsEditingUsername(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update username");
    }
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Log out",
      text: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Log out",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        actionLogout();
      }
    });
  };

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

  const displayName = profile.name || (profile.email ? profile.email.split('@')[0] : "User");

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-2">
        <button className="md:hidden text-gray-500">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </button>
        <h1 className="text-xl font-bold text-gray-800">My Profile</h1>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
        <div className="relative w-28 h-28 mb-4 group">
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-blue-50">
            {profile.picture ? (
              <img
                src={profile.picture}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-blue-500 text-white text-4xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <label
            htmlFor="profile-upload"
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors border-2 border-white shadow-sm"
          >
            <Camera size={16} />
          </label>
          <input
            id="profile-upload"
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        <div className="flex items-center justify-center gap-2 mb-1">
          {isEditingName ? (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="border-b-2 border-blue-500 text-xl font-bold text-gray-800 text-center focus:outline-none bg-transparent w-full min-w-[150px]"
                autoFocus
              />
              <button
                onClick={handleUpdateName}
                className="p-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                title="Save"
              >
                <Check size={16} strokeWidth={3} />
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                title="Cancel"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>
          ) : (
            <div className="group flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">
                {displayName}
              </h2>
              <button
                onClick={() => {
                  setNameInput(profile.name || displayName);
                  setIsEditingName(true);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                title="Edit Name"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>
        <p className="text-gray-500 text-sm mb-3">{profile.email}</p>
        <div className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
          {profile.role || "USER"}
        </div>
      </div>

      {/* Details Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {/* Username */}
          <div className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
              <User size={20} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 font-medium mb-0.5">Username</p>
                {!isEditingUsername && (
                  <button
                    onClick={() => {
                      setUsernameInput(profile.username || "");
                      setIsEditingUsername(true);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 text-xs font-bold flex items-center gap-1 transition-all"
                  >
                    <Edit2 size={12} /> Edit
                  </button>
                )}
              </div>

              {isEditingUsername ? (
                <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200 mt-1">
                  <input
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className="border-b-2 border-blue-500 font-semibold text-gray-800 text-sm focus:outline-none bg-transparent w-full"
                    autoFocus
                    placeholder="Set username"
                  />
                  <button
                    onClick={handleUpdateUsername}
                    className="p-1 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                  >
                    <Check size={14} strokeWidth={3} />
                  </button>
                  <button
                    onClick={() => setIsEditingUsername(false)}
                    className="p-1 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <p className="text-gray-900 font-semibold text-sm">{profile.username || "-"}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
              <Mail size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 font-medium mb-0.5">Email Address</p>
              <p className="text-gray-900 font-semibold text-sm">{profile.email}</p>
            </div>
          </div>

          {/* Role */}
          <div className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
              <Shield size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 font-medium mb-0.5">Role</p>
              <p className="text-gray-900 font-semibold text-sm uppercase">{profile.role || "USER"}</p>
            </div>
          </div>

          {/* Member Since */}
          <div className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
              <Calendar size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 font-medium mb-0.5">Member Since</p>
              <p className="text-gray-900 font-semibold text-sm">
                {profile.createdAt
                  ? dayjs(profile.createdAt).format("MMMM D, YYYY")
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full bg-white text-red-500 font-bold p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center gap-2 hover:bg-red-50 hover:border-red-100 transition-all"
      >
        <LogOut size={20} />
        Log Out
      </button>
    </div>
  );
};

export default Profile;
