// client/src/pages/user/CreateTicket.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Camera,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { createTicket } from "../../api/ticket";
import { listRooms } from "../../api/room";
import { listCategories } from "../../api/category";
import { toast } from "react-toastify";
import UserWrapper from "../../components/user/UserWrapper";
import UserPageHeader from "../../components/user/UserPageHeader";
import UserSelect from "../../components/user/UserSelect";
import { showPopup } from "../../utils/sweetalert";

const CreateTicket = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const prefilledData = location.state;

  const [dbRooms, setDbRooms] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [floors, setFloors] = useState([]);

  const [form, setForm] = useState({
    title: "",
    equipmentId: prefilledData?.equipmentId || "",
    categoryId: prefilledData?.equipmentId ? "" : (location.state?.categoryId || ""),
    description: "",
    floor: prefilledData?.floorName || "",
    room: prefilledData?.roomNumber || "",
    roomId: prefilledData?.roomId || "",
    urgency: "",
    subComponent: "",
    images: [],
  });

  const [activeSubComponents, setActiveSubComponents] = useState([]);

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
    } catch {
      // Silently fail — user can still see empty dropdowns and retry
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

      const result = await showPopup({
        title: "Created Successfully",
        text: "Your request has been recorded and is being processed by our IT team.",
        icon: "success",
        confirmButtonText: "View Ticket",
        allowOutsideClick: false,
      });

      if (result.isConfirmed) {
        navigate(`/user/ticket/${res.data.id}`);
      }

    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    }
  };

  return (
    <UserWrapper>
      <div className="pb-32 bg-gray-50 dark:bg-[#0d1b2a] min-h-screen">
        {/* Header */}
        <UserPageHeader title="Report Issue" />

        <div className="max-w-md md:max-w-3xl mx-auto mt-6 px-6 space-y-6 animate-in fade-in duration-500 relative z-10 text-left pb-8">

          {/* Topic Issue */}
          <div className="space-y-2">
            <label className="text-gray-700 dark:text-blue-200 text-sm font-bold flex gap-1 transition-colors">
              Topic Issue <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Computer cannot start, Projector dim"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-[#1a2f4e] border border-gray-300 dark:border-blue-700/50 rounded-xl focus:border-gray-400 dark:focus:border-blue-700/70 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-blue-400/40 text-sm transition-colors shadow-sm dark:shadow-none"
            />
          </div>

          {/* Equipment Category */}
          <div className="space-y-2">
            <label className="text-gray-700 dark:text-blue-200 text-sm font-bold flex gap-1 transition-colors">
              Equipment Category <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <UserSelect
              options={dbCategories}
              value={form.categoryId}
              onChange={handleCategoryChange}
              placeholder="Select equipment category"
              disabled={!!prefilledData?.categoryId}
            />
          </div>

          {/* Sub-Component */}
          {activeSubComponents.length > 0 && (
            <div className="space-y-2 animate-in fade-in zoom-in-95 duration-300">
              <label className="text-gray-700 dark:text-blue-200 text-sm font-bold flex gap-1 transition-colors">
                Sub-Component (Optional)
              </label>
              <UserSelect
                options={activeSubComponents.map(c => ({ id: c.name, name: c.name }))}
                value={form.subComponent}
                onChange={(e) => setForm({ ...form, subComponent: e.target.value })}
                placeholder="Select sub-component (Optional)"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="text-gray-700 dark:text-blue-200 text-sm font-bold flex gap-1 transition-colors">
              Describe the Issue <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <textarea
              className="w-full px-4 py-3 bg-white dark:bg-[#1a2f4e] border border-gray-300 dark:border-blue-700/50 rounded-xl focus:border-gray-400 dark:focus:border-blue-700/70 outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-blue-400/40 text-sm min-h-[120px] resize-none transition-colors shadow-sm dark:shadow-none"
              placeholder="Please describe the issue in detail..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          {/* Floor & Room Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-gray-700 dark:text-blue-200 text-sm font-bold flex gap-1 transition-colors">
                Floor <span className="text-red-500 dark:text-red-400">*</span>
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
              <label className="text-gray-700 dark:text-blue-200 text-sm font-bold flex gap-1 transition-colors">Room <span className="text-red-500 dark:text-red-400">*</span></label>
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
            <label className="text-gray-700 dark:text-blue-200 text-sm font-bold flex gap-1 transition-colors">
              Priority Level <span className="text-red-500 dark:text-red-400">*</span>
            </label>
            <div className="flex gap-3">
              {urgencyLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setForm({ ...form, urgency: level })}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all border ${form.urgency === level
                    ? level === "High"
                      ? "bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-300 border-red-200 dark:border-red-500/60 shadow-sm"
                      : level === "Medium"
                        ? "bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-500/60 shadow-sm"
                        : "bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/60 shadow-sm"
                    : "bg-white dark:bg-[#1a2f4e] text-gray-500 dark:text-blue-400/60 border-gray-300 dark:border-blue-700/40 hover:bg-gray-50 dark:hover:bg-[#1e3558] shadow-sm dark:shadow-none"
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
              <label className="text-gray-700 dark:text-blue-200 text-sm font-bold transition-colors">
                Add Photo
              </label>
              <span className="bg-gray-100 dark:bg-blue-900/40 text-gray-500 dark:text-blue-400 text-xs px-2 py-1 rounded-md mb-1 border border-gray-200 dark:border-blue-700/40 transition-colors">Optional</span>
            </div>

            <div className="border-2 border-dashed border-gray-300 dark:border-blue-700/40 rounded-2xl p-8 hover:bg-gray-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer relative text-center bg-white dark:bg-[#1a2f4e]/50 shadow-sm dark:shadow-none">
              <input
                type="file"
                multiple
                accept="image/*"
                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                onChange={handleImageUpload}
              />
              <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                <div className="w-12 h-12 bg-gray-50 dark:bg-blue-900/60 rounded-full flex items-center justify-center text-gray-400 dark:text-blue-400 mb-2 border border-gray-200 dark:border-blue-700/40 transition-colors">
                  <Camera size={24} />
                </div>
                <span className="text-gray-500 dark:text-blue-400/60 font-medium text-sm transition-colors">Click to attach photo</span>
              </div>
            </div>

            {/* Previews */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {form.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-blue-700/40 relative group transition-colors"
                  >
                    <img src={img} className="w-full h-full object-cover" />
                    <button
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          images: prev.images.filter((_, i) => i !== idx),
                        }))
                      }
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-30"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500 dark:text-blue-400/40 text-center mt-2 transition-colors">You can add a photo to help us fix the issue faster.</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 py-3.5 bg-white dark:bg-[#1a2f4e] text-gray-700 dark:text-blue-300 border border-gray-300 dark:border-blue-700/50 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-[#1e3558] hover:border-gray-400 dark:hover:border-blue-500/60 transition-colors shadow-sm dark:shadow-none"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3.5 bg-blue-600 dark:bg-[#193C6C] text-white rounded-2xl font-bold hover:bg-blue-700 dark:hover:bg-[#15325A] transition-colors shadow-lg shadow-blue-500/30 dark:shadow-blue-900/40"
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
