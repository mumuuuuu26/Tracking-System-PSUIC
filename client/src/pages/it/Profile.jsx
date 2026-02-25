import React, { useCallback, useEffect, useState } from "react";
import {
  Mail,
  Shield,
  Calendar,
  Camera,
  LogOut,
  Edit2,
  Check,
  X,
  Phone,
  Building2,
  Hash,
  Bell,
  Moon,
  Sun,
  Save,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { toast } from "react-toastify";

import useThemeStore from "../../store/themeStore";
import useAuthStore from "../../store/auth-store";
import { currentUser } from "../../api/auth";
import { updateProfileImage, updateProfile } from "../../api/user";
import { confirmLogout } from "../../utils/sweetalert";
import ITPageHeader from "../../components/it/ITPageHeader";
import ITWrapper from "../../components/it/ITWrapper";
import ProfileAvatar from "../../components/common/ProfileAvatar";
import { getUserDisplayName } from "../../utils/userIdentity";

const defaultWorkingHours = {
  weekday: "09:00 AM - 06:00 PM",
  saturday: "09:00 AM - 01:00 PM",
};

const safeParseWorkingHours = (raw) => {
  if (!raw) {
    return defaultWorkingHours;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      weekday: parsed.weekday || defaultWorkingHours.weekday,
      saturday: parsed.saturday || defaultWorkingHours.saturday,
    };
  } catch {
    return defaultWorkingHours;
  }
};

