import axios from "axios";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import hero from "../../assets/auth-hero2.png";

const api = axios.create({ baseURL: "http://127.0.0.1:5001" });

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleOnChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.confirmPassword)
      return toast.error("กรอกข้อมูลให้ครบ");

    if (form.password !== form.confirmPassword)
      return toast.error("ยืนยันรหัสผ่านไม่ตรงกัน");

    try {
      setLoading(true);
      // ส่งเฉพาะ email + password ไป backend
      const res = await api.post("/api/register", {
        email: form.email,
        password: form.password,
      });
      toast.success(res.data || "สมัครสมาชิกสำเร็จ");
      navigate("/login");
    } catch (err) {
      const errMsg = err?.response?.data?.message || "สมัครสมาชิกไม่สำเร็จ";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#f4faf7]">
      <div className="mx-auto max-w-screen-xl px-4 py-10 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left */}
          <div className="order-2 space-y-6 lg:order-1">
            <h2 className="text-2xl font-bold text-emerald-700">
              ก้าวสู่ระบบของบ้านกลางปาล์ม
            </h2>
            <p className="text-gray-600">
              สมัครสมาชิกเพื่อดูราคา แจ้งขาย ติดตามสถานะ และรับการแจ้งเตือน
            </p>
            <img
              src={hero}
              alt="illustration"
              className="w-full max-h-[360px] object-contain"
            />
          </div>

          {/* Right */}
          <div className="order-1 rounded-2xl bg-white p-6 shadow-lg lg:order-2 lg:p-8">
            <h1 className="mb-6 text-center text-3xl font-extrabold">
              สมัครสมาชิก
            </h1>

            <form onSubmit={handleOnSubmit} className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium">อีเมล</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleOnChange}
                  placeholder="กรอกอีเมล"
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  รหัสผ่าน
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleOnChange}
                  placeholder="กรอกรหัสผ่าน"
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  ยืนยันรหัสผ่าน
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleOnChange}
                  placeholder="ยืนยันรหัสผ่าน"
                  className="w-full rounded-lg border border-gray-300 px-3 py-3 outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm">
              มีบัญชีอยู่แล้ว?{" "}
              <Link to="/login" className="text-emerald-600 hover:underline">
                เข้าสู่ระบบที่นี่
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
