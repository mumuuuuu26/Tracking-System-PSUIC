import React, { useState, useEffect, useCallback } from "react";
import {
    Camera,
    Edit2,
    Check,
    X,
    ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/auth-store";
import { currentUser } from "../../api/auth";
import { updateProfileImage, updateProfile } from "../../api/user";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { getImageUrl } from "../../utils/imageUrl";
import { confirmLogout } from "../../utils/sweetalert";
import AdminWrapper from "../../components/admin/AdminWrapper";
import AdminHeader from "../../components/admin/AdminHeader";

const AdminProfile = () => {
    const { token, checkUser } = useAuthStore();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Edit States
    const [isEditingName, setIsEditingName] = useState(false);
    const [nameInput, setNameInput] = useState("");

    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [phoneInput, setPhoneInput] = useState("");

    const fetchProfile = useCallback(async () => {
        try {
            const res = await currentUser(token);
            setProfile(res.data);
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
                await updateProfileImage(base64Image);
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
            await updateProfile(payload);
            toast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated!`);
            setProfile({ ...profile, ...payload });
            await checkUser();
            closeEditFn(false);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || `Failed to update ${field} `);
        }
    };

    if (loading)
        return (
            <div className="p-10 text-center text-gray-500 animate-pulse">
                Loading Profile...
            </div>
        );
    if (!profile) return null;

    const displayName = profile.name || (profile.email ? profile.email.split('@')[0] : "Admin");

    return (
        <AdminWrapper>
            <div className="flex flex-col h-full px-6 pt-6 pb-24 space-y-6 overflow-y-auto relative">
                {/* Header Card */}
                <AdminHeader
                    title="My Profile"
                    subtitle="Manage your account settings"
                    onBack={() => navigate(-1)}
                />

                <div className="w-full space-y-6 relative z-10">

                    {/* Profile Header Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center text-center">
                        <div className="relative w-28 h-28 mb-4 group">
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-blue-50">
                                {profile.picture ? (
                                    <img
                                        src={getImageUrl(profile.picture)}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = '/default-profile.svg'; }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-[#1e2e4a] text-white text-4xl font-bold">
                                        {displayName.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <label
                                htmlFor="profile-upload"
                                className="absolute bottom-0 right-0 bg-[#1e2e4a] text-white p-2 rounded-full cursor-pointer hover:bg-[#15325b] transition-colors border-2 border-white shadow-sm"
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
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {displayName}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setNameInput(profile.name || displayName);
                                            setIsEditingName(true);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="text-gray-500 text-sm mb-3">{profile.email}</p>
                        <div className="bg-blue-50 text-blue-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            {profile.role || "ADMINISTRATOR"}
                        </div>
                    </div>

                    {/* Details Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="divide-y divide-gray-50">
                            {/* PSU ID (Username) */}
                            <div className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 font-medium mb-0.5">PSU ID</p>
                                    <p className="text-gray-900 font-semibold text-sm">{profile.username || "-"}</p>
                                </div>
                            </div>

                            {/* Email Address */}
                            <div className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 font-medium mb-0.5">Email Address</p>
                                    <p className="text-gray-900 font-semibold text-sm">{profile.email}</p>
                                </div>
                            </div>

                            {/* Phone Number */}
                            <div className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors group">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-gray-400 font-medium mb-0.5">Phone Number</p>
                                        {!isEditingPhone && (
                                            <button
                                                onClick={() => {
                                                    setPhoneInput(profile.phoneNumber || "");
                                                    setIsEditingPhone(true);
                                                }}
                                                className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 text-xs font-bold flex items-center gap-1 transition-all"
                                            >
                                                <Edit2 size={12} /> Edit
                                            </button>
                                        )}
                                    </div>

                                    {isEditingPhone ? (
                                        <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200 mt-1">
                                            <input
                                                type="text"
                                                value={phoneInput}
                                                onChange={(e) => setPhoneInput(e.target.value)}
                                                className="border-b-2 border-blue-500 font-semibold text-gray-800 text-sm focus:outline-none bg-transparent w-full"
                                                autoFocus
                                                placeholder="Set phone number"
                                            />
                                            <button
                                                onClick={() => handleUpdateField('phoneNumber', phoneInput, null, setIsEditingPhone)}
                                                className="p-1 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                                            >
                                                <Check size={14} strokeWidth={3} />
                                            </button>
                                            <button
                                                onClick={() => setIsEditingPhone(false)}
                                                className="p-1 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                                            >
                                                <X size={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-gray-900 font-semibold text-sm">{profile.phoneNumber || "-"}</p>
                                    )}
                                </div>
                            </div>

                            {/* Member Since */}
                            <div className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
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
                        onClick={async () => {
                            const isConfirmed = await confirmLogout();
                            if (isConfirmed) {
                                useAuthStore.getState().actionLogout();
                                navigate("/");
                            }
                        }}
                        className="w-full bg-white text-gray-400 font-bold p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center gap-2 hover:bg-gray-50 hover:text-gray-600 transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                        Log Out
                    </button>

                </div>
            </div>
        </AdminWrapper>
    );
};

export default AdminProfile;
