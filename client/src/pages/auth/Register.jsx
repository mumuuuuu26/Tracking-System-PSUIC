import axios from "axios";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const passwordStrength = () => {
    if (!form.password) return 0;
    let strength = 0;
    if (form.password.length >= 8) strength++;
    if (/[A-Z]/.test(form.password)) strength++;
    if (/[0-9]/.test(form.password)) strength++;
    if (/[^A-Za-z0-9]/.test(form.password)) strength++;
    return strength;
  };

  const getStrengthColor = () => {
    const strength = passwordStrength();
    if (strength <= 1) return "bg-red-500";
    if (strength === 2) return "bg-yellow-500";
    if (strength === 3) return "bg-blue-500";
    return "bg-emerald-500";
  };

  const getStrengthText = () => {
    const strength = passwordStrength();
    if (strength === 0) return "";
    if (strength <= 1) return "อ่อน";
    if (strength === 2) return "ปานกลาง";
    if (strength === 3) return "ดี";
    return "แข็งแรงมาก";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="mx-auto max-w-screen-xl px-4 py-10 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Left - Hero Section */}
          <div className="order-2 space-y-6 lg:order-1">
            <div className="inline-block rounded-full bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
              🌴 ยินดีต้อนรับ
            </div>
            <h2 className="text-3xl font-bold leading-tight text-emerald-700 lg:text-4xl">
              ก้าวสู่ระบบของบ้านกลางปาล์ม
            </h2>
            <p className="text-lg text-gray-600">
              สมัครสมาชิกเพื่อดูราคา และบิลย้อนหลังได้เลยตอนนี้!
            </p>
            <img
              src={hero}
              alt="illustration"
              className="w-full max-h-[360px] object-contain"
            />
          </div>

          {/* Right - Form Section */}
          <div className="order-1 lg:order-2">
            <div className="rounded-3xl bg-white p-8 shadow-2xl shadow-emerald-100 lg:p-10">
              <div className="mb-8 text-center">
                <h1 className="mb-2 text-3xl font-bold text-gray-900">
                  สมัครสมาชิก
                </h1>
                <p className="text-gray-600">
                  สร้างบัญชีของคุณเพื่อเริ่มต้นใช้งาน
                </p>
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
                      placeholder="สร้างรหัสผ่านที่แข็งแรง"
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
                  {form.password && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-all ${
                              i < passwordStrength()
                                ? getStrengthColor()
                                : "bg-gray-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        ความแข็งแรง:{" "}
                        <span className="font-medium">{getStrengthText()}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    ยืนยันรหัสผ่าน
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleOnChange}
                      placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                      className="w-full rounded-xl border-2 border-gray-200 py-3 pl-12 pr-12 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {form.confirmPassword &&
                    form.password !== form.confirmPassword && (
                      <p className="mt-1 text-xs text-red-500">
                        รหัสผ่านไม่ตรงกัน
                      </p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:shadow-xl hover:shadow-emerald-300 disabled:opacity-60"
                >
                  <span className="relative z-10">
                    {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
                  </span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-emerald-700 to-teal-700 transition-transform group-hover:translate-x-0"></div>
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  มีบัญชีอยู่แล้ว?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 hover:underline"
                  >
                    เข้าสู่ระบบที่นี่
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
