import React, { useState, useEffect } from "react";
import axios from "axios";
import useEcomStore from "../../store/ecom-store";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { Upload, X } from "lucide-react"; // ใช้ Icon

const CreateTicket = () => {
  const token = useEcomStore((s) => s.token);
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    urgency: "Medium", // Default value
    categoryId: "",
    roomId: "", // ให้กรอกเป็นตัวเลขไปก่อน (เช่น 1)
    images: [], // เก็บรูปภาพ
  });

  // Fetch Categories ตอนเริ่มหน้าเว็บ
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // ยิงไป API Backend (Port 5001)
      const res = await axios.get("http://localhost:5001/api/category");
      setCategories(res.data);
    } catch (err) {
      console.log(err);
      toast.error("ดึงข้อมูลหมวดหมู่ไม่ได้");
    }
  };

  const handleOnChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // จัดการการอัปโหลดรูป (แปลงเป็น Base64 หรือส่งไป Cloudinary ถ้าระบบรองรับ)
  // ในที่นี้ขอทำแบบส่งข้อมูล Text ก่อน เพื่อทดสอบ Flow
  // ถ้าคุณทำระบบ Upload รูปแล้ว ค่อยมาเพิ่มส่วนนี้ครับ

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // ส่งข้อมูลไป Backend
      // หมายเหตุ: roomId ต้องส่งเป็น Int, categoryId ก็เช่นกัน
      const payload = {
        ...form,
        roomId: parseInt(form.roomId),
        categoryId: parseInt(form.categoryId),
      };

      await axios.post("http://localhost:5001/api/ticket", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("แจ้งซ่อมสำเร็จ!");
      navigate("/user/my-tickets"); // แจ้งเสร็จเด้งไปหน้าดูรายการ
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "แจ้งซ่อมล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-2xl font-bold text-slate-800">
          📝 ฟอร์มแจ้งซ่อม
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              หัวข้อปัญหา <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleOnChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="เช่น คอมพิวเตอร์เปิดไม่ติด, แอร์ไม่เย็น"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              รายละเอียด
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleOnChange}
              rows="4"
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="ระบุรายละเอียดเพิ่มเติม..."
            ></textarea>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Category */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                หมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <select
                name="categoryId"
                value={form.categoryId}
                onChange={handleOnChange}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- เลือกหมวดหมู่ --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Urgency */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                ความเร่งด่วน
              </label>
              <select
                name="urgency"
                value={form.urgency}
                onChange={handleOnChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="Low">Low (รอได้)</option>
                <option value="Medium">Medium (ปานกลาง)</option>
                <option value="High">High (ด่วน)</option>
              </select>
            </div>
          </div>

          {/* Room ID (ชั่วคราว) */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              เลขห้อง (Room ID) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="roomId"
              value={form.roomId}
              onChange={handleOnChange}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
              placeholder="ใส่เลข ID ห้อง (เช่น 1)"
            />
            <p className="mt-1 text-xs text-slate-400">
              *ในอนาคตจะเป็น Dropdown เลือกห้องจริง
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
            >
              {loading ? "กำลังส่งข้อมูล..." : "ยืนยันการแจ้งซ่อม"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
