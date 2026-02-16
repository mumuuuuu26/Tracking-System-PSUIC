import React from "react";
import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Home, User, CircleUser, Mail, Clock } from "lucide-react";
import useAuthStore from "../store/auth-store";
import Swal from "sweetalert2";

import UserNavbar from "../components/user/UserNavbar";

const LayoutUser = ({ children }) => {
  const { user, hasHydrated } = useAuthStore();
  const location = useLocation();

  const navigate = useNavigate();

  // Wait for hydration to finish before redirecting
  if (!hasHydrated) {
    return <div>Loading...</div>; // Or return null / spinner
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const isActive = (path) => location.pathname === path;



  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Navigation */}
      <UserNavbar />

      {/* Main Content */}
      <main className="pb-32 md:pb-24 pt-0 md:pt-6">
        <div className="max-w-[1920px] mx-auto flex items-start justify-center px-0 md:px-6 lg:px-8">

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
            <NavLink href="/user/report" icon={<Mail size={24} />} label="Report" active={isActive("/user/report")} />
            <NavLink href="/user/history" icon={<Clock size={24} />} label="History" active={isActive("/user/history")} />
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
