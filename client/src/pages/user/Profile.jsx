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
  Moon,
  Sun,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/auth-store";
import { currentUser } from "../../api/auth";
import { updateProfileImage, updateProfile } from "../../api/user";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { getImageUrl } from "../../utils/imageUrl";
import { confirmLogout } from "../../utils/sweetalert";
import UserPageHeader from "../../components/user/UserPageHeader";
import UserWrapper from "../../components/user/UserWrapper";

const Profile = () => {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { token, checkUser, actionLogout } = useAuthStore();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const fetchProfile = React.useCallback(async () => {
    try {
      const res = await currentUser(token);
      setProfile(res.data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
        await updateProfileImage(base64Image);
        toast.success("Profile picture updated!");
        await checkUser();
        fetchProfile();
      } catch {
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
      await updateProfile({ name: nameInput });
      toast.success("Name updated successfully!");
      setProfile({ ...profile, name: nameInput });
      await checkUser();
      setIsEditingName(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update name");
    }
  };

  const handleLogout = async () => {
    const isConfirmed = await confirmLogout();
    if (isConfirmed) {
      actionLogout();
      navigate("/");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d1b2a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );

  if (!profile)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d1b2a] p-10 text-center">
        <p className="text-red-500 dark:text-red-400">Failed to load profile</p>
      </div>
    );

  const displayName =
    profile.name || (profile.email ? profile.email.split("@")[0] : "User");

  const detailRows = [
    {
      icon: <User size={18} />,
      label: "Display Name",
      key: "name",
      value: displayName,
      editable: false,
    },
    {
      icon: <Mail size={18} />,
      label: "Email Address",
      value: profile.email,
    },
    {
      icon: <Shield size={18} />,
      label: "Role",
      value: (profile.role || "USER").toUpperCase(),
    },
    {
      icon: <Calendar size={18} />,
      label: "Member Since",
      value: profile.createdAt ? dayjs(profile.createdAt).format("MMMM D, YYYY") : "N/A",
    },
  ];

  return (
    <UserWrapper>
      <div className="pb-24 relative bg-gray-50 dark:bg-[#0d1b2a] min-h-screen">
        {/* Mobile Header */}
        <UserPageHeader title="Profile" />

        {/* Hero Avatar Section */}
        <div className="relative bg-white dark:bg-gradient-to-b dark:from-[#193C6C] dark:via-[#1a2f4e] dark:to-[#0d1b2a] pt-10 pb-16 flex flex-col items-center text-center overflow-hidden border-b border-gray-100 dark:border-transparent">
          {/* Background decoration */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-blue-50 dark:bg-blue-400/10 blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-4 -left-4 w-28 h-28 rounded-full bg-blue-50 dark:bg-blue-300/5 blur-xl pointer-events-none"></div>

          {/* Avatar */}
          <div className="relative w-24 h-24 mb-4 group z-10">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-blue-400/30 shadow-xl">
              {profile.picture ? (
                <img
                  src={getImageUrl(profile.picture)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = '/default-profile.svg'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-[#193C6C] text-blue-600 dark:text-white text-4xl font-extrabold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <label
              htmlFor="profile-upload"
              className="absolute bottom-0 right-0 bg-blue-600 dark:bg-blue-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors border-2 border-white dark:border-[#1a2f4e] shadow-md"
            >
              <Camera size={14} />
            </label>
            <input
              id="profile-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>

          {/* Name (editable) */}
          <div className="flex items-center justify-center gap-2 mb-1 z-10">
            {isEditingName ? (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="border-b-2 border-blue-400 text-xl font-bold text-gray-900 dark:text-white text-center focus:outline-none bg-transparent w-full min-w-[150px]"
                  autoFocus
                />
                <button onClick={handleUpdateName} className="p-1.5 bg-emerald-100 dark:bg-emerald-700/50 text-emerald-600 dark:text-emerald-300 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-700/70 transition-colors border border-emerald-200 dark:border-emerald-600/40">
                  <Check size={14} strokeWidth={3} />
                </button>
                <button onClick={() => setIsEditingName(false)} className="p-1.5 bg-red-100 dark:bg-red-800/50 text-red-600 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-800/70 transition-colors border border-red-200 dark:border-red-600/40">
                  <X size={14} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <div className="group flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
                <button
                  onClick={() => { setNameInput(profile.name || displayName); setIsEditingName(true); }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 rounded-full transition-all"
                  title="Edit Name"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            )}
          </div>
          <p className="text-gray-500 dark:text-blue-300/70 text-sm z-10">{profile.email}</p>
          <div className="bg-blue-50 dark:bg-blue-700/40 text-blue-600 dark:text-blue-200 border border-blue-100 dark:border-blue-600/40 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide mt-2 z-10 shadow-sm">
            {profile.role || "USER"}
          </div>
        </div>

        {/* Details Card (pulled up to overlap hero) */}
        <div className="max-w-4xl mx-auto px-6 -mt-6 relative z-10 space-y-3">
          <div className="bg-white dark:bg-[#1a2f4e] rounded-2xl border border-gray-200 dark:border-blue-800/30 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-blue-800/30">
              {detailRows.map((row, idx) => (
                <div key={idx} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-blue-900/20 transition-colors group">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/50 border border-blue-100 dark:border-blue-700/40 flex items-center justify-center text-blue-600 dark:text-blue-300 shrink-0 transition-colors">
                    {row.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-blue-400/60 font-medium mb-0.5">{row.label}</p>
                      {row.editable && !row.isEditing && (
                        <button
                          onClick={row.onEdit}
                          className="opacity-0 group-hover:opacity-100 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <Edit2 size={11} /> Edit
                        </button>
                      )}
                    </div>

                    {row.isEditing ? (
                      <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200 mt-1">
                        <input
                          type="text"
                          value={row.inputValue}
                          onChange={(e) => row.setInput(e.target.value)}
                          className="border-b-2 border-blue-600 dark:border-blue-400 font-semibold text-gray-900 dark:text-white text-sm focus:outline-none bg-transparent w-full"
                          autoFocus
                          placeholder="Set username"
                        />
                        <button onClick={row.onSave} className="p-1 bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-300 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-700/70 transition-colors border border-emerald-200 dark:border-emerald-700/40">
                          <Check size={13} strokeWidth={3} />
                        </button>
                        <button onClick={row.onCancel} className="p-1 bg-red-100 dark:bg-red-800/50 text-red-600 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-800/70 transition-colors border border-red-200 dark:border-red-700/40">
                          <X size={13} strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{row.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-full bg-white dark:bg-[#1a2f4e] text-gray-700 dark:text-white font-medium p-4 rounded-2xl border border-gray-200 dark:border-blue-800/40 flex items-center justify-between px-6 shadow-sm hover:bg-gray-50 dark:hover:bg-[#1e3558] transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? <Moon size={20} className="text-blue-300" /> : <Sun size={20} className="text-amber-500" />}
              <span>Appearance</span>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-blue-400/60">
              {isDarkMode ? "Dark Mode" : "Light Mode"}
            </span>
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full bg-white dark:bg-[#1a2f4e] text-blue-600 dark:text-blue-300 font-medium p-4 rounded-2xl border border-gray-200 dark:border-blue-800/40 flex items-center justify-center gap-2 shadow-sm hover:bg-blue-50 dark:hover:bg-[#1e3558] hover:border-blue-200 dark:hover:border-blue-700/60 transition-all duration-300"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>

      </div>
    </UserWrapper>
  );
};

export default Profile;
