import React, { useState } from "react";
import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, Clock, User, Menu, X, LogOut, LayoutDashboard, Wrench } from "lucide-react";
import useAuthStore from "../store/auth-store";
import Swal from "sweetalert2";

const LayoutIT = () => {
  const { user, actionLogout } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Assuming role is 'it_support' based on backend
  if (!user || user.role !== "it_support") {
    return <Navigate to="/login" />;
  }

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    Swal.fire({
      title: "Log out",
      text: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#d33",
      confirmButtonText: "Log out",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        actionLogout();
        setMobileMenuOpen(false);
        navigate("/login");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header (Hidden on Desktop) */}
      <header className="bg-white shadow-sm sticky top-0 z-40 md:hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🛠️</span>
            </div>
            <span className="font-semibold text-gray-800">PSUIC Service</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Desktop Header (Visible on Desktop) */}
      {/* Desktop Header (Visible on Desktop) */}
      <header className="hidden md:block bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 ring-2 ring-white">
              <Wrench className="text-white" size={20} />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg leading-tight tracking-tight">PSUIC Service</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-xs text-gray-500 font-medium tracking-wide">IT Support Portal</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden lg:flex flex-col items-end">
              <p className="text-sm font-bold text-gray-800">{user?.name || "IT Officer"}</p>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                {(user?.role || "IT Support").replace(/_/g, " ")}
              </span>
            </div>

            <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
              <div className="h-10 w-10 rounded-full ring-2 ring-gray-100 p-0.5">
                <div className="h-full w-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {user?.picture ? (
                    <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} className="text-gray-400" />
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-all duration-200"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-2xl transform transition-transform duration-300">
            <div className="p-6 border-b flex items-center justify-between">
              <span className="font-bold text-lg text-gray-800">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X size={24} />
              </button>
            </div>
            <nav className="p-4 space-y-2">
              <a
                href="/it"
                className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                <LayoutDashboard size={20} /> Dashboard
              </a>
              <a
                href="/it/schedule"
                className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                <Calendar size={20} /> Schedule
              </a>
              <a
                href="/it/history"
                className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                <Clock size={20} /> History
              </a>
              <a
                href="/it/profile"
                className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                <User size={20} /> Profile
              </a>
              <a
                href="/it/manage-quick-fix"
                className="flex items-center gap-3 py-3 px-4 rounded-xl hover:bg-blue-50 text-gray-700 hover:text-blue-600 font-medium transition-colors"
              >
                <Wrench size={20} /> Quick Fixes
              </a>
              <hr className="my-4 border-gray-100" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 py-3 px-4 text-red-600 rounded-xl hover:bg-red-50 font-medium transition-colors"
              >
                <LogOut size={20} /> Logout
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pb-24 pt-6 px-4 md:px-6">
        <Outlet />
      </main>

      {/* Floating Bottom Navigation (Dock Style on Desktop) */}
      <div className="fixed bottom-0 left-0 right-0 md:bottom-8 md:flex md:justify-center z-30 pointer-events-none">
        <nav className="pointer-events-auto bg-white/90 backdrop-blur-md border-t md:border border-gray-200/50 md:rounded-full md:shadow-2xl md:px-8 py-2 md:py-3 transition-all duration-300">
          <div className="grid grid-cols-5 md:flex md:gap-8 w-full md:w-auto">
            <NavLink href="/it" icon={<LayoutDashboard size={24} />} label="Tasks" active={isActive("/it")} />
            <NavLink href="/it/schedule" icon={<Calendar size={24} />} label="Schedule" active={isActive("/it/schedule")} />
            <NavLink href="/it/history" icon={<Clock size={24} />} label="History" active={isActive("/it/history")} />
            <NavLink href="/it/manage-quick-fix" icon={<Wrench size={24} />} label="Quick Fix" active={isActive("/it/manage-quick-fix")} />
            <NavLink href="/it/profile" icon={<User size={24} />} label="Profile" active={isActive("/it/profile")} />
          </div>
        </nav>
      </div>
    </div>
  );
};

// Helper Component for Nav Links
const NavLink = ({ href, icon, label, active }) => (
  <a
    href={href}
    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 group relative ${active
      ? "text-blue-600 scale-110 md:-translate-y-1"
      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50"
      }`}
  >
    <div className={`transition-transform duration-200 ${active ? "bg-blue-100 p-2 rounded-xl mb-1" : ""}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-bold ${active ? "opacity-100" : "opacity-0 md:group-hover:opacity-100"} transition-opacity duration-200 absolute -bottom-4 md:relative md:bottom-auto md:mt-1`}>
      {label}
    </span>
    {active && <div className="absolute -bottom-1 w-1 h-1 bg-blue-600 rounded-full md:hidden" />}
  </a>
)

export default LayoutIT;
