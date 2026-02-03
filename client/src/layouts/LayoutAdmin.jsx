import React from "react";
import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
    Users,
    UserCog,
    BarChart,
    User,
    Briefcase,
    CircleUser,
    LayoutDashboard,
} from "lucide-react";

import useAuthStore from "../store/auth-store";
import Swal from "sweetalert2";

const LayoutAdmin = () => {
    const { user } = useAuthStore();
    const location = useLocation();

    const navigate = useNavigate();

    // Check if user is admin
    if (!user || user.role !== "admin") {
        return <Navigate to="/login" />;
    }

    const isActive = (path) => location.pathname === path;



    return (
        <div className="min-h-screen bg-slate-50">
            {/* Mobile Header (Hidden on Desktop) */}
            <header className="bg-blue-600 shadow-sm sticky top-0 z-40 md:hidden text-white border-none pointer-events-auto">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                        <img
                            src="/img/psuic_logo.png"
                            alt="PSUIC Service"
                            className="h-10 w-auto object-contain"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate("/admin/profile")}
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
                    <img
                        src="/img/psuic_logo.png"
                        alt="PSUIC Service"
                        className="h-14 w-auto object-contain"
                    />
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:block text-right">
                        <p className="text-sm font-bold">{user?.name || "Administrator"}</p>
                        <p className="text-xs text-blue-200 uppercase tracking-wide">
                            {user?.role || "Admin"}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/admin/profile")}
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
                <nav className="bg-white border-t border-gray-100 pb-safe pt-2 px-6 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between max-w-md mx-auto relative px-2">
                        <NavLink
                            href="/admin"
                            icon={<LayoutDashboard size={24} />}
                            label="Home"
                            active={isActive("/admin")}
                        />

                        <NavLink
                            href="/admin/manage-users"
                            icon={<Users size={24} />}
                            label="Users"
                            active={isActive("/admin/manage-users")}
                        />
                        <NavLink
                            href="/admin/manage-it"
                            icon={<UserCog size={24} />}
                            label="Staff"
                            active={isActive("/admin/manage-it")}
                        />
                        <NavLink
                            href="/admin/reports"
                            icon={<BarChart size={24} />}
                            label="Reports"
                            active={isActive("/admin/reports")}
                        />
                        <NavLink
                            href="/admin/profile"
                            icon={<User size={24} />}
                            label="Profile"
                            active={isActive("/admin/profile")}
                        />
                        <NavLink
                            href="/admin/quick-fix"
                            icon={<Briefcase size={24} />}
                            label="Quick Fix"
                            active={isActive("/admin/quick-fix")}
                        />
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
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 w-16 ${active ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
            }`}
    >
        <div className="transition-transform duration-200">
            {icon}
        </div>
        <span
            className={`text-[10px] whitespace-nowrap font-medium mt-1 ${active ? "opacity-100 font-bold" : "opacity-70"
                }`}
        >
            {label}
        </span>
    </a>
);

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

export default LayoutAdmin;
