import React, { useState, useEffect } from "react";
import useAuthStore from "../../store/auth-store";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { LogIn, ChevronRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    if (user && user.role) {
      roleRedirect(user.role);
    }
  }, [user]);

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
    // TODO: Implement OAuth2 flow
    toast.info(
      "PSU Passport integration coming soon! Please use manual login for now."
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-400 to-blue-600">
      <div className="w-full max-w-md flex flex-col items-center justify-center p-6 space-y-10 animate-fade-in">
        {/* System Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-64 sm:w-80 md:w-96 h-auto relative mb-4 hover:scale-105 transition-transform duration-500">
            <img
              src="/logo.png"
              alt="PSUIC Service Logo"
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white text-center drop-shadow-lg leading-tight">
            <br />
            Help desk
            <br />
            System
          </h1>
        </div>

        {/* Login Actions */}
        <div className="w-full space-y-4">
          {/* Primary Button: PSU Passport */}
          <button
            onClick={handlePSUPassport}
            className="w-full group relative overflow-hidden bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <div className="relative z-10 flex items-center justify-center gap-3">
              <span>Login with PSU Passport</span>
              <ChevronRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {!showManualLogin ? (
            <div className="flex items-center justify-center gap-4 py-2">
              <button
                onClick={() => setShowManualLogin(true)}
                className="text-white/80 hover:text-white text-sm font-medium transition-colors"
              >
                Login with Email
              </button>
              <div className="w-px h-4 bg-white/30"></div>
              <button
                onClick={() => navigate("/register")}
                className="text-white hover:text-white/90 text-sm font-bold underline decoration-white/50 hover:decoration-white transition-all bg-transparent"
              >
                Create an Account
              </button>
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
                    placeholder="name@psu.ac.th"
                    required
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
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg"
                >
                  Sign In
                </button>
              </form>
            </div>
          )}

          {!showManualLogin && (
            <div className="text-center text-white/50 text-xs font-light">
              For PSUIC Students, Faculty & Staff Only
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
