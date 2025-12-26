import React, { useState, useEffect } from "react";
import useAuthStore from "../../store/auth-store";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Login = () => {
  const navigate = useNavigate();
  // 1. ดึงค่า user ออกมาด้วย เพื่อเช็คว่าล็อกอินอยู่ไหม
  const { actionLogin, user } = useAuthStore();
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const hdlChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const roleRedirect = (role) => {
    if (role === "admin") {
      navigate("/admin");
    } else if (role === "it_support") {
      navigate("/it");
    } else {
      navigate("/user");
    }
  };

  // -------------------------------------------------------------
  // 2. ฟังก์ชันตรวจสอบ: ถ้ามี User อยู่แล้ว ให้เด้งไปหน้าอื่นทันที
  // -------------------------------------------------------------
  useEffect(() => {
    if (user && user.role) {
      roleRedirect(user.role);
    }
  }, [user]); // ทำงานทุกครั้งที่ค่า user เปลี่ยนแปลงหรือเริ่มโหลดหน้า

  const hdlSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await actionLogin(form);
      roleRedirect(res.data.payload.role);
      toast.success("Welcome back");
    } catch (err) {
      console.log(err);
      toast.error(err.response?.data?.message || "Login Failed");
    }
  };

  const handlePSUPassport = () => {
    // TODO: Implement OAuth2 flow with PSU Passport
    toast.info(
      "PSU Passport integration coming soon! Please use manual login for now."
    );
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
            <span className="text-3xl text-white">🛠️</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">PSUIC Help Desk</h1>
          <p className="text-gray-600 mt-2">ระบบรายงานปัญหาด้านไอที</p>
        </div>

        {/* Main Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
            ยินดีต้อนรับ
          </h2>

          {/* PSU Passport Button */}
          <button
            onClick={handlePSUPassport}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] shadow-lg"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 0C4.477 0 0 4.477 0 10s4.477 10 10 10 10-4.477 10-10S15.523 0 10 0zm0 18.75c-4.832 0-8.75-3.918-8.75-8.75S5.168 1.25 10 1.25s8.75 3.918 8.75 8.75-3.918 8.75-8.75 8.75z" />
              <path d="M10 5a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm0 7.5c-2.071 0-3.75.84-3.75 1.875v.625h7.5v-.625c0-1.035-1.679-1.875-3.75-1.875z" />
            </svg>
            Login with PSU Passport
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">หรือ</span>
            </div>
          </div>

          {/* Toggle Manual Login */}
          {!showManualLogin ? (
            <button
              onClick={() => setShowManualLogin(true)}
              className="w-full text-gray-600 hover:text-gray-800 text-sm underline transition"
            >
              เข้าสู่ระบบด้วยอีเมล (สำหรับผู้ดูแลระบบ)
            </button>
          ) : (
            <>
              {/* Manual Login Form */}
              <form onSubmit={hdlSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อีเมล
                  </label>
                  <input
                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    type="email"
                    name="email"
                    onChange={hdlChange}
                    placeholder="admin@psuic.psu.ac.th"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    รหัสผ่าน
                  </label>
                  <input
                    className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    type="password"
                    name="password"
                    onChange={hdlChange}
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2.5 rounded-lg transition-all transform hover:scale-[1.02]"
                >
                  เข้าสู่ระบบ
                </button>
              </form>

              <button
                onClick={() => setShowManualLogin(false)}
                className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm underline transition"
              >
                กลับไปหน้าหลัก
              </button>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>สำหรับนักศึกษาและบุคลากร PSU</p>
          <p className="mt-1">ใช้ PSU Passport ในการเข้าสู่ระบบ</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
