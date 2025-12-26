// client/src/pages/user/CreateTicket.jsx
import React, { useState, useEffect } from "react";
import { Camera, X, ChevronDown, Info } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { createTicket } from "../../api/ticket";
import { listRooms } from "../../api/room"; // [New] API ดึงห้อง
import { listCategories } from "../../api/category"; // [New] API ดึงหมวดหมู่
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";

const CreateTicket = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuthStore();

  const prefilledData = location.state;

  const [step, setStep] = useState(1);

  const [dbRooms, setDbRooms] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [floors, setFloors] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryName: "", // เก็บชื่อไว้แสดงผล
    categoryId: "", // [Important] เก็บ ID จริงเพื่อส่งเข้า DB
    urgency: "Low",
    floor: prefilledData?.floorName || "",
    room: prefilledData?.roomNumber || "",
    roomId: prefilledData?.roomId || "",
    equipmentId: prefilledData?.equipmentId || "",
    images: [],
  });

  const urgencyLevels = ["Low", "Medium", "High", "Critical"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // โหลดหมวดหมู่
      const catRes = await listCategories(token);
      setDbCategories(catRes.data);

      // โหลดห้องและจัดการเลขชั้น
      const roomRes = await listRooms(token);
      setDbRooms(roomRes.data);
      const uniqueFloors = [...new Set(roomRes.data.map((r) => r.floor))].sort(
        (a, b) => a - b
      );
      setFloors(uniqueFloors);
    } catch (err) {
      console.log("Error loading form data:", err);
      toast.error("Failed to load options");
    }
  };

  useEffect(() => {
    if (prefilledData) {
      toast.info(`Scanning: ${prefilledData.equipmentName}`);
    }
  }, [prefilledData]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => URL.createObjectURL(file));
    setForm({ ...form, images: [...form.images, ...newImages] });
  };

  const removeImage = (index) => {
    const newImages = form.images.filter((_, i) => i !== index);
    setForm({ ...form, images: newImages });
  };

  const nextStep = () => {
    // Validate ว่าเลือกข้อมูลครบถ้วน
    if (step === 1 && (!form.categoryId || !form.description || !form.roomId)) {
      toast.error("Please select Category, Room and Description");
      return;
    }
    setStep(step + 1);
  };

  // กรองห้องตามชั้นที่เลือก
  const getAvailableRooms = () => {
    if (!form.floor) return [];
    const floorNum = parseInt(form.floor);
    return dbRooms.filter((r) => r.floor === floorNum);
  };

  // จัดการเมื่อเลือกห้อง
  const handleRoomSelect = (e) => {
    const selectedRoomId = parseInt(e.target.value);
    const selectedRoom = dbRooms.find((r) => r.id === selectedRoomId);
    setForm({
      ...form,
      roomId: selectedRoomId,
      room: selectedRoom ? selectedRoom.roomNumber : "",
    });
  };

  // จัดการเมื่อเลือกหมวดหมู่
  const handleCategorySelect = (e) => {
    const selectedCatId = parseInt(e.target.value);
    const selectedCat = dbCategories.find((c) => c.id === selectedCatId);
    setForm({
      ...form,
      categoryId: selectedCatId,
      categoryName: selectedCat ? selectedCat.name : "",
    });
  };

  const handleSubmit = async () => {
    try {
      // [Change 3] ส่ง ID ที่เป็นตัวเลขจริงไปยัง Server
      const payload = {
        title: form.title || `${form.categoryName} Issue`,
        description: form.description,
        urgency: form.urgency,
        categoryId: parseInt(form.categoryId),
        roomId: parseInt(form.roomId),
        equipmentId: form.equipmentId ? parseInt(form.equipmentId) : null,
      };

      await createTicket(token, payload);
      toast.success("Ticket Created Successfully!");
      navigate("/user/my-tickets");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create ticket");
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Create Ticket</h1>

        {prefilledData && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-xl flex items-start gap-3">
            <Info className="text-blue-500 shrink-0" size={20} />
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase">
                Linked Equipment
              </p>
              <p className="text-sm text-blue-800">
                <strong>{prefilledData.equipmentName}</strong> (
                {prefilledData.equipmentCode})
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Location: {prefilledData.roomNumber}
              </p>
            </div>
          </div>
        )}

        {/* Stepper */}
        <div className="flex items-center justify-between mb-6 px-4">
          <div className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                step >= 1 ? "bg-blue-600 text-white" : "bg-gray-300"
              }`}
            >
              1
            </div>
            <div
              className={`h-1 w-24 ${
                step >= 2 ? "bg-blue-600" : "bg-gray-300"
              }`}
            />
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                step >= 2 ? "bg-blue-600 text-white" : "bg-gray-300"
              }`}
            >
              2
            </div>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Category Dropdown (Dynamic) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment Category *
            </label>
            <div className="relative">
              <select
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.categoryId}
                onChange={handleCategorySelect}
              >
                <option value="">Select category</option>
                {dbCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-3.5 text-gray-400"
                size={20}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Issue Description *
            </label>
            <textarea
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              rows="4"
              placeholder="What is wrong with the equipment?"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          {/* Location Selectors (Dynamic) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Floor *
              </label>
              <select
                disabled={!!prefilledData}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none disabled:opacity-60"
                value={form.floor}
                onChange={(e) =>
                  setForm({
                    ...form,
                    floor: e.target.value,
                    roomId: "",
                    room: "",
                  })
                }
              >
                <option value="">Select Floor</option>
                {floors.map((f) => (
                  <option key={f} value={f}>
                    Floor {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Room *
              </label>
              <select
                disabled={!!prefilledData || !form.floor}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none disabled:opacity-60"
                value={form.roomId}
                onChange={handleRoomSelect}
              >
                <option value="">Select Room</option>
                {getAvailableRooms().map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {urgencyLevels.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setForm({ ...form, urgency: level })}
                  className={`flex-1 py-2 text-sm rounded-lg border transition-all ${
                    form.urgency === level
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photos (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="photo-upload"
                className="hidden"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
              />
              <label htmlFor="photo-upload" className="cursor-pointer block">
                <Camera className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-500 text-sm">Upload evidence</p>
              </label>
            </div>
            {form.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mt-3">
                {form.images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt="preview"
                      className="w-full h-16 object-cover rounded-lg border"
                    />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-6">
            <button
              onClick={() => navigate(-1)}
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={nextStep}
              className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-200"
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        /* Step 2: Review */
        <div className="space-y-6 animate-in slide-in-from-right duration-300">
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">
              Confirm Details
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Equipment:</span>
                <span className="font-semibold text-gray-800">
                  {prefilledData?.equipmentName || form.categoryName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Location:</span>
                <span className="font-semibold text-gray-800">
                  Floor {form.floor}, {form.room}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Priority:</span>
                <span
                  className={`font-bold ${
                    form.urgency === "Critical"
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {form.urgency}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-gray-500 block mb-1">
                  Issue Description:
                </span>
                <p className="bg-white p-3 rounded-lg border italic text-gray-700">
                  {form.description}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-lg shadow-green-200"
            >
              Submit Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateTicket;
