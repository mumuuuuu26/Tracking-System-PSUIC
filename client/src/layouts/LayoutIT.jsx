import React from "react";
import { Outlet, Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { Home, Calendar, User, CircleUser, FileText, Bell } from "lucide-react";
import useAuthStore from "../store/auth-store";
import Swal from "sweetalert2";

const LayoutIT = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Assuming role is 'it_support' based on backend
  if (!user || user.role !== "it_support") {
    return <Navigate to="/login" />;
  }

  const isActive = (path) => location.pathname === path;



  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header (Hidden on Desktop) */}
      <header className="bg-blue-600 shadow-sm sticky top-0 z-40 md:hidden text-white">
        <div className="flex items-center justify-between p-4 px-6">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-bold text-lg leading-tight">IT Support</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/it/notifications")}
              className="p-2 relative bg-white/20 rounded-full hover:bg-white/30 transition-colors"
            >
              <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-blue-600"></div>
              <span className="text-white"><Bell size={20} /></span>
            </button>

            <button
              onClick={() => navigate("/it/profile")}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <CircleUser size={32} className="text-white/90" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop Header (Visible on Desktop) */}
      <header className="hidden md:flex bg-blue-600 shadow-lg shadow-blue-900/10 px-6 py-4 justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <img src="/img/psuic_logo.png" alt="PSUIC Service" className="h-14 w-auto object-contain" />
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:block text-right">
            <p className="text-sm font-bold">{user?.name || "IT Officer"}</p>
            <p className="text-xs text-blue-200 uppercase tracking-wide">{(user?.role || "IT Support").replace(/_/g, " ")}</p>
          </div>
          <button
            onClick={() => navigate("/it/profile")}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          >
            <CircleUser size={32} className="text-white/90" />
          </button>

        </div>
      </header>

      {/* Main Content */}
      <main className="pb-32 md:pb-24">
        <Outlet />
      </main>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30">
        <nav className="bg-white border-t border-gray-100 pb-safe pt-2 px-2 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
          <div className="flex items-end justify-between w-full max-w-lg mx-auto relative">
            <NavLink href="/it" icon={<Home size={22} />} label="Home" active={isActive("/it")} />

            <NavLink href="/it/tickets" icon={<FileText size={22} />} label="Ticket" active={isActive("/it/tickets") || isActive("/it/history")} />

            <NavLink href="/it/schedule" icon={<Calendar size={22} />} label="Schedule" active={isActive("/it/schedule")} />

            {/* New Tools */}



            <NavLink href="/it/profile" icon={<User size={22} />} label="Profile" active={isActive("/it/profile")} />
          </div>
        </nav>
      </div>
    </div>
  );
};

// Helper Component for Nav Links
const NavLink = ({ href, icon, label, active }) => (
  <Link
    to={href}
    className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 ${active
      ? "text-blue-600"
      : "text-gray-400 hover:text-gray-600"
      }`}
  >
    <div className={`transition-transform duration-200 ${active ? "-translate-y-1" : ""}`}>
      {icon}
    </div>
    <span className={`text-[9px] font-medium mt-1 truncate w-full text-center ${active ? "opacity-100 font-bold" : "opacity-70"}`}>
      {label}
    </span>
  </Link>
)

export default LayoutIT;
