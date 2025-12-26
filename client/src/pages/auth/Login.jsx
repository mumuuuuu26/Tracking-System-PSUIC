import React, { useState } from "react";
import { toast } from "react-toastify";
import useEcomStore from "../../store/ecom-store";
import { useNavigate } from "react-router-dom";
import { Lock, User, School } from "lucide-react"; // ใช้ Icon จาก Lucide

const Login = () => {
  const navigate = useNavigate();
  const actionLogin = useEcomStore((s) => s.actionLogin);

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleOnChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const roleRedirect = (role) => {
    if (role === "admin") navigate("/admin");
    else if (role === "it_support") navigate("/it"); // เตรียมไว้สำหรับ IT
    else navigate("/user");
  };

  const handleOnSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await actionLogin(form);
      roleRedirect(res.data?.payload?.role);
      toast.success("Welcome Back to PSUIC Help Desk!");
    } catch (err) {
      const errMsg = err?.response?.data?.message || "Login Failed";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันจำลองการ Login ด้วย PSU Passport (สำหรับ Dev)
  const handleMockPSULogin = async () => {
    // ใช้ User ที่คุณสร้างไว้ใน Database (เช่น user หรือ teacher)
    const mockUser = {
      email: "student@psu.ac.th", //เปลี่ยนเป็น email
      password: "2222", //เปลี่ยนเป็น password ที่คู่กัน
    };

    try {
      setLoading(true);
      const res = await actionLogin(mockUser);
      roleRedirect(res.data?.payload?.role);
      toast.success("Login with PSU Passport (Mock) Success!");
    } catch (err) {
      toast.error("Mock Login Failed: เช็ค Email/Pass ในโค้ดอีกทีครับ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl sm:flex-row flex-col">
        {/* Left Side - Image/Logo */}
        <div className="w-full bg-blue-900 p-10 text-white sm:w-1/2 flex flex-col justify-center items-center">
          <School className="mb-4 h-20 w-20 opacity-90" />
          <h1 className="mb-2 text-3xl font-bold">PSUIC Tracking</h1>
          <p className="text-blue-200 text-center">
            Maintenance & IT Support System
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="w-full p-10 sm:w-1/2">
          <h2 className="mb-6 text-2xl font-bold text-slate-800 text-center">
            เข้าสู่ระบบ
          </h2>

          {/* ปุ่ม PSU Passport (Mock) */}
          <button
            onClick={handleMockPSULogin}
            disabled={loading}
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-70"
          >
            <School className="h-5 w-5" />
            Login with PSU Passport
          </button>

          <div className="relative mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200"></div>
            <span className="text-xs text-slate-400">OR (Admin/Dev)</span>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>

          <form onSubmit={handleOnSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleOnChange}
                  className="w-full rounded-lg border border-slate-300 pl-10 py-2.5 focus:border-blue-500 focus:outline-none"
                  placeholder="admin@psu.ac.th"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleOnChange}
                  className="w-full rounded-lg border border-slate-300 pl-10 py-2.5 focus:border-blue-500 focus:outline-none"
                  placeholder="******"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-800 py-2.5 font-medium text-white transition hover:bg-slate-900"
            >
              {loading ? "Loading..." : "Login (Admin)"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
