import React, { useState, useEffect } from "react";
import axios from "axios";
import useEcomStore from "../../store/ecom-store";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const CreateTicket = () => {
  const token = useEcomStore((s) => s.token);
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    urgency: "Medium",
    categoryId: "",
    roomId: "1", // Hardcode ไว้ก่อนเพื่อทดสอบ
  });

  useEffect(() => {
    // ดึงหมวดหมู่มาแสดง
    const fetchCategories = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/category");
        setCategories(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchCategories();
  }, []);

  const handleOnChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Backend ต้องการ Int ดังนั้นต้องแปลงค่าก่อนส่ง
      const payload = {
        ...form,
        roomId: parseInt(form.roomId),
        categoryId: parseInt(form.categoryId),
      };

      await axios.post("http://localhost:5001/api/ticket", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("แจ้งซ่อมสำเร็จ!");
      navigate("/user/my-tickets");
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "แจ้งซ่อมล้มเหลว");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">📝 แจ้งซ่อมพัสดุ/อุปกรณ์</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-semibold">หัวข้อปัญหา</label>
          <input
            type="text"
            name="title"
            onChange={handleOnChange}
            required
            className="w-full border p-2 rounded"
            placeholder="เช่น คอมพิวเตอร์เปิดไม่ติด"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold">หมวดหมู่</label>
            <select
              name="categoryId"
              onChange={handleOnChange}
              required
              className="w-full border p-2 rounded"
            >
              <option value="">-- เลือกหมวดหมู่ --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-semibold">ความเร่งด่วน</label>
            <select
              name="urgency"
              onChange={handleOnChange}
              className="w-full border p-2 rounded"
            >
              <option value="Low">ไม่ด่วน</option>
              <option value="Medium">ปานกลาง</option>
              <option value="High">ด่วนมาก</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block mb-1 font-semibold">
            รายละเอียดเพิ่มเติม
          </label>
          <textarea
            name="description"
            onChange={handleOnChange}
            className="w-full border p-2 rounded"
            rows="3"
          ></textarea>
        </div>

        <button
          disabled={loading}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 w-full"
        >
          {loading ? "กำลังส่งข้อมูล..." : "ยืนยันการแจ้ง"}
        </button>
      </form>
    </div>
  );
};

export default CreateTicket;
