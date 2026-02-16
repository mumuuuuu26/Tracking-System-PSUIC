import React from "react";
import { Outlet, Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { Home, Calendar, User, CircleUser, FileText, Bell } from "lucide-react";
import useAuthStore from "../store/auth-store";
import Swal from "sweetalert2";
import ITNavbar from "../components/it/ITNavbar";
import ITWrapper from "../components/it/ITWrapper";

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


      {/* Desktop Header (Visible on Desktop) */}
      <ITNavbar />

      {/* Main Content */}
      <main className="py-6 px-4 md:px-8 max-w-7xl mx-auto w-full pb-32 md:pb-24">
        <ITWrapper>
          <Outlet />
        </ITWrapper>
      </main>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
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
