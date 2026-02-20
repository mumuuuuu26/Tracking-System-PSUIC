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
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import UserWrapper from "../../components/user/UserWrapper";
import UserPageHeader from "../../components/user/UserPageHeader";
import UserSelect from "../../components/user/UserSelect"; // Import the new component

const CreateTicket = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const prefilledData = location.state;

  const [dbRooms, setDbRooms] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [floors, setFloors] = useState([]);

  // Form State
  const [form, setForm] = useState({
    title: "", // Topic Issue
    equipmentId: prefilledData?.equipmentId || "",
    categoryId: prefilledData?.equipmentId ? "" : (location.state?.categoryId || ""), // If accessing directly, might prefill
    description: "",
    floor: prefilledData?.floorName || "",
    room: prefilledData?.roomNumber || "",
    roomId: prefilledData?.roomId || "",
    urgency: "",
    subComponent: "",
    images: [],
  });

  const [activeSubComponents, setActiveSubComponents] = useState([]);

  // Set category if prefilled data has it
  useEffect(() => {
    if (prefilledData?.categoryId) {
      setForm(prev => ({ ...prev, categoryId: prefilledData.categoryId }));
      if (prefilledData.subComponents && prefilledData.subComponents.length > 0) {
        setActiveSubComponents(prefilledData.subComponents);
      }
    }
  }, [prefilledData]);

  const urgencyLevels = ["Low", "Medium", "High"];

  const loadData = useCallback(async () => {
    try {
      const catRes = await listCategories();
      setDbCategories(catRes.data);
      const roomRes = await listRooms();
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle manual category change
  const handleCategoryChange = (e) => {
    const selectedCatId = e.target.value;
    setForm({ ...form, categoryId: selectedCatId, subComponent: "" });

    const selectedCat = dbCategories.find(c => c.id === parseInt(selectedCatId));
    if (selectedCat && selectedCat.subComponents && selectedCat.subComponents.length > 0) {
      setActiveSubComponents(selectedCat.subComponents);
    } else {
      setActiveSubComponents([]);
    }
  };


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
      !form.title ||
      !form.categoryId ||
      !form.description ||
      !form.roomId
    ) {
      toast.error(
        "Please fill in all required fields (Topic, Category, Room, Description)"
      );
      return;
    }

    if (!form.urgency) {
      toast.error("Please select a Priority Level");
      return;
    }

    try {
      const payload = {
        title: form.title,
        description: form.description,
        urgency: form.urgency,
        categoryId: parseInt(form.categoryId),
        roomId: parseInt(form.roomId),
        equipmentId: form.equipmentId ? parseInt(form.equipmentId) : null,
        subComponent: form.subComponent || null,
        images: form.images
      };

      const res = await createTicket(payload);

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

  return (
    <UserWrapper>
      <div className="pb-20 min-h-screen">
        {/* Header */}
        <UserPageHeader title="Report Issue" />

        <div className="max-w-md md:max-w-3xl mx-auto mt-6 px-6 space-y-6 animate-in fade-in duration-500 relative z-10 text-left">

          {/* Topic Issue */}
          <div className="space-y-2">
            <label className="text-[#193C6C] text-base font-bold flex gap-1">
              Topic Issue <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Computer cannot start, Projector dim"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* Equipment Category */}
          <div className="space-y-2">
            <label className="text-[#193C6C] text-base font-bold flex gap-1">
              Equipment Category <span className="text-red-500">*</span>
            </label>
            <UserSelect
              options={dbCategories}
              value={form.categoryId}
              onChange={handleCategoryChange}
              placeholder="Select equipment category"
              disabled={!!prefilledData?.categoryId} // Lock if scanned from QR
            />
          </div>

          {/* Dynamic Sub-Component (if applicable) */}
          {activeSubComponents.length > 0 && (
            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
              <label className="text-[#193C6C] text-base font-bold flex gap-1">
                อุปกรณ์ส่วนที่พบปัญหา (Sub-Component)
              </label>
              <UserSelect
                options={activeSubComponents}
                value={form.subComponent}
                onChange={(e) => setForm({ ...form, subComponent: e.target.value })}
                placeholder="Select sub-component (Optional)"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[#193C6C] text-base font-bold flex gap-1">
              Describe the Issue <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-700 placeholder-gray-400 min-h-[120px] resize-none"
              placeholder="Please describe the issue in detail..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Floor & Room Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[#193C6C] text-base font-bold flex gap-1">
                Floor <span className="text-red-500">*</span>
              </label>
              <UserSelect
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
                placeholder="Select Floor"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[#193C6C] text-base font-bold flex gap-1">Room <span className="text-red-500">*</span></label>
              <UserSelect
                disabled={!form.floor}
                options={getAvailableRooms().map((r) => ({ id: r.id, name: r.roomNumber }))}
                value={form.roomId}
                onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                placeholder="Select Room"
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-[#193C6C] text-base font-bold">
              Priority Level
            </label>
            <div className="flex gap-3">
              {urgencyLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setForm({ ...form, urgency: level })}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${form.urgency === level
                    ? level === "High"
                      ? "bg-red-50 text-red-600 border-red-200 shadow-sm"
                      : level === "Medium"
                        ? "bg-amber-50 text-amber-600 border-amber-200 shadow-sm"
                        : "bg-green-50 text-green-600 border-green-200 shadow-sm"
                    : "text-gray-400 border-gray-200 hover:bg-gray-50"
                    }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Photo */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[#193C6C] text-base font-bold">
                Add Photo
              </label>
              <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md mb-1">Optional</span>
            </div>

            <div className="border-2 border-dashed border-blue-100 rounded-2xl p-8 hover:bg-blue-50/30 transition-colors cursor-pointer relative text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                onChange={handleImageUpload}
              />
              <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-400 mb-2">
                  <Camera size={24} />
                </div>
                <span className="text-gray-400 font-medium text-sm">Click to attach photo</span>
              </div>
            </div>

            {/* Previews */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
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
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 text-center mt-2">You can add a photo to help us fix the issue faster.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 pb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 py-3.5 bg-white text-gray-600 border border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3.5 bg-[#193C6C] text-white rounded-2xl font-bold hover:bg-[#132E52] transition-colors shadow-lg shadow-blue-900/20"
            >
              Submit Report
            </button>
          </div>

        </div>
      </div>
    </UserWrapper>
  );
};

export default CreateTicket;
