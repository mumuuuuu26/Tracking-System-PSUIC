import React from "react";
import { Outlet, Navigate, useLocation, Link } from "react-router-dom";
import { Home, User, Mail, Clock } from "lucide-react";
import useAuthStore from "../store/auth-store";
import UserNavbar from "../components/user/UserNavbar";

const LayoutUser = ({ children }) => {
  const { user, hasHydrated } = useAuthStore();
  const location = useLocation();

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0d1b2a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="bg-gray-50 dark:bg-[#0d1b2a]">
      {/* Desktop sticky navbar */}
      <UserNavbar />

      {/* Page content — no flex, no fixed height, just block flow */}
      <div className="pb-28 lg:pb-6">
        {children || <Outlet />}
      </div>

      {/* Mobile bottom navigation — fixed */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden">
        <nav className="bg-white dark:bg-[#0f1f3d] border-t border-gray-200 dark:border-blue-900/50 pt-2 pb-safe px-6 shadow-[0_-4px_24px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between max-w-md mx-auto h-[60px]">
            <NavLink href="/user" icon={<Home size={20} />} label="Home" active={isActive("/user")} dataTestId="nav-home" />
            <NavLink href="/user/report" icon={<Mail size={20} />} label="Activity" active={isActive("/user/report")} dataTestId="nav-report" />
            <NavLink href="/user/history" icon={<Clock size={20} />} label="History" active={isActive("/user/history")} dataTestId="nav-history" />
            <NavLink href="/user/profile" icon={<User size={20} />} label="Profile" active={isActive("/user/profile")} dataTestId="nav-profile" />
          </div>
        </nav>
      </div>
    </div>
  );
};

const NavLink = ({ href, icon, label, active, dataTestId }) => (
  <Link
    to={href}
    data-testid={dataTestId}
    className={`flex flex-col items-center justify-center pt-2 pb-1 rounded-xl transition-all duration-200 w-16 relative group h-full ${active ? "text-blue-600 dark:text-white" : "text-gray-400 hover:text-blue-600 dark:text-blue-400/50 dark:hover:text-blue-300"
      }`}
  >
    {active && (
      <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-blue-600 dark:bg-blue-400 rounded-b-full" />
    )}
    <div className={`transition-transform duration-200 ${active ? "scale-105" : ""}`}>
      <div className={`p-1 rounded-xl transition-all duration-200 ${active ? "bg-blue-100 dark:bg-blue-600/30" : "group-hover:bg-gray-100 dark:group-hover:bg-blue-800/20"}`}>
        {icon}
      </div>
    </div>
    <span className={`text-[10px] mt-0.5 ${active ? "font-bold text-blue-600 dark:text-white tracking-wide" : "font-medium text-gray-500 dark:text-blue-400/50"}`}>
      {label}
    </span>
  </Link>
);

export default LayoutUser;
