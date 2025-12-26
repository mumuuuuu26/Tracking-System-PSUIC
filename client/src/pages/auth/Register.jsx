import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Mail, Lock, CheckCircle2 } from "lucide-react"; // ใช้ Icon ใหม่

const Register = () => {
  const navigate = useNavigate();
  const [value, setValue] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleOnChange = (e) => {
    setValue({ ...value, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (value.password !== value.confirmPassword) {
      return toast.warning("รหัสผ่านไม่ตรงกัน");
    }
    try {
      setLoading(true);
      // ยิง API ไปที่ Backend Port 5001
      const res = await axios.post("http://localhost:5001/api/register", {
        email: value.email,
        password: value.password,
      });
      toast.success("สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ");
      navigate("/login");
    } catch (err) {
      const errMsg = err.response?.data?.message || "สมัครสมาชิกไม่สำเร็จ";
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-blue-600 p-8 text-center text-white">
          <UserPlus className="mx-auto mb-2 h-12 w-12 opacity-90" />
          <h1 className="text-2xl font-bold">สร้างบัญชีใหม่</h1>
          <p className="text-blue-100 text-sm">ระบบแจ้งซ่อม PSUIC</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  className="w-full rounded-lg border border-slate-300 pl-10 py-2.5 focus:border-blue-500 focus:outline-none"
                  placeholder="name@psu.ac.th"
                  onChange={handleOnChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  className="w-full rounded-lg border border-slate-300 pl-10 py-2.5 focus:border-blue-500 focus:outline-none"
                  onChange={handleOnChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                ยืนยันรหัสผ่าน
              </label>
              <div className="relative">
                <CheckCircle2 className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="password"
                  name="confirmPassword"
                  className="w-full rounded-lg border border-slate-300 pl-10 py-2.5 focus:border-blue-500 focus:outline-none"
                  onChange={handleOnChange}
                  required
                />
              </div>
            </div>

            <button
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 py-3 font-bold text-white transition hover:bg-slate-800 disabled:opacity-70"
            >
              {loading ? "กำลังบันทึก..." : "สมัครสมาชิก"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            มีบัญชีอยู่แล้ว?{" "}
            <Link
              to="/login"
              className="font-semibold text-blue-600 hover:underline"
            >
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