const ITProfile = () => {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const { checkUser, actionLogout } = useAuthStore();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");

  const [isEditingDepartment, setIsEditingDepartment] = useState(false);
  const [departmentInput, setDepartmentInput] = useState("");

  const [isEditingOfficeExt, setIsEditingOfficeExt] = useState(false);
  const [officeExtInput, setOfficeExtInput] = useState("");

  const [isEditingWorkHours, setIsEditingWorkHours] = useState(false);
  const [workHoursInputs, setWorkHoursInputs] = useState(defaultWorkingHours);

  const [myEmailEnabled, setMyEmailEnabled] = useState(true);
  const [myNotifyEmail, setMyNotifyEmail] = useState("");
  const [savingPreference, setSavingPreference] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await currentUser();
      const nextProfile = res.data;
      setProfile(nextProfile);

      setNameInput(nextProfile.name || "");
      setPhoneInput(nextProfile.phoneNumber || "");
      setDepartmentInput(nextProfile.department || "IT Department");
      setOfficeExtInput(nextProfile.officeExtension || "1050");
      setWorkHoursInputs(safeParseWorkingHours(nextProfile.workingHoursJson));
      setMyEmailEnabled(nextProfile.isEmailEnabled !== false);
      setMyNotifyEmail(nextProfile.notificationEmail || nextProfile.email || "");
    } catch {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const applyProfileUpdate = async (payload, successMessage, onDone) => {
    try {
      await updateProfile(payload);
      setProfile((prev) => ({ ...prev, ...payload }));
      await checkUser();
      if (onDone) {
        onDone();
      }
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      try {
        await updateProfileImage(reader.result);
        toast.success("Profile picture updated!");
        await checkUser();
        await fetchProfile();
      } catch {
        toast.error("Failed to update profile picture");
      } finally {
        setUploadingImage(false);
      }
    };
  };

  const handleUpdateName = async () => {
    const nextName = nameInput.trim();
    if (!nextName) {
      toast.error("Name cannot be empty");
      return;
    }

    await applyProfileUpdate(
      { name: nextName },
      "Name updated successfully",
      () => setIsEditingName(false)
    );
  };

  const handleUpdatePhone = async () => {
    await applyProfileUpdate(
      { phoneNumber: phoneInput.trim() },
      "Phone updated",
      () => setIsEditingPhone(false)
    );
  };

  const handleUpdateDepartment = async () => {
    const nextDepartment = departmentInput.trim();
    if (!nextDepartment) {
      toast.error("Department cannot be empty");
      return;
    }

    await applyProfileUpdate(
      { department: nextDepartment },
      "Department updated",
      () => setIsEditingDepartment(false)
    );
  };

  const handleUpdateOfficeExt = async () => {
    const nextExt = officeExtInput.trim();
    if (!nextExt) {
      toast.error("Office extension cannot be empty");
      return;
    }

    await applyProfileUpdate(
      { officeExtension: nextExt },
      "Office extension updated",
      () => setIsEditingOfficeExt(false)
    );
  };

  const handleUpdateWorkHours = async () => {
    if (!workHoursInputs.weekday.trim() || !workHoursInputs.saturday.trim()) {
      toast.error("Working hours cannot be empty");
      return;
    }

    await applyProfileUpdate(
      { workingHoursJson: JSON.stringify(workHoursInputs) },
      "Working hours updated",
      () => setIsEditingWorkHours(false)
    );
  };

  const handleSavePreference = async () => {
    const emailValue = myNotifyEmail.trim();

    if (!profile?.emailNotificationsConfigured) {
      toast.error("Server email sender is not configured. Please contact admin.");
      return;
    }

    if (myEmailEnabled && !emailValue) {
      toast.error("Please enter notification email");
      return;
    }

    setSavingPreference(true);
    try {
      await updateProfile({
        isEmailEnabled: myEmailEnabled,
        notificationEmail: emailValue || profile?.email || "",
      });

      setProfile((prev) => ({
        ...prev,
        isEmailEnabled: myEmailEnabled,
        notificationEmail: emailValue || prev?.email || "",
      }));
      await checkUser();
      toast.success("Notification settings updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update notification settings");
    } finally {
      setSavingPreference(false);
    }
  };

  const handleToggleEmail = async () => {
    const nextValue = !myEmailEnabled;

    if (nextValue && !profile?.emailNotificationsConfigured) {
      toast.error("Server email sender is not configured. Please contact admin.");
      return;
    }

    setMyEmailEnabled(nextValue);

    try {
      await updateProfile({
        isEmailEnabled: nextValue,
        notificationEmail: myNotifyEmail.trim() || profile?.email || "",
      });
      setProfile((prev) => ({
        ...prev,
        isEmailEnabled: nextValue,
        notificationEmail: myNotifyEmail.trim() || prev?.email || "",
      }));
      await checkUser();
      toast.success(nextValue ? "Email notifications enabled" : "Email notifications disabled");
    } catch (err) {
      setMyEmailEnabled(!nextValue);
      toast.error(err.response?.data?.message || "Failed to update notification toggle");
    }
  };

  const handleLogout = async () => {
    const isConfirmed = await confirmLogout();
    if (isConfirmed) {
      actionLogout();
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d1b2a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d1b2a] p-10 text-center">
        <p className="text-red-500 dark:text-red-400">Failed to load profile</p>
      </div>
    );
  }

  const displayName = getUserDisplayName(profile, "IT Support");

  return (
    <ITWrapper>
      <div className="pb-24 relative bg-gray-50 dark:bg-[#0d1b2a] min-h-screen">
        <ITPageHeader title="Profile" />

        <div className="relative bg-white dark:bg-gradient-to-b dark:from-[#193C6C] dark:via-[#1a2f4e] dark:to-[#0d1b2a] pt-10 pb-16 flex flex-col items-center text-center overflow-hidden border-b border-gray-100 dark:border-transparent">
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-blue-50 dark:bg-blue-400/10 blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-4 -left-4 w-28 h-28 rounded-full bg-blue-50 dark:bg-blue-300/5 blur-xl pointer-events-none"></div>

          <div className="relative w-24 h-24 mb-4 group z-10">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-blue-400/30 shadow-xl">
              <ProfileAvatar
                user={profile}
                alt="Profile"
                className="w-full h-full"
                imageClassName="w-full h-full object-cover"
                fallbackClassName="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-[#193C6C] text-blue-600 dark:text-white"
                initialsClassName="text-3xl font-extrabold"
              />
            </div>
            <label
              htmlFor="it-profile-upload"
              className="absolute bottom-0 right-0 bg-blue-600 dark:bg-blue-500 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-500 dark:hover:bg-blue-400 transition-colors border-2 border-white dark:border-[#1a2f4e] shadow-md"
            >
              {uploadingImage ? (
                <div className="w-[14px] h-[14px] border-2 border-white/70 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Camera size={14} />
              )}
            </label>
            <input
              id="it-profile-upload"
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
              disabled={uploadingImage}
            />
          </div>

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
                <button
                  onClick={handleUpdateName}
                  className="p-1.5 bg-emerald-100 dark:bg-emerald-700/50 text-emerald-600 dark:text-emerald-300 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-700/70 transition-colors border border-emerald-200 dark:border-emerald-600/40"
                >
                  <Check size={14} strokeWidth={3} />
                </button>
                <button
                  onClick={() => {
                    setNameInput(profile.name || displayName);
                    setIsEditingName(false);
                  }}
                  className="p-1.5 bg-red-100 dark:bg-red-800/50 text-red-600 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-800/70 transition-colors border border-red-200 dark:border-red-600/40"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <div className="group flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{displayName}</h2>
                <button
                  onClick={() => {
                    setNameInput(profile.name || displayName);
                    setIsEditingName(true);
                  }}
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
            {profile.role || "IT"}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 -mt-6 relative z-10 space-y-3">
          <div className="bg-white dark:bg-[#1a2f4e] rounded-2xl border border-gray-200 dark:border-blue-800/30 overflow-hidden">
            <div className="divide-y divide-gray-100 dark:divide-blue-800/30">
              <div className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/50 border border-blue-100 dark:border-blue-700/40 flex items-center justify-center text-blue-600 dark:text-blue-300 shrink-0">
                  <Mail size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-blue-400/60 font-medium mb-0.5">Email Address</p>
                  <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{profile.email || "N/A"}</p>
                </div>
              </div>

              <div className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/50 border border-blue-100 dark:border-blue-700/40 flex items-center justify-center text-blue-600 dark:text-blue-300 shrink-0">
                  <Shield size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-blue-400/60 font-medium mb-0.5">Role</p>
                  <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{(profile.role || "IT").toUpperCase()}</p>
                </div>
              </div>

              <div className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/50 border border-blue-100 dark:border-blue-700/40 flex items-center justify-center text-blue-600 dark:text-blue-300 shrink-0">
                  <Calendar size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-blue-400/60 font-medium mb-0.5">Member Since</p>
                  <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">
                    {profile.createdAt ? dayjs(profile.createdAt).format("MMMM D, YYYY") : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a2f4e] rounded-2xl border border-gray-200 dark:border-blue-800/30 p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Editable Contact Info</h3>

            <div className="space-y-3">
              <div className="p-3 rounded-xl border border-gray-100 dark:border-blue-800/40 bg-gray-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-blue-300/80 text-sm font-medium">
                    <Phone size={15} /> Mobile
                  </div>
                  {!isEditingPhone && (
                    <button
                      onClick={() => {
                        setPhoneInput(profile.phoneNumber || "");
                        setIsEditingPhone(true);
                      }}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-300"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingPhone ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      className="flex-1 bg-white dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white"
                      placeholder="Phone number"
                    />
                    <button onClick={handleUpdatePhone} className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setIsEditingPhone(false)} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile.phoneNumber || "Not Set"}</p>
                )}
              </div>

              <div className="p-3 rounded-xl border border-gray-100 dark:border-blue-800/40 bg-gray-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-blue-300/80 text-sm font-medium">
                    <Building2 size={15} /> Department
                  </div>
                  {!isEditingDepartment && (
                    <button
                      onClick={() => {
                        setDepartmentInput(profile.department || "IT Department");
                        setIsEditingDepartment(true);
                      }}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-300"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingDepartment ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={departmentInput}
                      onChange={(e) => setDepartmentInput(e.target.value)}
                      className="flex-1 bg-white dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white"
                      placeholder="Department"
                    />
                    <button onClick={handleUpdateDepartment} className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setIsEditingDepartment(false)} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{profile.department || "IT Department"}</p>
                )}
              </div>

              <div className="p-3 rounded-xl border border-gray-100 dark:border-blue-800/40 bg-gray-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-blue-300/80 text-sm font-medium">
                    <Hash size={15} /> Office Extension
                  </div>
                  {!isEditingOfficeExt && (
                    <button
                      onClick={() => {
                        setOfficeExtInput(profile.officeExtension || "1050");
                        setIsEditingOfficeExt(true);
                      }}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-300"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {isEditingOfficeExt ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={officeExtInput}
                      onChange={(e) => setOfficeExtInput(e.target.value)}
                      className="flex-1 bg-white dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white"
                      placeholder="Office extension"
                    />
                    <button onClick={handleUpdateOfficeExt} className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                      <Check size={16} />
                    </button>
                    <button onClick={() => setIsEditingOfficeExt(false)} className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Ext. {profile.officeExtension || "1050"}</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1a2f4e] rounded-2xl border border-gray-200 dark:border-blue-800/30 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Working Hours</h3>
              {!isEditingWorkHours && (
                <button
                  onClick={() => setIsEditingWorkHours(true)}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-300"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingWorkHours ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 dark:text-blue-300/60">Monday - Friday</label>
                  <input
                    value={workHoursInputs.weekday}
                    onChange={(e) =>
                      setWorkHoursInputs((prev) => ({ ...prev, weekday: e.target.value }))
                    }
                    className="mt-1 w-full bg-white dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 dark:text-blue-300/60">Saturday</label>
                  <input
                    value={workHoursInputs.saturday}
                    onChange={(e) =>
                      setWorkHoursInputs((prev) => ({ ...prev, saturday: e.target.value }))
                    }
                    className="mt-1 w-full bg-white dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 rounded-lg px-3 py-2 text-sm text-gray-800 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setWorkHoursInputs(safeParseWorkingHours(profile.workingHoursJson));
                      setIsEditingWorkHours(false);
                    }}
                    className="px-3 py-2 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateWorkHours}
                    className="px-3 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="p-3 rounded-xl border border-gray-100 dark:border-blue-800/40 bg-gray-50 dark:bg-blue-900/20 flex items-center justify-between">
                  <span className="text-gray-600 dark:text-blue-300/80">Mon - Fri</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{workHoursInputs.weekday}</span>
                </div>
                <div className="p-3 rounded-xl border border-gray-100 dark:border-blue-800/40 bg-gray-50 dark:bg-blue-900/20 flex items-center justify-between">
                  <span className="text-gray-600 dark:text-blue-300/80">Saturday</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{workHoursInputs.saturday}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#1a2f4e] rounded-2xl border border-gray-200 dark:border-blue-800/30 p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Email Notifications</h3>

            {!profile?.emailNotificationsConfigured && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
                Email sender on server is not configured. Save/Toggle is temporarily disabled until admin sets MAIL_USER/MAIL_PASS.
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-blue-300/80">
                <Bell size={16} /> Enable Notifications
              </div>
              <button
                onClick={handleToggleEmail}
                disabled={!profile?.emailNotificationsConfigured}
                className={`w-12 h-6 rounded-full p-1 transition-colors ${
                  myEmailEnabled ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                } ${!profile?.emailNotificationsConfigured ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    myEmailEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                ></div>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Mail size={14} className="absolute left-3 top-3 text-gray-400 dark:text-blue-300/50" />
                <input
                  type="email"
                  value={myNotifyEmail}
                  onChange={(e) => setMyNotifyEmail(e.target.value)}
                  disabled={!myEmailEnabled}
                  className="w-full bg-white dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-800 dark:text-white disabled:opacity-60"
                  placeholder="notification email"
                />
              </div>
              <button
                onClick={handleSavePreference}
                disabled={savingPreference || !profile?.emailNotificationsConfigured}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Save size={15} /> Save
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-blue-300/60">
              {myEmailEnabled
                ? "System will send IT notifications to this email."
                : "Email notifications are currently disabled."}
            </p>
          </div>

          <button
            onClick={toggleTheme}
            className="w-full bg-white dark:bg-[#1a2f4e] text-gray-700 dark:text-white font-medium p-4 rounded-2xl border border-gray-200 dark:border-blue-800/40 flex items-center justify-between px-6 shadow-sm hover:bg-gray-50 dark:hover:bg-[#1e3558] transition-all duration-300"
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon size={20} className="text-blue-300" />
              ) : (
                <Sun size={20} className="text-amber-500" />
              )}
              <span>Appearance</span>
            </div>
            <span className="text-sm font-medium text-gray-500 dark:text-blue-400/60">
              {isDarkMode ? "Dark Mode" : "Light Mode"}
            </span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-white dark:bg-[#1a2f4e] text-blue-600 dark:text-blue-300 font-medium p-4 rounded-2xl border border-gray-200 dark:border-blue-800/40 flex items-center justify-center gap-2 shadow-sm hover:bg-blue-50 dark:hover:bg-[#1e3558] hover:border-blue-200 dark:hover:border-blue-700/60 transition-all duration-300"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </div>
    </ITWrapper>
  );
};

export default ITProfile;
