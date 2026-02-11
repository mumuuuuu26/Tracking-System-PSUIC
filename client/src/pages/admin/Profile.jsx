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
            <div className="flex flex-col h-full px-6 pt-6 pb-6 space-y-6 overflow-y-auto">
                {/* Header Card */}
                <AdminHeader
                    title="My Profile"
                    subtitle="Manage your account settings"
                    onBack={() => navigate(-1)}
                />

                <div className="max-w-7xl mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column: Avatar & Identity */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center h-full">
                                <div className="relative w-40 h-40 mb-6 group">
                                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-xl ring-4 ring-gray-50">
                                        {profile.picture ? (
                                            <img
                                                src={getImageUrl(profile.picture)}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.src = '/default-profile.png'; }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-[#1e2e4a] text-white text-5xl font-bold">
                                                {displayName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <label
                                        htmlFor="profile-upload"
                                        className="absolute bottom-2 right-2 bg-[#1e2e4a] text-white p-3 rounded-full cursor-pointer hover:bg-[#15325b] transition-all border-4 border-white shadow-lg hover:scale-110 active:scale-95"
                                    >
                                        <Camera size={20} />
                                    </label>
                                    <input
                                        id="profile-upload"
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                </div>

                                <h2 className="text-2xl font-bold text-[#1e2e4a] mb-2 break-all">
                                    {displayName}
                                </h2>
                                <p className="text-gray-500 font-medium mb-6">{profile.email}</p>

                                <div className="bg-blue-50 text-blue-600 px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider mb-8">
                                    {profile.role || "ADMINISTRATOR"}
                                </div>

                                <div className="w-full border-t border-gray-100 pt-8 mt-auto">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Member Since</div>
                                    <div className="font-medium text-gray-700">
                                        {profile.createdAt
                                            ? dayjs(profile.createdAt).format("MMMM D, YYYY")
                                            : "N/A"}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Details */}
                        <div className="lg:col-span-8">
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 h-full">
                                <h3 className="text-xl font-bold text-[#1e2e4a] mb-6 flex items-center gap-3">
                                    Personal Information
                                    <div className="h-px flex-1 bg-gray-100"></div>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8">
                                    {/* PSU ID (Username) - Readonly */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">PSU ID</label>
                                        <div className="flex items-center gap-3 bg-gray-50/50 rounded-xl px-4 py-3.5 border border-gray-100 hover:border-gray-200 transition-colors">
                                            <span className="text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                            </span>
                                            <span className="text-gray-700 font-semibold">{profile.username || "-"}</span>
                                        </div>
                                    </div>

                                    {/* Full Name - Editable */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Full Name</label>
                                        {isEditingName ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={nameInput}
                                                    onChange={(e) => setNameInput(e.target.value)}
                                                    className="flex-1 bg-white border-2 border-blue-500 rounded-xl px-4 py-3 text-[#1e2e4a] font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleUpdateField('name', nameInput, null, setIsEditingName)}
                                                    className="p-3.5 bg-[#1e2e4a] text-white rounded-xl hover:bg-[#15325b] transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setIsEditingName(false)}
                                                    className="p-3.5 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between bg-gray-50/50 rounded-xl px-4 py-3.5 border border-gray-100 group hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-400 group-hover:text-blue-400 transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                    </span>
                                                    <span className="text-[#1e2e4a] font-bold">{displayName}</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setNameInput(profile.name || displayName);
                                                        setIsEditingName(true);
                                                    }}
                                                    className="text-gray-300 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Email Address - Readonly */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email Address</label>
                                        <div className="flex items-center gap-3 bg-gray-50/50 rounded-xl px-4 py-3.5 border border-gray-100 hover:border-gray-200 transition-colors">
                                            <span className="text-gray-400">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                            </span>
                                            <span className="text-gray-700 font-semibold">{profile.email}</span>
                                        </div>
                                    </div>

                                    {/* Phone Number - Editable */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Phone Number</label>
                                        {isEditingPhone ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={phoneInput}
                                                    onChange={(e) => setPhoneInput(e.target.value)}
                                                    className="flex-1 bg-white border-2 border-blue-500 rounded-xl px-4 py-3 text-[#1e2e4a] font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                                    autoFocus
                                                />
                                                <button
                                                    onClick={() => handleUpdateField('phoneNumber', phoneInput, null, setIsEditingPhone)}
                                                    className="p-3.5 bg-[#1e2e4a] text-white rounded-xl hover:bg-[#15325b] transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setIsEditingPhone(false)}
                                                    className="p-3.5 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between bg-gray-50/50 rounded-xl px-4 py-3.5 border border-gray-100 group hover:border-blue-200 hover:bg-blue-50/30 transition-all">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-400 group-hover:text-blue-400 transition-colors">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                                    </span>
                                                    <span className="text-[#1e2e4a] font-bold">{profile.phoneNumber || "-"}</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setPhoneInput(profile.phoneNumber || "");
                                                        setIsEditingPhone(true);
                                                    }}
                                                    className="text-gray-300 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminWrapper>
    );
};

export default AdminProfile;
