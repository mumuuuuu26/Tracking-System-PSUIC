import React from "react";
import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Home, User, CircleUser, Mail, Heart } from "lucide-react";
import useAuthStore from "../store/auth-store";
import Swal from "sweetalert2";

import SidebarUser from "../components/user/SidebarUser";

const LayoutUser = ({ children }) => {
  const { user } = useAuthStore();
  const location = useLocation();

  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const isActive = (path) => location.pathname === path;



  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header (Hidden on Desktop) */}
      {/* Global Header */}
      {/* Global Header - Hidden on Home Page (/user) */}
      {/* Desktop Header (Visible on Desktop) */}
      <header className="hidden md:flex bg-[#193C6C] shadow-lg shadow-blue-900/10 px-10 py-6 justify-between items-center text-white sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <img src="/img/psuic_logo.png" alt="PSUIC Service" className="h-12 w-auto object-contain brightness-0 invert" />
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:block text-right">
            <p className="text-sm font-bold">{user?.name || "User"}</p>
            <p className="text-xs text-blue-200 uppercase tracking-wide">
              {user?.role || "Student"}
            </p>
          </div>

          <button
            onClick={() => navigate("/user/profile")}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10 transition-colors"
          >
            <CircleUser className="text-white" size={32} />
          </button>
        </div>
      </header>



      {/* Main Content */}
      <main className="pb-32 md:pb-24">
        <div className="max-w-[1920px] mx-auto flex items-start gap-8 lg:gap-24 px-0 md:px-6 lg:px-8">
          {/* Sidebar - Visible only on Desktop */}
          <div className="hidden lg:block w-80 shrink-0 sticky top-24 h-fit pt-8">
            <SidebarUser />
          </div>

          {/* Content */}
          <div className="flex-1 w-full min-w-0">
            {children || <Outlet />}
          </div>
        </div>
      </main>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden">
        <nav className="bg-white border-t border-gray-100 pb-safe pt-3 px-6 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <NavLink href="/user" icon={<Home size={24} />} label="Home" active={isActive("/user")} />
            <NavLink href="/user/create-ticket" icon={<Mail size={24} />} label="Report" active={isActive("/user/create-ticket")} />
            <NavLink href="/user/history" icon={<Heart size={24} />} label="History" active={isActive("/user/history")} />
            <NavLink href="/user/profile" icon={<User size={24} />} label="Profile" active={isActive("/user/profile")} />
          </div>
        </nav>
      </div>
    </div>
  );
};

// Helper Component for Nav Links
const NavLink = ({ href, icon, label, active, hasDot, badge }) => (
  <a
    href={href}
    className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 w-16 relative ${active
      ? "text-[#193C6C]"
      : "text-gray-400 hover:text-gray-600"
      }`}
  >
    <div className={`transition-transform duration-200 relative ${active ? "-translate-y-1" : ""}`}>
      {icon}
      {hasDot && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
      )}
      {badge && (
        <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center border border-white">
          {badge}
        </span>
      )}
    </div>
    <span className={`text-[10px] font-medium mt-1 ${active ? "font-bold" : ""}`}>
      {label}
    </span>
  </a>
)

// Helper Component for Mobile Nav Links
const MobileNavLink = ({ href, icon, label, active, onClick, isLogout }) => (
  <a
    href={href}
    onClick={onClick}
    className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 ${isLogout
      ? "text-red-600 hover:bg-red-50 font-medium"
      : active
        ? "bg-blue-50 text-blue-600 font-bold shadow-sm"
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium"
      }`}
  >
    {icon}
    {label}
  </a>
);

export default LayoutUser;
