import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search, MapPin, Plus, Edit, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { listRooms, createRoom, updateRoom, removeRoom } from "../../api/room";
import { toast } from "react-toastify";
import AdminWrapper from "../../components/admin/AdminWrapper";
import AdminHeader from "../../components/admin/AdminHeader";
import { toFloorDisplay, toRoomDisplay } from "../../utils/roomDisplay";
import { confirmDialog } from "../../utils/sweetalert";

const normalizeRoomInput = (value) =>
  String(value ?? "").replace(/^room\s*/i, "").trim();

const normalizeFloorInput = (value) =>
  String(value ?? "")
    .replace(/^floor\s*/i, "")
    .replace(/^fl\.?\s*/i, "")
    .trim();

const sortFloorValues = (a, b) => {
  const floorA = Number.parseInt(a, 10);
  const floorB = Number.parseInt(b, 10);
  const aIsNumber = Number.isFinite(floorA);
  const bIsNumber = Number.isFinite(floorB);

  if (aIsNumber && bIsNumber) return floorA - floorB;
  if (aIsNumber) return -1;
  if (bIsNumber) return 1;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
};

const RoomManagement = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterFloor, setFilterFloor] = useState("all");
  const [filterRoom, setFilterRoom] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [formData, setFormData] = useState({
    roomNumber: "",
    building: "",
    floor: "",
  });

  const loadRooms = useCallback(async () => {
    try {
      const res = await listRooms();
      const data = Array.isArray(res?.data) ? res.data : [];
      setRooms(data);
      setFilteredRooms(data);
    } catch {
      toast.error("Failed to load rooms");
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const floorOptions = useMemo(() => {
    return Array.from(
      new Set(
        rooms
          .map((room) => toFloorDisplay(room.floor))
          .filter((value) => value && value !== "-")
      )
    ).sort(sortFloorValues);
  }, [rooms]);

  const roomOptions = useMemo(() => {
    const sourceRooms =
      filterFloor === "all"
        ? rooms
        : rooms.filter((room) => toFloorDisplay(room.floor) === filterFloor);

    return Array.from(
      new Set(
        sourceRooms
          .map((room) => toRoomDisplay(room.roomNumber))
          .filter((value) => value && value !== "-")
      )
    ).sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );
  }, [rooms, filterFloor]);

  useEffect(() => {
    if (filterRoom !== "all" && !roomOptions.includes(filterRoom)) {
      setFilterRoom("all");
    }
  }, [roomOptions, filterRoom]);

  useEffect(() => {
    const lowerTerm = searchTerm.toLowerCase().trim();

    const nextRooms = rooms.filter((room) => {
      const displayRoom = toRoomDisplay(room.roomNumber);
      const displayFloor = toFloorDisplay(room.floor);
      const building = String(room.building ?? "").trim();

      const matchedSearch =
        !lowerTerm ||
        displayRoom.toLowerCase().includes(lowerTerm) ||
        displayFloor.toLowerCase().includes(lowerTerm) ||
        building.toLowerCase().includes(lowerTerm);

      const matchedFloor =
        filterFloor === "all" || displayFloor === filterFloor;
      const matchedRoom = filterRoom === "all" || displayRoom === filterRoom;

      return matchedSearch && matchedFloor && matchedRoom;
    });

    setFilteredRooms(nextRooms);
  }, [searchTerm, filterFloor, filterRoom, rooms]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setFormData({ roomNumber: "", building: "", floor: "" });
    setCurrentRoomId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (room) => {
    setIsEditMode(true);
    setCurrentRoomId(room.id);
    setFormData({
      roomNumber: normalizeRoomInput(room.roomNumber),
      building: room.building,
      floor: normalizeFloorInput(room.floor),
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
    const confirmed = await confirmDialog({
      title: "Delete Room",
      text: "Are you sure you want to delete this room?",
      confirmButtonText: "Delete",
      confirmVariant: "danger",
    });
    if (!confirmed) return;

    try {
      await removeRoom(id);
      toast.success("Room deleted successfully");
      loadRooms();
    } catch {
      toast.error("Failed to delete room");
    }
  };

  return (
    <AdminWrapper>
      <div className="flex flex-col h-full px-6 pt-6 pb-6 space-y-6 overflow-y-auto">
        <AdminHeader
          title="Room Management"
          subtitle="Manage rooms and locations"
          onBack={() => navigate(-1)}
        />

        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_1fr_auto] gap-3 items-center">
            <div className="relative w-full">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search room, building, floor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a] transition-all border border-gray-100 text-gray-700"
              />
            </div>

            <select
              value={filterFloor}
              onChange={(e) => setFilterFloor(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a]"
            >
              <option value="all">All Floors</option>
              {floorOptions.map((floor) => (
                <option key={floor} value={floor}>
                  {floor}
                </option>
              ))}
            </select>

            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a]"
            >
              <option value="all">All Rooms</option>
              {roomOptions.map((roomNumber) => (
                <option key={roomNumber} value={roomNumber}>
                  {roomNumber}
                </option>
              ))}
            </select>

            <button
              onClick={openCreateModal}
              className="w-full lg:w-auto bg-[#1e2e4a] text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#15233b] transition-all"
            >
              <Plus size={18} />
              Add Room
            </button>
          </div>
        </div>

        <div className="ml-1">
          <h2 className="text-xs text-gray-400 uppercase tracking-wider">
            Total Rooms <span className="text-gray-300 ml-1">({filteredRooms.length})</span>
          </h2>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
          <div className="hidden md:grid md:grid-cols-[2fr_1fr_1fr_100px] gap-3 px-5 py-3 bg-gray-50 text-[11px] text-gray-400 uppercase tracking-wider">
            <span>Room</span>
            <span>Floor</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {filteredRooms.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {filteredRooms.map((room) => {
                const roomDisplay = toRoomDisplay(room.roomNumber);
                const floorDisplay = toFloorDisplay(room.floor);
                const equipmentCount = room?._count?.equipments ?? 0;

                return (
                  <div
                    key={room.id}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_100px] gap-3 px-5 py-4 items-center"
                  >
                    <div>
                      <p className="text-base text-[#1e2e4a] leading-tight">{roomDisplay}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {String(room.building ?? "-").trim() || "-"}
                        {equipmentCount > 0 ? ` · ${equipmentCount} equipment` : ""}
                      </p>
                    </div>

                    <div className="text-sm text-gray-700">{floorDisplay}</div>

                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] bg-green-50 text-green-600 tracking-wide uppercase">
                        Active
                      </span>
                    </div>

                    <div className="flex md:justify-end items-center gap-1">
                      <button
                        onClick={() => openEditModal(room)}
                        className="p-1.5 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        aria-label={`Edit room ${roomDisplay}`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(room.id)}
                        className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label={`Delete room ${roomDisplay}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                <MapPin size={34} />
              </div>
              <h3 className="text-gray-900 text-lg mb-1">No rooms found</h3>
              <p className="text-gray-500 text-sm">Try adjusting filters or add a new room.</p>
            </div>
          )}
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2e4a]/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl text-[#1e2e4a]">
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
                  <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                    Room Number
                  </label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a] outline-none transition-all placeholder-gray-400 text-gray-800"
                    placeholder="e.g. LAB-301"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                      Building
                    </label>
                    <input
                      type="text"
                      name="building"
                      value={formData.building}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a] outline-none transition-all placeholder-gray-400 text-gray-800"
                      placeholder="PSUIC"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
                      Floor
                    </label>
                    <input
                      type="number"
                      name="floor"
                      value={formData.floor}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a] outline-none transition-all placeholder-gray-400 text-gray-800"
                      placeholder="12"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1e2e4a] text-white py-4 rounded-xl hover:bg-[#15325b] transition-all"
                >
                  {isEditMode ? "Update Room" : "Create Room"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminWrapper>
  );
};

export default RoomManagement;
