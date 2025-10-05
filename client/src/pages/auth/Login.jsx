import axios from "axios";
import React, { useState } from "react";
import { toast } from "react-toastify";
import useEcomStore from "../../store/ecom-store";
import { useNavigate, Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import hero from "../../assets/auth-hero.png";

const api = axios.create({ baseURL: "http://127.0.0.1:5001" });

const Login = () => {
  const navigate = useNavigate();
  const actionLogin = useEcomStore((s) => s.actionLogin);

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      const res = await actionLogin(form);
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="mx-auto max-w-screen-xl px-4 py-10 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left - Hero Section */}
          <div className="space-y-6">
            <div className="inline-block rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
              🌴 ยินดีต้อนรับกลับ
            </div>
            <h2 className="text-3xl font-bold leading-tight text-emerald-700 lg:text-4xl">
              เข้าสู่ระบบบ้านกลางปาล์ม
            </h2>
            <p className="text-lg text-gray-600">
              ดูราคาอัปเดต ติดตามประวัติการซื้อขายได้ในที่เดียว
            </p>
            <img
              src={hero}
              alt="illustration"
              className="w-full max-h-[360px] object-contain"
            />
          </div>

          {/* Right - Form Section */}
          <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-emerald-100 lg:p-10">
            <div className="mb-8 text-center">
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                เข้าสู่ระบบ
              </h1>
              <p className="text-gray-600">ยินดีต้อนรับกลับสู่ระบบ</p>
            </div>

            <form onSubmit={handleOnSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  อีเมล
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleOnChange}
                    placeholder="your@email.com"
                    className="w-full rounded-xl border-2 border-gray-200 py-3 pl-12 pr-4 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleOnChange}
                    placeholder="กรอกรหัสผ่าน"
                    className="w-full rounded-xl border-2 border-gray-200 py-3 pl-12 pr-12 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:shadow-xl hover:shadow-emerald-300 disabled:opacity-60"
              >
                <span className="relative z-10">
                  {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                </span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-emerald-700 to-teal-700 transition-transform group-hover:translate-x-0"></div>
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
              <span className="text-sm font-medium text-gray-400">หรือ</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
            </div>

            {/* Register Link */}
            <Link
              to="/register"
              className="block w-full rounded-xl border-2 border-emerald-600 bg-white py-3.5 text-center font-semibold text-emerald-700 transition-all hover:bg-emerald-50 hover:shadow-md"
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
