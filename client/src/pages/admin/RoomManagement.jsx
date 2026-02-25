import React, { useState, useEffect, useCallback } from "react";
import { Search, MapPin, Plus, Edit, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { listRooms, createRoom, updateRoom, removeRoom } from "../../api/room";
import { toast } from "react-toastify";
import AdminWrapper from "../../components/admin/AdminWrapper";
import AdminHeader from "../../components/admin/AdminHeader";
import { toFloorDisplay, toRoomDisplay } from "../../utils/roomDisplay";

const normalizeRoomInput = (value) =>
    String(value ?? "").replace(/^room\s*/i, "").trim();

const normalizeFloorInput = (value) =>
    String(value ?? "")
        .replace(/^floor\s*/i, "")
        .replace(/^fl\.?\s*/i, "")
        .trim();

const RoomManagement = () => {
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
            const res = await listRooms();
            setRooms(res.data);
            setFilteredRooms(res.data);
        } catch {
            toast.error("Failed to load rooms");
        }
    }, []);

    useEffect(() => {
        loadRooms();
    }, [loadRooms]);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        setFilteredRooms(rooms.filter(room =>
            String(room.roomNumber ?? "").toLowerCase().includes(lowerTerm) ||
            String(room.building ?? "").toLowerCase().includes(lowerTerm) ||
            String(room.floor ?? "").includes(lowerTerm)
        ));
    }, [searchTerm, rooms]);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setFormData({ roomNumber: "", building: "", floor: "" });
        setIsModalOpen(true);
    };

    const openEditModal = (room) => {
        setIsEditMode(true);
        setCurrentRoomId(room.id);
        setFormData({
            roomNumber: normalizeRoomInput(room.roomNumber),
            building: room.building,
            floor: normalizeFloorInput(room.floor)
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            roomNumber: normalizeRoomInput(formData.roomNumber),
            building: String(formData.building ?? "").trim(),
            floor: normalizeFloorInput(formData.floor),
        };

        try {
            if (isEditMode) {
                await updateRoom(currentRoomId, payload);
                toast.success("Room updated successfully");
            } else {
                await createRoom(payload);
                toast.success("Room created successfully");
            }
            setIsModalOpen(false);
            loadRooms();
        } catch {
            toast.error(isEditMode ? "Failed to update room" : "Failed to create room");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this room?")) {
            try {
                await removeRoom(id);
                toast.success("Room deleted successfully");
                loadRooms();
            } catch {
                toast.error("Failed to delete room");
            }
        }
    };

    return (
        <AdminWrapper>
            <div className="flex flex-col h-full px-6 pt-6 pb-6 space-y-6 overflow-y-auto">
                {/* Header Card */}
                <AdminHeader
                    title="Room Management"
                    subtitle="Manage rooms and locations"
                    onBack={() => navigate(-1)}
                />

                {/* Toolbar */}
                <div className="bg-white rounded-3xl p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 relative w-full">
                        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search room..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a] transition-all border border-gray-100 font-medium text-gray-700"
                        />
                    </div>
                    <button
                        onClick={openCreateModal}
                        className="w-full md:w-auto bg-[#1e2e4a] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#15233b] transition-all shadow-md hover:shadow-lg"
                    >
                        <Plus size={20} />
                        Add Room
                    </button>
                </div>

                {/* Stats / Count */}
                <div className="mb-6 ml-1">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Total Rooms <span className="text-gray-300 ml-1">({filteredRooms.length})</span>
                    </h2>
                </div>

                {/* Room List - Horizontal Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRooms.map((room) => (
                        <div key={room.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start gap-3">
                                <div className="min-w-0">
                                    <h3 className="font-bold text-[#1e2e4a] text-lg leading-tight break-words">{toRoomDisplay(room.roomNumber)}</h3>
                                    <p className="text-gray-400 text-xs font-medium mt-1">
                                        {room.building || "-"} • {toFloorDisplay(room.floor)}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0">
                                    <button
                                        onClick={() => openEditModal(room)}
                                        className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(room.id)}
                                        className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-green-50 text-green-600 tracking-wide uppercase">
                                    ACTIVE
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredRooms.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                            <MapPin size={40} />
                        </div>
                        <h3 className="text-gray-900 font-bold text-lg mb-1">No rooms found</h3>
                        <p className="text-gray-500 text-sm">
                            Try adjusting your search or add a new room.
                        </p>
                    </div>
                )}

                {/* Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2e4a]/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-xl font-bold text-[#1e2e4a]">
                                    {isEditMode ? "Edit Room" : "Add New Room"}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Room Number</label>
                                    <input
                                        type="text"
                                        name="roomNumber"
                                        value={formData.roomNumber}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a] outline-none transition-all placeholder-gray-400 font-medium text-gray-800"
                                        placeholder="e.g. LAB-301"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Building</label>
                                        <input
                                            type="text"
                                            name="building"
                                            value={formData.building}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a] outline-none transition-all placeholder-gray-400 font-medium text-gray-800"
                                            placeholder="PSUIC"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Floor</label>
                                        <input
                                            type="number"
                                            name="floor"
                                            value={formData.floor}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a] outline-none transition-all placeholder-gray-400 font-medium text-gray-800"
                                            placeholder="3"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-[#1e2e4a] text-white py-4 rounded-xl font-bold hover:bg-[#15325b] transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
                                >
                                    {isEditMode ? "Update Room" : "Create Room"}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminWrapper >
    );
};

export default RoomManagement;
