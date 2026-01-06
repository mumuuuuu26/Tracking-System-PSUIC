import React, { useState, useEffect } from "react";
import {
    User,
    Mail,
    Hash,
    School,
    Award,
    Clock,
    Camera,
    Edit2,
    Save,
    X as XIcon,
    Phone,
    Briefcase
} from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { currentUser } from "../../api/auth";
import { updateProfileImage, updateProfile } from "../../api/user";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const ITProfile = () => {
    const { token, checkUser } = useAuthStore(); // [MODIFIED] Destructure checkUser
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        username: "",
        phoneNumber: "",
        department: "",
        name: ""
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await currentUser(token);
            setProfile(res.data);
            setFormData({
                email: res.data.email || "",
                username: res.data.username || "",
                phoneNumber: res.data.phoneNumber || "",
                department: res.data.department || "",
                name: res.data.name || ""
            });
        } catch (err) {
            console.error(err);
            toast.error("Failed to load profile");
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
                await checkUser(); // [NEW] Sync header immediately
                fetchProfile();
            } catch (err) {
                console.error(err);
                toast.error("Failed to update profile picture");
            }
        };
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await updateProfile(token, formData);
            toast.success("Profile updated successfully!");
            await checkUser(); // [NEW] Sync header immediately
            setIsEditing(false);
            fetchProfile();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to update profile");
        }
    };

    if (loading)
        return (
            <div className="p-10 text-center text-gray-500 animate-pulse">
                Loading Profile...
            </div>
        );

    if (!profile) return null;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen pb-24">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">IT Support Profile</h1>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        <Edit2 size={16} /> Edit Profile
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* --- Left Column: Identity Card --- */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden text-center p-6 relative">
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
                                        {profile.name ? profile.name.charAt(0).toUpperCase() : "IT"}
                                    </div>
                                )}
                            </div>

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
                            {profile.name || profile.username || "IT Support"}
                        </h2>
                        <p className="text-sm text-gray-500 mb-4 font-medium tracking-wide">
                            {profile.role ? profile.role.toUpperCase() : "IT SUPPORT"}
                        </p>

                        <div className="flex justify-center gap-2 mb-6">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 bg-green-100 text-green-700">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Active User
                            </span>
                        </div>
                    </div>
                </div>

                {/* --- Right Column: Details --- */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                            <User size={20} className="text-blue-600" /> Account Information
                        </h3>

                        {isEditing ? (
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="Set username"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address (For Notifications)</label>
                                    <input
                                        type="email"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.phoneNumber}
                                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <input
                                        type="text"
                                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                                        Save Changes
                                    </button>
                                    <button type="button" onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-200 transition">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-5">
                                <div className="group">
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Username</label>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <Hash size={18} className="text-blue-500" />
                                        <span className="font-semibold text-gray-700">{profile.username || "-"}</span>
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Email Address</label>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <Mail size={18} className="text-blue-500" />
                                        <span className="font-semibold text-gray-700">{profile.email || "No email set"}</span>
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Phone Number</label>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <Phone size={18} className="text-blue-500" />
                                        <span className="font-semibold text-gray-700">{profile.phoneNumber || "-"}</span>
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Department</label>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                        <Briefcase size={18} className="text-blue-500" />
                                        <span className="font-semibold text-gray-700">{profile.department || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ITProfile;
