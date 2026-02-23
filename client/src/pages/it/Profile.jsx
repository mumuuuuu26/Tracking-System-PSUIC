import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    Mail,
    Camera,
    LogOut,
    Edit2,
    Check,
    X,
    Phone,
    Briefcase,
    Settings,
    Save,
    ChevronDown,
    Clock,
    Moon,
    Sun,
} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import useThemeStore from "../../store/themeStore";
import { currentUser } from "../../api/auth";
import ITHeader from "../../components/it/ITHeader";
import ITPageHeader from "../../components/it/ITPageHeader";
import ITWrapper from "../../components/it/ITWrapper";
import { updateProfileImage, updateProfile } from "../../api/user";
import { toast } from "react-toastify";
import { confirmLogout } from "../../utils/sweetalert";
import ProfileAvatar from "../../components/common/ProfileAvatar";
import { getUserDisplayName } from "../../utils/userIdentity";
import Swal from "sweetalert2";

const ITProfile = () => {
    const navigate = useNavigate();
    const { checkUser, actionLogout } = useAuthStore();
    const { isDarkMode, toggleTheme } = useThemeStore();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        department: "",
        position: ""
    });

    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [phoneInput, setPhoneInput] = useState("");

    const [isEditingOfficeExt, setIsEditingOfficeExt] = useState(false);
    const [officeExtInput, setOfficeExtInput] = useState("");

    const [isEditingWorkHours, setIsEditingWorkHours] = useState(false);
    const [workHoursInputs, setWorkHoursInputs] = useState({
        weekday: "09:00 AM - 06:00 PM",
        saturday: "09:00 AM - 01:00 PM"
    });

    const [myEmailEnabled, setMyEmailEnabled] = useState(true);
    const [myNotifyEmail, setMyNotifyEmail] = useState("");
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const fetchProfile = React.useCallback(async () => {
        try {
            const res = await currentUser();
            setProfile(res.data);
            setMyEmailEnabled(res.data.isEmailEnabled !== false);
            setMyNotifyEmail(res.data.notificationEmail || res.data.email || "");

            setFormData({
                name: res.data.name || "",
                phone: res.data.phoneNumber || "",
                department: res.data.department || "",
                position: res.data.position || ""
            });

            setOfficeExtInput(res.data.officeExtension || "1050");
            if (res.data.workingHoursJson) {
                try {
                    const parsed = JSON.parse(res.data.workingHoursJson);
                    setWorkHoursInputs(parsed);
                } catch {
                    // Ignore JSON parsing errors for working hours
                }
            }
        } catch {
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Image too large (max 5MB)");
            return;
        }

        setUploading(true);
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
            } finally {
                setUploading(false);
            }
        };
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateProfile({
                name: formData.name,
                phoneNumber: formData.phone,
                department: formData.department,
                position: formData.position
            });
            toast.success("Profile updated!");

            setProfile(prev => ({
                ...prev,
                name: formData.name,
                phoneNumber: formData.phone,
                department: formData.department,
                position: formData.position
            }));

            await checkUser();
            setIsEditing(false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateField = async (field, value, updateStateFn, closeEditFn) => {
        try {
            const payload = { [field]: value };
            await updateProfile(payload);
            toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated!`);
            setProfile(prev => ({ ...prev, ...payload }));
            await checkUser();
            closeEditFn(false);
        } catch (err) {
            toast.error(err.response?.data?.message || `Failed to update ${field}`);
        }
    };

    const handleSavePreference = async () => {
        try {
            await updateProfile({
                isEmailEnabled: myEmailEnabled,
                notificationEmail: myNotifyEmail
            });
            await checkUser();
            toast.success("Preferences saved successfully");
        } catch {
            toast.error("Failed to save preferences");
        }
    }

    const handleToggleEmail = async () => {
        const newValue = !myEmailEnabled;
        setMyEmailEnabled(newValue);
        try {
            await updateProfile({
                isEmailEnabled: newValue,
                notificationEmail: myNotifyEmail
            });
            await checkUser();
            toast.success(newValue ? "Notifications enabled" : "Notifications disabled");
        } catch {
            setMyEmailEnabled(!newValue);
            toast.error("Failed to update preference");
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
            <div className="p-10 text-center text-gray-500 dark:text-blue-300/60 animate-pulse bg-gray-50 dark:bg-[#0d1b2a] min-h-screen">
                Loading Profile...
            </div>
        );
    if (!profile) return null;

    const displayName = getUserDisplayName(profile, "IT Support");

    return (
        <ITWrapper>
            <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <ITPageHeader title="Profile" />

                {/* Desktop Header */}
                <div className="hidden lg:block">
                    <ITHeader
                        title="Profile"
                        subtitle="Manage your account settings and preferences"
                        onBack={() => navigate(-1)}
                    />
                </div>

                <div className="mt-6 pb-24 max-w-7xl mx-auto w-full px-4 flex flex-col gap-6">
                    {/* Main Profile Card */}
                    <div className="bg-white dark:bg-[#1a2f4e] rounded-[1.5rem] p-6 shadow-sm dark:shadow-lg border border-gray-100 dark:border-blue-800/30 flex flex-col items-center text-center relative overflow-hidden">

                        {/* Top Actions */}
                        <div className="absolute top-4 right-4 flex space-x-2 z-10">
                            {isEditing ? (
                                <>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                                        title="Save Changes"
                                    >
                                        <Check size={20} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setFormData({
                                                name: profile.name || "",
                                                phone: profile.phoneNumber || "",
                                                department: profile.department || "",
                                                position: profile.position || ""
                                            });
                                        }}
                                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                        title="Cancel"
                                    >
                                        <X size={20} />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                    title="Edit Profile"
                                >
                                    <Edit2 size={18} />
                                </button>
                            )}
                        </div>

                        {/* Avatar Section */}
                        <div className="relative group mb-4">
                            <div className="w-28 h-28 rounded-full border-4 border-white dark:border-blue-800/40 shadow-lg overflow-hidden relative bg-white dark:bg-[#0d1b2a]">
                                <ProfileAvatar
                                    user={profile}
                                    alt="Profile"
                                    className="w-full h-full"
                                    imageClassName="w-full h-full object-cover"
                                    fallbackClassName="w-full h-full bg-[#1e2e4a] dark:bg-blue-800 flex items-center justify-center text-white"
                                    initialsClassName="text-3xl font-bold"
                                />

                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                    {uploading ? (
                                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white/50 border-t-white" />
                                    ) : (
                                        <Camera className="text-white w-8 h-8" />
                                    )}
                                </label>
                            </div>
                            <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-2 border-white dark:border-[#1a2f4e] rounded-full"></div>
                        </div>

                        {/* Name & Role */}
                        {isEditing ? (
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="text-xl font-bold text-center text-[#1e2e4a] dark:text-white bg-gray-50 dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 rounded-lg px-4 py-1 mb-1 w-full max-w-xs focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Your Name"
                            />
                        ) : (
                            <h2 className="text-2xl font-bold text-[#1e2e4a] dark:text-white mb-1">{displayName}</h2>
                        )}

                        <p className="text-gray-500 dark:text-blue-300/70 font-medium mb-4">{profile.email}</p>

                        <div className="flex flex-wrap justify-center gap-3 w-full max-w-md">
                            {/* Position */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-blue-900/20 rounded-xl text-sm font-medium text-gray-600 dark:text-blue-300/80 border border-gray-100 dark:border-blue-800/30 w-full sm:w-auto justify-center">
                                <Briefcase size={16} className="text-blue-500 dark:text-blue-400" />
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                        className="bg-transparent border-b border-gray-300 dark:border-blue-700/50 focus:border-blue-500 dark:focus:border-blue-400 outline-none w-24 text-center dark:text-white"
                                        placeholder="Position"
                                    />
                                ) : (
                                    <span>{profile.position || "IT Support Specialist"}</span>
                                )}
                            </div>

                            {/* Department */}
                            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-blue-900/20 rounded-xl text-sm font-medium text-gray-600 dark:text-blue-300/80 border border-gray-100 dark:border-blue-800/30 w-full sm:w-auto justify-center">
                                <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"></span>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                        className="bg-transparent border-b border-gray-300 dark:border-blue-700/50 focus:border-blue-500 dark:focus:border-blue-400 outline-none w-24 text-center dark:text-white"
                                        placeholder="Department"
                                    />
                                ) : (
                                    <span>{profile.department || "IT Department"}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Info Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Working Hours */}
                        <div className="bg-white dark:bg-[#1a2f4e] rounded-[1.5rem] p-6 shadow-sm dark:shadow-lg border border-gray-100 dark:border-blue-800/30 hover:shadow-md dark:hover:shadow-blue-900/20 transition-all duration-300 group">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Working Hours</h3>
                                        <p className="text-xs text-gray-500 dark:text-blue-300/60 font-medium">Weekly Schedule</p>
                                    </div>
                                </div>
                                {!isEditingWorkHours && (
                                    <button
                                        onClick={() => setIsEditingWorkHours(true)}
                                        className="p-2 text-gray-400 dark:text-blue-300/50 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-4">
                                {isEditingWorkHours ? (
                                    <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                                        <div className="bg-gray-50 dark:bg-blue-900/20 p-4 rounded-xl border border-gray-200 dark:border-blue-800/30">
                                            <label className="block text-xs font-bold text-gray-500 dark:text-blue-300/60 uppercase tracking-wider mb-2">Monday - Friday</label>
                                            <input
                                                type="text"
                                                value={workHoursInputs.weekday}
                                                onChange={(e) => setWorkHoursInputs(prev => ({ ...prev, weekday: e.target.value }))}
                                                className="w-full bg-white dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 rounded-lg p-2.5 text-sm font-bold text-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none"
                                            />
                                        </div>
                                        <div className="bg-gray-50 dark:bg-blue-900/20 p-4 rounded-xl border border-gray-200 dark:border-blue-800/30">
                                            <label className="block text-xs font-bold text-gray-500 dark:text-blue-300/60 uppercase tracking-wider mb-2">Saturday</label>
                                            <input
                                                type="text"
                                                value={workHoursInputs.saturday}
                                                onChange={(e) => setWorkHoursInputs(prev => ({ ...prev, saturday: e.target.value }))}
                                                className="w-full bg-white dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 rounded-lg p-2.5 text-sm font-bold text-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none"
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end pt-2">
                                            <button
                                                onClick={() => setIsEditingWorkHours(false)}
                                                className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-blue-300/70 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleUpdateField('workingHoursJson', JSON.stringify(workHoursInputs), null, setIsEditingWorkHours)}
                                                className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 transition"
                                            >
                                                Save Hours
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-blue-900/20 rounded-xl border border-gray-100 dark:border-blue-800/30">
                                            <span className="text-gray-500 dark:text-blue-300/70 font-medium text-sm">Mon - Fri</span>
                                            <span className="font-bold text-[#1e2e4a] dark:text-white text-sm">{workHoursInputs.weekday}</span>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-blue-900/20 rounded-xl border border-gray-100 dark:border-blue-800/30">
                                            <span className="text-gray-500 dark:text-blue-300/70 font-medium text-sm">Saturday</span>
                                            <span className="font-bold text-[#1e2e4a] dark:text-white text-sm">{workHoursInputs.saturday}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="bg-white dark:bg-[#1a2f4e] rounded-[1.5rem] p-6 shadow-sm dark:shadow-lg border border-gray-100 dark:border-blue-800/30 hover:shadow-md dark:hover:shadow-blue-900/20 transition-all duration-300 group">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">Contact Info</h3>
                                    <p className="text-xs text-gray-500 dark:text-blue-300/60 font-medium">Direct Lines</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {/* Mobile Phone */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-blue-900/20 rounded-xl border border-gray-100 dark:border-blue-800/30 group/item hover:border-teal-100 dark:hover:border-teal-700/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-[#0d1b2a] flex items-center justify-center text-teal-500 dark:text-teal-400 shadow-sm">
                                            <Phone size={14} />
                                        </div>
                                        <span className="text-gray-500 dark:text-blue-300/70 font-medium text-sm">Mobile</span>
                                    </div>
                                    {isEditingPhone ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={phoneInput}
                                                onChange={(e) => setPhoneInput(e.target.value)}
                                                className="w-32 bg-white dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 rounded-lg px-2 py-1 text-sm font-bold text-[#1e2e4a] dark:text-white focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/30 outline-none"
                                                autoFocus
                                            />
                                            <button onClick={() => handleUpdateField('phoneNumber', phoneInput, null, setIsEditingPhone)} className="text-green-600 dark:text-green-400 p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"><Check size={16} /></button>
                                            <button onClick={() => setIsEditingPhone(false)} className="text-red-600 dark:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><X size={16} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-[#1e2e4a] dark:text-white text-sm">{profile.phoneNumber || "Not Set"}</span>
                                            <button
                                                onClick={() => {
                                                    setPhoneInput(profile.phoneNumber || "");
                                                    setIsEditingPhone(true);
                                                }}
                                                className="opacity-0 group-hover/item:opacity-100 text-gray-400 dark:text-blue-300/40 hover:text-teal-600 dark:hover:text-teal-400 transition-all"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Office Extension */}
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-blue-900/20 rounded-xl border border-gray-100 dark:border-blue-800/30 group/item hover:border-teal-100 dark:hover:border-teal-700/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-[#0d1b2a] flex items-center justify-center text-teal-500 dark:text-teal-400 shadow-sm">
                                            <Briefcase size={14} />
                                        </div>
                                        <span className="text-gray-500 dark:text-blue-300/70 font-medium text-sm">Office Ext.</span>
                                    </div>
                                    {isEditingOfficeExt ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="text"
                                                value={officeExtInput}
                                                onChange={(e) => setOfficeExtInput(e.target.value)}
                                                className="w-24 bg-white dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 rounded-lg px-2 py-1 text-sm font-bold text-[#1e2e4a] dark:text-white focus:ring-2 focus:ring-teal-100 dark:focus:ring-teal-900/30 outline-none"
                                                autoFocus
                                            />
                                            <button onClick={() => handleUpdateField('officeExtension', officeExtInput, null, setIsEditingOfficeExt)} className="text-green-600 dark:text-green-400 p-1 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"><Check size={16} /></button>
                                            <button onClick={() => setIsEditingOfficeExt(false)} className="text-red-600 dark:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"><X size={16} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-[#1e2e4a] dark:text-white text-sm">Ext. {profile.officeExtension || "1050"}</span>
                                            <button
                                                onClick={() => {
                                                    setOfficeExtInput(profile.officeExtension || "1050");
                                                    setIsEditingOfficeExt(true);
                                                }}
                                                className="opacity-0 group-hover/item:opacity-100 text-gray-400 dark:text-blue-300/40 hover:text-teal-600 dark:hover:text-teal-400 transition-all"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notifications & Settings */}
                    <div className="bg-white dark:bg-[#1a2f4e] rounded-[1.5rem] shadow-sm dark:shadow-lg border border-gray-100 dark:border-blue-800/30 p-6">
                        <button
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className="w-full flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                                    <Settings size={20} />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">Notifications</h3>
                                    <p className="text-xs text-gray-500 dark:text-blue-300/60">Manage alerts and preferences</p>
                                </div>
                            </div>
                            <div className={`text-gray-400 dark:text-blue-300/40 transition-transform duration-300 ${isSettingsOpen ? 'rotate-180' : ''}`}>
                                <ChevronDown size={24} />
                            </div>
                        </button>

                        {isSettingsOpen && (
                            <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="bg-gray-50 dark:bg-blue-900/20 rounded-xl p-4 border border-gray-200 dark:border-blue-800/30">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="font-bold text-gray-700 dark:text-white text-sm">Receive Email Notifications</span>
                                        <button
                                            onClick={handleToggleEmail}
                                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 relative ${myEmailEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                        >
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${myEmailEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                        </button>
                                    </div>

                                    {myEmailEnabled && (
                                        <div className="flex flex-col sm:flex-row gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <input
                                                type="email"
                                                value={myNotifyEmail}
                                                onChange={(e) => setMyNotifyEmail(e.target.value)}
                                                className="w-full sm:flex-1 bg-white dark:bg-[#0d1b2a] border border-gray-200 dark:border-blue-800/40 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none placeholder-gray-400 dark:placeholder-blue-400/40"
                                                placeholder="Enter your email..."
                                            />
                                            <button
                                                onClick={handleSavePreference}
                                                className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-md shadow-indigo-200 dark:shadow-indigo-900/30 hover:bg-indigo-700 transition flex items-center justify-center gap-2 text-sm shrink-0"
                                            >
                                                <Save size={16} /> Save
                                            </button>
                                        </div>
                                    )}
                                    <p className="text-xs text-gray-400 dark:text-blue-300/40 mt-2">
                                        {myEmailEnabled ? "Notification emails will be sent to this address." : "You won't receive any email notifications."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Theme Toggle — matching User Profile */}
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
                        className="w-full bg-white dark:bg-[#1a2f4e] text-gray-400 dark:text-blue-300/60 font-bold p-4 rounded-2xl shadow-sm dark:shadow-lg border border-gray-100 dark:border-blue-800/30 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-[#1e3558] hover:text-gray-600 dark:hover:text-white transition-all"
                    >
                        <LogOut size={20} />
                        Log Out
                    </button>

                </div>
            </div>
        </ITWrapper>
    );
};

export default ITProfile;
