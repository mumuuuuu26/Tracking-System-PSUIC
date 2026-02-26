import React from "react";
import { Outlet, Navigate, useLocation, Link } from "react-router-dom";
import { Home, Calendar, User, FileText } from "lucide-react";
import useAuthStore from "../store/auth-store";
import ITNavbar from "../components/it/ITNavbar";
import ITWrapper from "../components/it/ITWrapper";

const LayoutIT = () => {
  const { user } = useAuthStore();
  const location = useLocation();

  // Assuming role is 'it_support' based on backend
  if (!user || user.role !== "it_support") {
    return <Navigate to="/login" />;
  }

  const isActive = (path) => location.pathname === path;



  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d1b2a] overflow-x-hidden">


      {/* Desktop Header (Visible on Desktop) */}
      <ITNavbar />

      {/* Main Content */}
      <main className="py-6 px-4 md:px-8 max-w-7xl mx-auto w-full pb-32 md:pb-24">
        <ITWrapper>
          <Outlet />
        </ITWrapper>
      </main>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <nav className="bg-white dark:bg-[#0f1f3d] border-t border-gray-200 dark:border-blue-900/50 pt-2 pb-safe px-6 shadow-[0_-4px_24px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-between max-w-md mx-auto h-[60px]">
            <NavLink href="/it" icon={<Home size={20} />} label="Home" active={isActive("/it")} />
            <NavLink href="/it/tickets" icon={<FileText size={20} />} label="Ticket" active={isActive("/it/tickets") || isActive("/it/history")} />
            <NavLink href="/it/schedule" icon={<Calendar size={20} />} label="Schedule" active={isActive("/it/schedule")} />
            <NavLink href="/it/profile" icon={<User size={20} />} label="Profile" active={isActive("/it/profile")} />
          </div>
        </nav>
      </div>
    </div>
  );
};

const NavLink = ({ href, icon, label, active }) => (
  <Link
    to={href}
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

export default LayoutIT;
