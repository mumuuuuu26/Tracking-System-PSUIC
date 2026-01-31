import React from "react";
import { Outlet, Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { Home, Calendar, Clock, User, Menu, X, LogOut, LayoutDashboard, Wrench, Bell, FileText, BookOpen, Briefcase } from "lucide-react";
import useAuthStore from "../store/auth-store";
import Swal from "sweetalert2";

const LayoutIT = () => {
  const { user, actionLogout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Assuming role is 'it_support' based on backend
  if (!user || user.role !== "it_support") {
    return <Navigate to="/login" />;
  }

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    Swal.fire({
      title: "Log out",
      text: "Are you sure you want to log out ?",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#fff",
      confirmButtonText: "Log out",
      cancelButtonText: "Cancel",
      customClass: {
        popup: "rounded-3xl p-6 md:p-8",
        title: "text-xl md:text-2xl font-bold text-gray-900 mb-2",
        htmlContainer: "text-gray-500 text-base",
        confirmButton: "bg-[#2563eb] hover:bg-blue-700 text-white min-w-[120px] py-3 rounded-xl font-bold text-sm shadow-sm transition-colors",
        cancelButton: "bg-white hover:bg-gray-50 text-[#2563eb] border border-[#2563eb] min-w-[120px] py-3 rounded-xl font-bold text-sm transition-colors",
        actions: "gap-4 w-full px-4 mt-4"
      },
      buttonsStyling: false
    }).then((result) => {
      if (result.isConfirmed) {
        actionLogout();
        navigate("/login");
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header (Hidden on Desktop) */}
      <header className="bg-blue-600 shadow-sm sticky top-0 z-40 md:hidden text-white">
        <div className="flex items-center justify-between p-4 px-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center border-2 border-white/20 overflow-hidden">
              {user?.picture ? (
                <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-white" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">IT Support</h1>
            </div>
          </div>
          <button
            onClick={() => navigate("/it/notifications")} // Assuming notifications page exists
            className="p-2 relative bg-white/20 rounded-full"
          >
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-blue-600"></div>
            <span className="text-white"><Bell size={20} /></span>
            {/* Bell icon needs import */}
          </button>
        </div>
      </header>

      {/* Desktop Header (Visible on Desktop) */}
      <header className="hidden md:flex bg-blue-600 shadow-lg shadow-blue-900/10 sticky top-0 z-40 px-6 py-4 justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <img src="/img/psuic_logo.png" alt="PSUIC Service" className="h-14 w-auto object-contain" />
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:block text-right">
            <p className="text-sm font-bold">{user?.name || "IT Officer"}</p>
            <p className="text-xs text-blue-200 uppercase tracking-wide">{(user?.role || "IT Support").replace(/_/g, " ")}</p>
          </div>
          <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 shadow-sm overflow-hidden backdrop-blur-sm">
            {user?.picture ? (
              <img src={user.picture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-white" />
            )}
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-white/10 text-blue-100 hover:text-white rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={20} />
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
