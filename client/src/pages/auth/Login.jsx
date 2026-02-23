import React, { useState, useEffect } from "react";
import useAuthStore from "../../store/auth-store";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ChevronRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { actionLogin, user } = useAuthStore();
  const isPsuPassportEnabled = import.meta.env.VITE_PSU_PASSPORT_ENABLED === "true";
  const [showManualLogin, setShowManualLogin] = useState(false);
  const [loading, setLoading] = useState(false);
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

  const roleRedirect = React.useCallback((role) => {
    // Add a small delay to ensure state updates propagate
    setTimeout(() => {
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "it_support") {
        navigate("/it", { replace: true });
      } else {
        navigate("/user", { replace: true });
      }
    }, 100);
  }, [navigate]);

  useEffect(() => {
    if (user && user.role) {
      roleRedirect(user.role);
    }
  }, [user, roleRedirect]);

  const hdlSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await actionLogin(form);
      roleRedirect(res.data.payload.role);
      toast.success("Welcome back");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login Failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePSUPassport = () => {
    if (!isPsuPassportEnabled) {
      toast.info("PSU Passport ปิดใช้งานชั่วคราว กรุณาเข้าสู่ระบบด้วยอีเมล");
      return;
    }
    toast.info("PSU Passport integration is not available yet.");
  };

  return (
    <div className="min-h-screen flex flex-col bg-blue-600">
      {/* Centered Logo Section */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md hover:scale-105 transition-transform duration-500">
          <img
            src="/img/psuic_logo.png"
            alt="PSUIC Service Logo"
            className="w-full h-auto object-contain drop-shadow-2xl"
          />
        </div>
      </div>

      {/* Bottom Actions Section */}
      <div className="w-full p-8 pb-12 bg-blue-600 animate-fade-in-up">
        <div className="max-w-md mx-auto space-y-6">
          {/* Primary Button: PSU Passport */}
          <button
            onClick={handlePSUPassport}
            disabled={!isPsuPassportEnabled}
            className={`w-full group relative overflow-hidden text-blue-600 font-bold py-4 px-6 rounded-2xl shadow-xl transition-all duration-300 ${isPsuPassportEnabled
              ? "bg-white hover:bg-gray-100 hover:shadow-2xl transform hover:-translate-y-1"
              : "bg-white/80 cursor-not-allowed opacity-80"
              }`}
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              <div className="flex flex-col items-center">
                <span className="text-lg">
                  {isPsuPassportEnabled ? "Login with PSU Passport" : "PSU Passport"}
                </span>
                {!isPsuPassportEnabled && (
                  <span className="text-sm font-medium opacity-80 mt-0.5">(Temporarily Unavailable)</span>
                )}
              </div>
              <ChevronRight
                className={`w-6 h-6 text-blue-600/80 transition-transform ${isPsuPassportEnabled ? "group-hover:translate-x-1" : ""
                  }`}
              />
            </div>
          </button>

          {!showManualLogin ? (
            <div className="space-y-6">
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setShowManualLogin(true)}
                  className="text-white/90 hover:text-white text-base font-medium transition-colors"
                >
                  Login with Email
                </button>
                <div className="w-px h-5 bg-white/40"></div>
                <button
                  onClick={() => navigate("/register")}
                  className="text-white hover:text-white/90 text-base font-bold underline decoration-white/50 hover:decoration-white transition-all bg-transparent"
                >
                  Create an Account
                </button>
              </div>
              <div className="text-center text-white/50 text-sm font-light">
                For PSUIC Students, Faculty & Staff
              </div>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl shadow-xl animate-fade-in-up w-full text-left">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-white">Email Login</h3>
                <button
                  onClick={() => setShowManualLogin(false)}
                  className="text-white/60 hover:text-white text-sm"
                >
                  Cancel
                </button>
              </div>
              <form onSubmit={hdlSubmit} className="space-y-4">
                <div>
                  <input
                    className="w-full border border-white/20 bg-white/10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all text-white placeholder-white/50"
                    type="email"
                    name="email"
                    onChange={hdlChange}
                    placeholder="name@gmail.com"
                    required
                    aria-label="Email"
                  />
                </div>
                <div>
                  <input
                    className="w-full border border-white/20 bg-white/10 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all text-white placeholder-white/50"
                    type="password"
                    name="password"
                    onChange={hdlChange}
                    placeholder="••••••••"
                    required
                    aria-label="Password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
