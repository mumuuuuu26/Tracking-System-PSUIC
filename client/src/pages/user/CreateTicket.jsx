// client/src/pages/user/CreateTicket.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Camera,
  X,
  ArrowLeft,
} from "lucide-react";
import CustomSelect from "../../components/ui/CustomSelect";
import { useLocation, useNavigate } from "react-router-dom";
import { createTicket } from "../../api/ticket";
import { listRooms } from "../../api/room";
import { listCategories } from "../../api/category";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const CreateTicket = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const prefilledData = location.state;

  const [dbRooms, setDbRooms] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [floors, setFloors] = useState([]);

  // Custom "Appointment" Form State
  const [form, setForm] = useState({
    equipmentId: prefilledData?.equipmentId || "",
    categoryId: "", // Selected "Equipment" category
    description: "",
    floor: prefilledData?.floorName || "",
    room: prefilledData?.roomNumber || "",
    roomId: prefilledData?.roomId || "",
    urgency: "Low",

    images: [],
  });

  const urgencyLevels = ["Low", "Medium", "High"];

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const catRes = await listCategories(token);
      setDbCategories(catRes.data);
      const roomRes = await listRooms(token);
      setDbRooms(roomRes.data);

      if (Array.isArray(roomRes.data)) {
        const uniqueFloors = [
          ...new Set(roomRes.data.map((r) => r.floor)),
        ].sort((a, b) => a - b);
        setFloors(uniqueFloors);
      }
    } catch (err) {
      console.error("Error loading data:", err);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);


  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setForm((prev) => ({
          ...prev,
          images: [...prev.images, reader.result],
        }));
      };
    });
  };

  const getAvailableRooms = () => {
    if (!form.floor) return [];
    const floorNum = parseInt(form.floor);
    return dbRooms.filter((r) => r.floor === floorNum);
  };

  const handleSubmit = async () => {
    if (
      !form.categoryId ||
      !form.description ||
      !form.roomId
    ) {
      toast.error(
        "Please fill in all required fields (Equipment, Room, Description)"
      );
      return;
    }

    try {
      const payload = {
        title: `${getCategoryName(form.categoryId)} Issue`, // Auto-generate title
        description: form.description,
        urgency: form.urgency,
        categoryId: parseInt(form.categoryId),
        roomId: parseInt(form.roomId),
        equipmentId: form.equipmentId ? parseInt(form.equipmentId) : null,
        images: form.images
      };

      const res = await createTicket(token, payload);

      Swal.fire({
        title: 'Created Successfully',
        text: 'Your request has been recorded and is being processed by our IT team.',
        icon: 'success',
        confirmButtonText: 'View Ticket',
        confirmButtonColor: '#193C6C',
        allowOutsideClick: false,
        customClass: {
          popup: 'rounded-3xl p-8',
          title: 'text-2xl font-bold text-[#193C6C] mb-2',
          htmlContainer: 'text-gray-500 mb-6',
          confirmButton: 'w-full py-3 rounded-xl font-bold text-base shadow-lg shadow-blue-200'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(`/user/ticket/${res.data.id}`);
        }
      });

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit request");
    }
  };

  const getCategoryName = (id) => {
    const cat = dbCategories.find((c) => c.id == id);
    return cat ? cat.name : "General";
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      {/* Header */}
      <div className="bg-[#193C6C] px-4 py-4 flex items-center sticky top-0 z-50 lg:hidden shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <span className="text-lg font-bold text-white absolute left-1/2 -translate-x-1/2">
          Report Issue
        </span>
      </div>

      <div className="max-w-md md:max-w-3xl mx-auto lg:mx-0 mt-6 px-6 space-y-5 animate-in fade-in duration-500 relative z-10">

        {/* Equipment (Category) */}
        <div className="space-y-2">
          <label className="text-gray-500 text-sm font-bold ml-1 hidden md:block">
            Equipment
          </label>
          <CustomSelect
            options={dbCategories}
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            placeholder="Select Equipment"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-gray-500 text-sm font-bold ml-1">
            Description
          </label>
          <textarea
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-700 placeholder-gray-400 min-h-[100px]"
            placeholder="Describe the issue..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* Floor & Room Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-gray-500 text-sm font-bold ml-1">
              Floor
            </label>
            <CustomSelect
              options={floors.map((f) => ({ id: f, name: `Floor ${f}` }))}
              value={form.floor}
              onChange={(e) =>
                setForm({
                  ...form,
                  floor: e.target.value,
                  roomId: "",
                  room: "",
                })
              }
              placeholder="Floor"
            />
          </div>
          <div className="space-y-2">
            <label className="text-gray-500 text-sm font-bold ml-1">Room</label>
            <CustomSelect
              disabled={!form.floor}
              options={getAvailableRooms().map((r) => ({
                ...r,
                name: r.roomNumber,
              }))}
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
              placeholder="Room"
            />
          </div>
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <label className="text-gray-500 text-sm font-bold ml-1">
            Priority
          </label>
          <div className="flex gap-2">
            {urgencyLevels.map((level) => (
              <button
                key={level}
                onClick={() => setForm({ ...form, urgency: level })}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${form.urgency === level
                  ? level === "High"
                    ? "bg-red-50 text-red-600 border-red-200"
                    : level === "Medium"
                      ? "bg-amber-50 text-amber-600 border-amber-200"
                      : "bg-green-50 text-green-600 border-green-200"
                  : "bg-white text-gray-400 border-gray-200 hover:bg-gray-50"
                  }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Photo */}
        <div className="space-y-2">
          <label className="text-gray-500 text-sm font-bold ml-1">
            Upload Photo
          </label>
          <div className="grid grid-cols-4 gap-2">
            {/* Upload Button */}
            <div className="aspect-square bg-blue-50 rounded-xl border-dashed border-2 border-blue-200 flex flex-col items-center justify-center text-blue-400 relative cursor-pointer hover:bg-blue-100 transition-colors">
              <Camera size={24} />
              <input
                type="file"
                multiple
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageUpload}
              />
            </div>

            {/* Previews */}
            {form.images.map((img, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-xl overflow-hidden border border-gray-200 relative group"
              >
                <img src={img} className="w-full h-full object-cover" />
                <button
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== idx),
                    }))
                  }
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          className="w-full py-4 bg-[#193C6C] text-white rounded-2xl font-bold hover:bg-[#132E52] transition-colors shadow-lg shadow-blue-200 mt-4 active:scale-[0.99]"
        >
          Submit Request
        </button>

      </div>
    </div>
  );
};

export default CreateTicket;
