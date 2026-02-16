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
    ChevronLeft,
    Clock
} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { currentUser } from "../../api/auth";
import ITHeader from "../../components/it/ITHeader";
import ITPageHeader from "../../components/it/ITPageHeader"; // [NEW]
import { updateProfileImage, updateProfile } from "../../api/user";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { getImageUrl } from "../../utils/imageUrl";
import { confirmLogout } from "../../utils/sweetalert";

const ITProfile = () => {
    const navigate = useNavigate();
    const { token, checkUser, actionLogout } = useAuthStore();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Edit States
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState("");

    const [isEditingUsername, setIsEditingUsername] = useState(false);
    const [usernameInput, setUsernameInput] = useState("");

    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [phoneInput, setPhoneInput] = useState("");

    const [isEditingDept, setIsEditingDept] = useState(false);
    const [deptInput, setDeptInput] = useState("");

    // [New] Office Extension State
    const [isEditingOfficeExt, setIsEditingOfficeExt] = useState(false);
    const [officeExtInput, setOfficeExtInput] = useState("");

    // [New] Working Hours State
    const [isEditingWorkHours, setIsEditingWorkHours] = useState(false);
    const [workHoursInputs, setWorkHoursInputs] = useState({
        weekday: "09:00 AM - 06:00 PM",
        saturday: "09:00 AM - 01:00 PM"
    });

    // Email Preference States
    const [myEmailEnabled, setMyEmailEnabled] = useState(true);
    const [myNotifyEmail, setMyNotifyEmail] = useState("");

    const fetchProfile = React.useCallback(async () => {
        try {
            const res = await currentUser(token);
            setProfile(res.data);
            setMyEmailEnabled(res.data.isEmailEnabled !== false);
            setMyNotifyEmail(res.data.notificationEmail || res.data.email || "");

            // [New] Init Fields
            setOfficeExtInput(res.data.officeExtension || "1050");
            if (res.data.workingHoursJson) {
                try {
                    const parsed = JSON.parse(res.data.workingHoursJson);
                    setWorkHoursInputs(parsed);
                } catch (e) {
                    console.error("Error parsing working hours", e);
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load profile");
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

    const handleUpdateField = async (field, value, updateStateFn, closeEditFn) => {
        try {
            const payload = { [field]: value };
            await updateProfile(token, payload);
            toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated!`);
            setProfile({ ...profile, ...payload });
            await checkUser();
            closeEditFn(false);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || `Failed to update ${field}`);
        }
    };

    const handleSaveWorkingHours = async () => {
        try {
            const jsonString = JSON.stringify(workHoursInputs);
            await updateProfile(token, { workingHoursJson: jsonString });
            toast.success("Working hours updated!");
            setProfile({ ...profile, workingHoursJson: jsonString });
            setIsEditingWorkHours(false);
        } catch (err) {
            console.error(err);
            toast.error("Failed to update working hours");
        }
    };

    const handleSavePreference = async () => {
        try {
            await updateProfile(token, {
                isEmailEnabled: myEmailEnabled,
                notificationEmail: myNotifyEmail
            });
            await checkUser();
            toast.success("Preferences saved successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to save preferences");
        }
    }



    const handleToggleEmail = async () => {
        const newValue = !myEmailEnabled;
        setMyEmailEnabled(newValue);
        try {
            await updateProfile(token, {
                isEmailEnabled: newValue,
                notificationEmail: myNotifyEmail
            });
            await checkUser();
            toast.success(newValue ? "Notifications enabled" : "Notifications disabled");
        } catch (err) {
            console.error(err);
            setMyEmailEnabled(!newValue); // Revert
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
            <div className="p-10 text-center text-gray-500 animate-pulse">
                Loading Profile...
            </div>
        );
    if (!profile) return null;

    const displayName = profile.name || (profile.email ? profile.email.split('@')[0] : "IT Support");

    return (
        <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <ITPageHeader title="My Profile" />

            {/* Desktop Header */}
            <div className="hidden lg:block">
                <ITHeader
                    title="My Profile"
                    subtitle="Manage your personal information and settings"
                    onBack={() => navigate(-1)}
                />
            </div>

            <div className="mt-6 space-y-4">
                {/* Profile Header Card */}
                <div className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3 pointer-events-none transition-transform duration-700 group-hover:scale-110"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="relative group/avatar">
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-white shadow-lg overflow-hidden relative bg-gray-100">
                                {profile.picture ? (
                                    <img
                                        src={getImageUrl(profile.picture)}
                                        alt="Profile"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/avatar:scale-110"
                                        onError={(e) => { e.target.src = '/default-profile.png'; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-600 text-white text-4xl font-bold">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}

                                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-all duration-300 backdrop-blur-[2px]">
                                    <Camera size={24} className="mb-1" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Change</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </label>
                            </div>
                            <div className="absolute bottom-1 right-1 w-8 h-8 bg-green-500 rounded-full border-[3px] border-white flex items-center justify-center shadow-md" title="Active">
                                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-3">
                            <div className="flex items-center justify-center md:justify-start gap-2">
                                {isEditingName ? (
                                    <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                                        <input
                                            type="text"
                                            value={nameInput}
                                            onChange={(e) => setNameInput(e.target.value)}
                                            className="border-b-2 border-blue-500 text-3xl font-bold text-[#1e2e4a] focus:outline-none bg-transparent w-full min-w-[200px]"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleUpdateField('name', nameInput, null, setIsEditingName)}
                                            className="p-1.5 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                                        >
                                            <Check size={16} strokeWidth={3} />
                                        </button>
                                        <button
                                            onClick={() => setIsEditingName(false)}
                                            className="p-1.5 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                        >
                                            <X size={16} strokeWidth={3} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="group flex items-center gap-2">
                                        <h2 className="text-3xl font-bold text-[#1e2e4a] mb-1">
                                            {displayName}
                                        </h2>
                                        <button
                                            onClick={() => {
                                                setNameInput(profile.name || displayName);
                                                setIsEditingName(true);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-500 font-medium">@{profile.username || "username"}</p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                                <span className="px-4 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold border border-blue-100 shadow-sm">
                                    {profile.role || "IT SUPPORT"}
                                </span>
                                <span className="px-4 py-1.5 rounded-xl bg-purple-50 text-purple-700 text-sm font-bold border border-purple-100 shadow-sm flex items-center gap-2">
                                    <Mail size={14} />
                                    {profile.email}
                                </span>
                            </div>
                        </div>

                        <div className="hidden md:block w-px h-24 bg-gray-100 mx-4"></div>

                        <div className="flex flex-col gap-3 min-w-[200px]">
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 hover:bg-white hover:shadow-md transition-all duration-300 group/stat">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover/stat:scale-110 transition-transform">
                                        <Briefcase size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Department</p>
                                            {!isEditingDept && (
                                                <button
                                                    onClick={() => {
                                                        setDeptInput(profile.department || "IT Support");
                                                        setIsEditingDept(true);
                                                    }}
                                                    className="opacity-0 group-hover/stat:opacity-100 text-blue-500 hover:text-blue-700"
                                                >
                                                    <Edit2 size={12} />
                                                </button>
                                            )}
                                        </div>
                                        {isEditingDept ? (
                                            <div className="flex items-center gap-1 mt-1">
                                                <input
                                                    type="text"
                                                    value={deptInput}
                                                    onChange={(e) => setDeptInput(e.target.value)}
                                                    className="border-b-2 border-blue-500 font-bold text-gray-800 text-sm w-full bg-transparent focus:outline-none"
                                                    autoFocus
                                                />
                                                <button onClick={() => handleUpdateField('department', deptInput, null, setIsEditingDept)} className="text-green-600"><Check size={14} /></button>
                                                <button onClick={() => setIsEditingDept(false)} className="text-red-600"><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <p className="text-gray-800 font-bold">{profile.department || "IT Support"}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Working Hours */}
                    {/* Working Hours */}
                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Working Hours</h3>
                                    <p className="text-sm text-gray-500">Your daily schedule</p>
                                </div>
                            </div>
                            {!isEditingWorkHours && (
                                <button
                                    onClick={() => setIsEditingWorkHours(true)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                >
                                    <Edit2 size={16} />
                                </button>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-indigo-50/30 hover:border-indigo-100 transition-colors gap-2">
                                <span className="text-gray-600 font-medium">Monday - Friday</span>
                                {isEditingWorkHours ? (
                                    <input
                                        type="text"
                                        value={workHoursInputs.weekday}
                                        onChange={(e) => setWorkHoursInputs({ ...workHoursInputs, weekday: e.target.value })}
                                        className="font-bold text-[#1e2e4a] bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200 focus:ring-2 focus:ring-indigo-100 outline-none w-full sm:w-auto text-right"
                                    />
                                ) : (
                                    <span className="font-bold text-[#1e2e4a] bg-white px-3 py-1 rounded-lg shadow-sm">{workHoursInputs.weekday}</span>
                                )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-indigo-50/30 hover:border-indigo-100 transition-colors gap-2">
                                <span className="text-gray-600 font-medium">Saturday</span>
                                {isEditingWorkHours ? (
                                    <input
                                        type="text"
                                        value={workHoursInputs.saturday}
                                        onChange={(e) => setWorkHoursInputs({ ...workHoursInputs, saturday: e.target.value })}
                                        className="font-bold text-[#1e2e4a] bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-200 focus:ring-2 focus:ring-indigo-100 outline-none w-full sm:w-auto text-right"
                                    />
                                ) : (
                                    <span className="font-bold text-[#1e2e4a] bg-white px-3 py-1 rounded-lg shadow-sm">{workHoursInputs.saturday}</span>
                                )}
                            </div>

                            {isEditingWorkHours && (
                                <div className="flex justify-end gap-2 mt-2">
                                    <button onClick={() => setIsEditingWorkHours(false)} className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700">Cancel</button>
                                    <button onClick={handleSaveWorkingHours} className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">Save</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Contact Info Card */}
                    <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Contact Info</h3>
                                <p className="text-sm text-gray-500">How others can reach you</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-orange-50/30 hover:border-orange-100 transition-colors">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Office Extension</p>
                                    {!isEditingOfficeExt && (
                                        <button
                                            onClick={() => setIsEditingOfficeExt(true)}
                                            className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 transition-opacity"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                    )}
                                </div>
                                {isEditingOfficeExt ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="text"
                                            value={officeExtInput}
                                            onChange={(e) => setOfficeExtInput(e.target.value)}
                                            className="border-b-2 border-orange-500 font-bold text-gray-800 text-sm w-full bg-transparent focus:outline-none"
                                            autoFocus
                                        />
                                        <button onClick={() => handleUpdateField('officeExtension', officeExtInput, null, setIsEditingOfficeExt)} className="text-green-600"><Check size={14} /></button>
                                        <button onClick={() => setIsEditingOfficeExt(false)} className="text-red-600"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Phone size={16} className="text-gray-400" />
                                        <span className="font-bold text-[#1e2e4a]">{officeExtInput}</span>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-orange-50/30 hover:border-orange-100 transition-colors">
                                <div className="flex justify-between items-start">
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Mobile</p>
                                    {!isEditingPhone && (
                                        <button
                                            onClick={() => {
                                                setPhoneInput(profile.phoneNumber || "");
                                                setIsEditingPhone(true);
                                            }}
                                            className="text-blue-500 hover:text-blue-700"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                    )}
                                </div>

                                {isEditingPhone ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="text"
                                            value={phoneInput}
                                            onChange={(e) => setPhoneInput(e.target.value)}
                                            className="border-b-2 border-blue-500 font-bold text-gray-800 text-sm w-full bg-transparent focus:outline-none"
                                            autoFocus
                                        />
                                        <button onClick={() => handleUpdateField('phoneNumber', phoneInput, null, setIsEditingPhone)} className="text-green-600"><Check size={14} /></button>
                                        <button onClick={() => setIsEditingPhone(false)} className="text-red-600"><X size={14} /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Phone size={16} className="text-gray-400" />
                                        <span className="font-bold text-[#1e2e4a]">{profile.phoneNumber || "Not provided"}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications & Settings */}
                <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Settings size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">Notifications & Settings</h3>
                            <p className="text-xs text-gray-500">Manage how you receive alerts and system templates</p>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-bold text-gray-700 text-sm">Receive Email Notifications</span>
                            <button
                                onClick={handleToggleEmail}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 relative ${myEmailEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${myEmailEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </button>
                        </div>

                        {myEmailEnabled && (
                            <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                <input
                                    type="email"
                                    value={myNotifyEmail}
                                    onChange={(e) => setMyNotifyEmail(e.target.value)}
                                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-indigo-100 outline-none"
                                    placeholder="Enter your email..."
                                />
                                <button
                                    onClick={handleSavePreference}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 transition flex items-center gap-2 text-sm"
                                >
                                    <Save size={16} /> Save
                                </button>
                            </div>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                            {myEmailEnabled ? "Notification emails will be sent to this address." : "You won't receive any email notifications."}
                        </p>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full bg-white text-gray-400 font-bold p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-gray-600 transition-all"
                >
                    <LogOut size={20} />
                    Log Out
                </button>
            </div>
        </div>
    );
};

export default ITProfile;
