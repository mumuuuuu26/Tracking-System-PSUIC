import axios from "axios";
import React, { useState } from "react";
import { toast } from "react-toastify";
import useEcomStore from "../../store/ecom-store";
import { useNavigate, Link } from "react-router-dom";
import hero from "../../assets/auth-hero.png";

const api = axios.create({ baseURL: "http://127.0.0.1:5001" });

const Login = () => {
  const navigate = useNavigate();
  const actionLogin = useEcomStore((s) => s.actionLogin);

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleOnChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const roleRedirect = (role) => {
    if (role === "admin") navigate("/admin");
    else navigate("/user");
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error("กรอกข้อมูลให้ครบ");

    try {
      setLoading(true);
      const res = await actionLogin(form); // ใช้ store เดิม
      roleRedirect(res.data?.payload?.role);
      toast.success("Welcome Back");
    } catch (err) {
      const errMsg = err?.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ";
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
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-emerald-700">
              เข้าสู่ระบบบ้านกลางปาล์ม
            </h2>
            <p className="text-gray-600">
              ดูราคาอัปเดต จัดการคำสั่งขาย และติดตามสถานะได้ในที่เดียว
            </p>
            <img
              src={hero}
              alt="illustration"
              className="w-full max-h-[360px] object-contain"
            />
          </div>

          {/* Right (Form) */}
          <div className="rounded-2xl bg-white p-6 shadow-lg lg:p-8">
            <h1 className="mb-6 text-center text-3xl font-extrabold">
              เข้าสู่ระบบ
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

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-gray-400">หรือ</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <Link
              to="/register"
              className="block w-full rounded-lg border border-emerald-600 py-3 text-center font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
