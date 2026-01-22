// client/src/pages/user/CreateTicket.jsx
import React, { useState, useEffect } from "react";
import {
  Camera,
  X,
  ChevronDown,
  Info,
  Calendar as CalendarIcon,
  Clock,
} from "lucide-react";
import CustomSelect from "../../components/ui/CustomSelect";
import { useLocation, useNavigate } from "react-router-dom";
import { createTicket } from "../../api/ticket";
import { listRooms } from "../../api/room";
// ... imports
import { listCategories } from "../../api/category";
import { listITStaff } from "../../api/user";
import { getITAvailability } from "../../api/appointment";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

const CreateTicket = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token, actionLogout } = useAuthStore();

  const prefilledData = location.state;

  const [dbRooms, setDbRooms] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [floors, setFloors] = useState([]);

  // Availability State
  const [itCount, setItCount] = useState(0);
  const [bookedSlots, setBookedSlots] = useState([]); // Array of busy "09:00" strings

  // Custom "Appointment" Form State
  const [form, setForm] = useState({
    equipmentId: prefilledData?.equipmentId || "",
    categoryId: "", // Selected "Equipment" category
    description: "",
    date: "",
    time: "",
    floor: prefilledData?.floorName || "",
    room: prefilledData?.roomNumber || "",
    roomId: prefilledData?.roomId || "",
    urgency: "Low",
    remindMe: false, // UI only
    images: [],
  });

  const urgencyLevels = ["Low", "Medium", "High"];

  useEffect(() => {
    loadData();
    loadITCapacity();
  }, []);

  // Fetch Availability when Date changes
  useEffect(() => {
    if (form.date && itCount > 0) {
      checkAvailability(form.date);
    }
  }, [form.date, itCount]);

  const loadData = async () => {
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
  };

  const loadITCapacity = async () => {
    try {
      const res = await listITStaff(token);
      setItCount(res.data.length);
    } catch (err) {
      console.error("Error loading IT staff:", err);
    }
  };

  const checkAvailability = async (dateStr) => {
    try {
      const res = await getITAvailability(token, dateStr, dateStr);
      const events = res.data; // [{ type, date, endTime, ... }]

      // Calculate busy slots
      // We check for each hour 09:00 to 17:00
      const busyTimes = [];

      for (let i = 9; i <= 17; i++) {
        const hourStr = `${i.toString().padStart(2, "0")}:00`;
        // Create a time object for this slot
        const slotStart = dayjs(`${dateStr}T${hourStr}`);
        const slotEnd = slotStart.add(1, 'hour'); // Assume 1 hour slots for booking resolution

        // Count how many ITs are busy during this slot
        // An IT is busy if they have an event that overlaps with this slot
        let busyCount = 0;

        // We need to count unique ITs busy? 
        // getITAvailability returns events, but doesn't explicitly guarantee grouping by IT unless we check user IDs (which are in personalTasks, but appointments linked to ticket->itSupportId might need lookup if not populated).
        // Actually, getITAvailability controller returns:
        // Appointments: itSupportId
        // PersonalTasks: userId
        // So we can count UNIQUE busy userIds.

        // Wait, controller response for appointment:
        // { type: 'appointment', date, endTime, title, description } -- IT DOES NOT RETURN IT ID in the mapped response!
        // Let's check controller appointment.js again.
        // It returns:
        // ...appointments.map(a => ({ type: 'appointment', ... }))
        // It DOES NOT include itSupportId in the final MAPPED object.
        // I need to update the controller or assume 1 event = 1 busy IT?
        // Actually, if there are 2 events at the same time, are they same IT or different?
        // Since `appointment` table has `itSupportId`, distinct appointments at same time MUST be different ITs (an IT can't double book usually, or if they do key is they are busy).
        // But if I have 5 appointments at 10:00, that means 5 ITs are busy.
        // So counting the number of events overlapping the slot is a safe proxy for "Number of Busy ITs".

        const eventsInSlot = events.filter(e => {
          const eStart = dayjs(e.date);
          const eEnd = dayjs(e.endTime);
          // Overlap check: (StartA < EndB) and (EndA > StartB)
          return eStart.isBefore(slotEnd) && eEnd.isAfter(slotStart);
        });

        if (eventsInSlot.length >= itCount) {
          busyTimes.push(hourStr);
        }
      }
      setBookedSlots(busyTimes);

    } catch (err) {
      console.error("Error checking availability:", err);
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
      !form.categoryId ||
      !form.description ||
      !form.roomId ||
      !form.date ||
      !form.time
    ) {
      toast.error(
        "Please fill in all required fields (Equipment, Date, Time, Room, Description)"
      );
      return;
    }

    try {
      // Append Requested Date/Time to description as per plan (Optional now, but good for visibility)
      // const requestedTimeStr = `\n\n[Requested Appointment: ${dayjs(form.date).format("YYYY-MM-DD")} at ${form.time}]`;

      const payload = {
        title: `${getCategoryName(form.categoryId)} Issue`, // Auto-generate title
        description: form.description, // + requestedTimeStr,
        urgency: form.urgency,
        categoryId: parseInt(form.categoryId),
        roomId: parseInt(form.roomId),
        equipmentId: form.equipmentId ? parseInt(form.equipmentId) : null,
        images: form.images,
        // [NEW] Send Date/Time for Auto-Booking
        date: form.date,
        time: form.time
      };

      await createTicket(token, payload);
      toast.success("Appointment Requested Successfully!");
      navigate("/user/my-tickets"); // Or Appointments page?
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit request");
    }
  };

  const getCategoryName = (id) => {
    const cat = dbCategories.find((c) => c.id == id);
    return cat ? cat.name : "General";
  };

  // Helper for time options (09:00 - 17:00)
  const timeOptions = [];
  for (let i = 9; i <= 17; i++) {
    const timeStr = `${i.toString().padStart(2, "0")}:00`;
    const isBooked = bookedSlots.includes(timeStr);
    timeOptions.push({
      id: timeStr,
      name: isBooked ? `${timeStr} (Full)` : timeStr,
      disabled: isBooked
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      {/* Deep Blue Header */}
      <div className="bg-[#193C6C] px-6 pt-10 pb-8 rounded-b-[2rem] shadow-lg sticky top-0 z-10 w-full mb-6">
        <div className="max-w-md md:max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10 p-2 -ml-2 rounded-full transition-colors"
          >
            <ChevronDown className="rotate-90" size={28} />
          </button>
          <h1 className="text-white text-2xl md:text-2xl font-bold flex-1 text-center pr-8">
            Create Ticket
          </h1>
        </div>
      </div>

      <div className="max-w-md md:max-w-2xl mx-auto px-6 space-y-5 animate-in fade-in duration-500">
        {/* Equipment (Category) */}
        <div className="space-y-2">
          <label className="text-gray-500 text-sm font-bold ml-1">
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

        {/* Date & Time Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-gray-500 text-sm font-bold ml-1">Date</label>
            <div className="relative">
              <input
                type="date"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-700 text-sm"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
              />
              {/* <CalendarIcon className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={18}/> */}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-gray-500 text-sm font-bold ml-1">Time</label>
            <div className="relative">
              <CustomSelect
                options={timeOptions}
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                placeholder="Select Time"
              />
            </div>
          </div>
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

        {/* Remind Me Toggle */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
          <span className="text-gray-700 font-bold text-sm">Remind me</span>
          <button
            onClick={() => setForm({ ...form, remindMe: !form.remindMe })}
            className={`w-12 h-6 rounded-full transition-colors relative ${form.remindMe ? "bg-blue-500" : "bg-gray-300"
              }`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${form.remindMe ? "left-6" : "left-0.5"
                }`}
            ></div>
          </button>
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
