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
  const { token, actionLogout } = useAuthStore();

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
    if (!token) {
      toast.error("Authentication token missing. Please login again.");
      return;
    }

    try {
      // โหลดหมวดหมู่
      try {
        const catRes = await listCategories(token);
        setDbCategories(catRes.data);
      } catch (err) {
        console.error("Error loading categories:", err);
        if (err.response?.status === 431) {
          toast.error("Session expired. Logging out now...");
          actionLogout();
          setTimeout(() => window.location.href = "/login", 1000);
          return;
        }
        toast.error("Failed to load categories: " + (err.response?.data?.message || err.message));
      }

      // โหลดห้องและจัดการเลขชั้น
      try {
        const roomRes = await listRooms(token);
        setDbRooms(roomRes.data);

        if (Array.isArray(roomRes.data)) {
          const uniqueFloors = [...new Set(roomRes.data.map((r) => r.floor))].sort(
            (a, b) => a - b
          );
          setFloors(uniqueFloors);
        } else {
          console.error("Invalid rooms data format:", roomRes.data);
        }
      } catch (err) {
        console.error("Error loading rooms:", err);
        if (err.response?.status === 431) {
          toast.error("Session expired. Logging out now...");
          actionLogout();
          setTimeout(() => window.location.href = "/login", 1000);
          return;
        }
        toast.error("Failed to load rooms: " + (err.response?.data?.message || err.message));
      }

    } catch (err) {
      console.log("Unexpected error:", err);
      if (err.response?.status === 431 || err.message?.includes('431')) {
        toast.error("Session data too large. Resetting session...");
        const { actionLogout } = useAuthStore.getState(); // Securely get logout action
        actionLogout();
        setTimeout(() => window.location.href = "/login", 1500);
        return;
      }
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
    <div className="min-h-screen bg-slate-50 py-8 px-4 animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-500 hover:text-gray-800 transition-colors mb-6 font-medium"
        >
          <ChevronDown className="rotate-90 mr-1" size={20} />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          {/* Header with Progress */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <h1 className="text-3xl font-bold mb-2 relative z-10">Create Ticket</h1>
            <p className="text-blue-100 relative z-10">Report an issue or request assistance</p>

            <div className="flex items-center mt-8 relative z-10">
              <div className="flex flex-col items-center relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ring-4 ring-blue-500/50 ${step >= 1 ? "bg-white text-blue-600" : "bg-blue-800 text-blue-400"}`}>
                  1
                </div>
                <span className="absolute -bottom-6 text-xs font-semibold whitespace-nowrap opacity-90">Details</span>
              </div>
              <div className={`flex-1 h-1 mx-4 rounded-full transition-all duration-500 ${step >= 2 ? "bg-white" : "bg-blue-800"}`}></div>
              <div className="flex flex-col items-center relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ring-4 ring-blue-500/50 ${step >= 2 ? "bg-white text-blue-600" : "bg-blue-800 text-blue-400"}`}>
                  2
                </div>
                <span className={`absolute -bottom-6 text-xs font-semibold whitespace-nowrap ${step >= 2 ? "opacity-90" : "opacity-50"}`}>Review</span>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            {step === 1 ? (
              <div className="space-y-6 animate-in slide-in-from-right duration-300">
                {prefilledData && (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-start gap-4">
                    <div className="p-2 bg-white rounded-xl text-blue-600 shadow-sm shrink-0">
                      <Info size={24} />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">
                        Linked Equipment
                      </p>
                      <h3 className="font-bold text-blue-900 text-lg">
                        {prefilledData.equipmentName} <span className="text-blue-400 font-normal">({prefilledData.equipmentCode})</span>
                      </h3>
                      <p className="text-sm text-blue-700 flex items-center gap-1 mt-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                        Location: Room {prefilledData.roomNumber}
                      </p>
                    </div>
                  </div>
                )}

                {/* Category Section */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Category</label>
                  <div className="relative">
                    <select
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium text-gray-700"
                      value={form.categoryId}
                      onChange={handleCategorySelect}
                    >
                      <option value="">Select a category...</option>
                      {dbCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                  </div>
                </div>

                {/* Issue Description */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Issue Description</label>
                  <textarea
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all min-h-[120px]"
                    placeholder="Please verify current location..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </div>

                {/* Location Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Floor</label>
                    <div className="relative">
                      <select
                        disabled={!!prefilledData}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:opacity-50 disabled:bg-gray-100"
                        value={form.floor}
                        onChange={(e) => setForm({ ...form, floor: e.target.value, roomId: "", room: "" })}
                      >
                        <option value="">Select Floor</option>
                        {floors.map((f) => (
                          <option key={f} value={f}>Floor {f}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Room</label>
                    <div className="relative">
                      <select
                        disabled={!!prefilledData || !form.floor}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none disabled:opacity-50 disabled:bg-gray-100"
                        value={form.roomId}
                        onChange={handleRoomSelect}
                      >
                        <option value="">Select Room</option>
                        {getAvailableRooms().map((r) => (
                          <option key={r.id} value={r.id}>{r.roomNumber}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                    </div>
                  </div>
                </div>

                {/* Priority Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Priority Level</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {urgencyLevels.map((level) => {
                      const colors = {
                        Low: "hover:bg-blue-50 hover:border-blue-200 text-blue-700",
                        Medium: "hover:bg-yellow-50 hover:border-yellow-200 text-yellow-700",
                        High: "hover:bg-orange-50 hover:border-orange-200 text-orange-700",
                        Critical: "hover:bg-red-50 hover:border-red-200 text-red-700"
                      };
                      const activeColors = {
                        Low: "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200",
                        Medium: "bg-yellow-500 border-yellow-500 text-white shadow-md shadow-yellow-200",
                        High: "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-200",
                        Critical: "bg-red-600 border-red-600 text-white shadow-md shadow-red-200"
                      };

                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setForm({ ...form, urgency: level })}
                          className={`
                            py-3 px-2 rounded-xl border-2 font-bold text-sm transition-all duration-200
                            ${form.urgency === level ? activeColors[level] : `bg-white border-gray-100 text-gray-500 ${colors[level]}`}
                          `}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 uppercase tracking-wide">Evidence Photos</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:bg-gray-50 hover:border-blue-300 transition-all text-center group cursor-pointer relative">
                    <input
                      type="file"
                      id="photo-upload"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Camera size={32} />
                    </div>
                    <p className="text-gray-900 font-bold">Click or Drag photos here</p>
                    <p className="text-gray-400 text-sm mt-1">Supports JPG, PNG (Max 5MB)</p>
                  </div>

                  {form.images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 animate-in fade-in">
                      {form.images.map((img, index) => (
                        <div key={index} className="relative group rounded-xl overflow-hidden shadow-sm aspect-square">
                          <img src={img} alt="preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                              onClick={(e) => { e.preventDefault(); removeImage(index); }}
                              className="bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors transform hover:scale-110"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-6 flex gap-4">
                  <button
                    onClick={() => navigate(-1)}
                    className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={nextStep}
                    className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            ) : (
              /* Step 2: Review */
              <div className="space-y-8 animate-in slide-in-from-right duration-300">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800">Review Ticket Details</h2>
                  <p className="text-gray-500 mt-1">Please confirm everything is correct before submitting</p>
                </div>

                <div className="bg-gray-50 rounded-3xl p-6 sm:p-8 space-y-6 border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Equipment / Category</p>
                      <p className="text-lg font-bold text-gray-800">{prefilledData?.equipmentName || form.categoryName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Location</p>
                      <p className="text-lg font-bold text-gray-800">Floor {form.floor}, Room {form.room}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Priority</p>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${form.urgency === "Critical" ? "bg-red-100 text-red-700" :
                        form.urgency === "High" ? "bg-orange-100 text-orange-700" :
                          form.urgency === "Medium" ? "bg-yellow-100 text-yellow-700" :
                            "bg-blue-100 text-blue-700"
                        }`}>
                        {form.urgency} Priority
                      </span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Issue Description</p>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 text-gray-700 leading-relaxed shadow-sm">
                      {form.description}
                    </div>
                  </div>

                  {form.images.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Attached Photos ({form.images.length})</p>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {form.images.map((img, idx) => (
                          <img key={idx} src={img} className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    Confirm & Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;
