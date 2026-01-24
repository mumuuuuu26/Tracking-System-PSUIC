import React, { useState, useEffect, useCallback } from "react";
import { Search, MapPin, MoreVertical, Plus, Edit, Trash2, X, Image, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { listRooms, createRoom, updateRoom, removeRoom } from "../../api/room";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";

const RoomManagement = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentRoomId, setCurrentRoomId] = useState(null);
    const [formData, setFormData] = useState({
        roomNumber: "",
        building: "",
        floor: ""
    });

    const loadRooms = useCallback(async () => {
        try {
            const res = await listRooms(token);
            setRooms(res.data);
            setFilteredRooms(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load rooms");
        }
    }, [token]);

    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        setFilteredRooms(rooms.filter(room =>
            room.roomNumber.toLowerCase().includes(lowerTerm) ||
            room.building.toLowerCase().includes(lowerTerm) ||
            room.floor.toString().includes(lowerTerm)
        ));
    }, [searchTerm, rooms]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setFormData({ roomNumber: "", building: "", floor: "", imageUrl: "" });
        setIsModalOpen(true);
    };

    const openEditModal = (room) => {
        setIsEditMode(true);
        setCurrentRoomId(room.id);
        setFormData({
            roomNumber: room.roomNumber,
            building: room.building,
            floor: room.floor,
            imageUrl: room.imageUrl || ""
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                await updateRoom(token, currentRoomId, formData);
                toast.success("Room updated successfully");
            } else {
                await createRoom(token, formData);
                toast.success("Room created successfully");
            }
            setIsModalOpen(false);
            loadRooms();
        } catch (err) {
            console.error(err);
            toast.error(isEditMode ? "Failed to update room" : "Failed to create room");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this room?")) {
            try {
                await removeRoom(token, id);
                toast.success("Room deleted successfully");
                loadRooms();
            } catch (err) {
                console.error(err);
                toast.error("Failed to delete room");
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            {/* Header */}
            <div className="bg-[#193C6C] px-6 pt-12 pb-6 shadow-md sticky top-0 z-20">
                <div className="flex items-center gap-4 text-white mb-2">
                    <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-2 -ml-2 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Room Management</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search room..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-200 shadow-sm"
                        />
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="bg-[#193C6C] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#15325b] transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        Add Room
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {filteredRooms.map((room) => (
                        <div key={room.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
                            {/* Room Image Placeholder */}
                            <div className="w-32 h-24 bg-gray-200 rounded-2xl overflow-hidden shrink-0 relative">
                                <img
                                    src={room.imageUrl || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=300&h=200"}
                                    alt="Room"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">Room {room.roomNumber}</h3>
                                        <p className="text-gray-500 text-sm">{room.building} • Floor {room.floor}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openEditModal(room)}
                                            className="text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(room.id)}
                                            className="text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                    <MapPin size={14} />
                                    <span>Building {room.building || '1'}, Floor {room.floor}</span>
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-semibold">
                                        Active
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl transform transition-all">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {isEditMode ? "Edit Room" : "Add New Room"}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number</label>
                                    <input
                                        type="text"
                                        name="roomNumber"
                                        value={formData.roomNumber}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="e.g. LAB-301"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                                    <input
                                        type="text"
                                        name="building"
                                        value={formData.building}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="PSUIC"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                                    <input
                                        type="number"
                                        name="floor"
                                        value={formData.floor}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="3"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Room Image</label>
                                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 transition-colors relative group">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setFormData({ ...formData, imageUrl: reader.result });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        {formData.imageUrl ? (
                                            <div className="relative h-40 w-full rounded-lg overflow-hidden">
                                                <img
                                                    src={formData.imageUrl}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <p className="text-white font-medium">Click to change</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-8 flex flex-col items-center text-gray-400">
                                                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center mb-2">
                                                    <Image size={24} />
                                                </div>
                                                <span className="text-sm font-medium">Click to upload image</span>
                                                <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                                >
                                    {isEditMode ? "Update Room" : "Create Room"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoomManagement;
