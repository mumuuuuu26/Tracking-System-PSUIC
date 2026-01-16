import React, { useState } from "react";
import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard,
    Ticket,
    Users,
    UserCog,
    Building2,
    Menu,
    X,
    LogOut,
    User,
    BarChart,
    BookOpen,
} from "lucide-react";

import useAuthStore from "../store/auth-store";
import Swal from "sweetalert2";

const LayoutAdmin = () => {
    const { user, actionLogout } = useAuthStore();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    // Check if user is admin
    if (!user || user.role !== "admin") {
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
            <header className="bg-blue-600 shadow-sm sticky top-0 z-40 md:hidden text-white border-none pointer-events-auto">
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-2">
                        <img
                            src="/img/psuic_logo.png"
                            alt="PSUIC Service"
                            className="h-10 w-auto object-contain"
                        />
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
            <header className="hidden md:flex bg-blue-600 shadow-lg shadow-blue-900/10 sticky top-0 z-40 px-6 py-4 justify-between items-center text-white">
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
                    <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30 shadow-sm overflow-hidden backdrop-blur-sm">
                        {user?.picture ? (
                            <img
                                src={user.picture}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
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
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-1 hover:bg-gray-100 rounded-full"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <nav className="p-4 space-y-2">
                            <MobileNavLink
                                href="/admin"
                                icon={<LayoutDashboard size={20} />}
                                label="Dashboard"
                                active={isActive("/admin")}
                            />
                            <MobileNavLink
                                href="/admin/tickets"
                                icon={<Ticket size={20} />}
                                label="All Tickets"
                                active={isActive("/admin/tickets")}
                            />
                            <MobileNavLink
                                href="/admin/manage-users"
                                icon={<Users size={20} />}
                                label="User Management"
                                active={isActive("/admin/manage-users")}
                            />
                            <MobileNavLink
                                href="/admin/manage-it"
                                icon={<UserCog size={20} />}
                                label="IT Staff"
                                active={isActive("/admin/manage-it")}
                            />
                            <MobileNavLink
                                href="/admin/manage-rooms"
                                icon={<Building2 size={20} />}
                                label="Room Management"
                                active={isActive("/admin/manage-rooms")}
                            />
                            <MobileNavLink
                                href="/admin/reports"
                                icon={<BarChart size={20} />}
                                label="Reports"
                                active={isActive("/admin/reports")}
                            />

                            <hr className="my-4 border-gray-100" />
                            <button
                                onClick={handleLogout}
                                className="w-full"
                            >
                                <MobileNavLink
                                    href="#"
                                    icon={<LogOut size={20} />}
                                    label="Logout"
                                    isLogout={true}
                                    onClick={(e) => { e.preventDefault(); handleLogout(); }}
                                />
                            </button>
                        </nav>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="pb-32 md:pb-24">
                <Outlet />
            </main>

            {/* Floating Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-30">
                <nav className="bg-white border-t border-gray-100 pb-safe pt-2 px-6 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
                    <div className="flex items-end justify-between max-w-md mx-auto relative px-2">
                        <NavLink
                            href="/admin"
                            icon={<LayoutDashboard size={24} />}
                            label="Home"
                            active={isActive("/admin")}
                        />
                        <NavLink
                            href="/admin/tickets"
                            icon={<Ticket size={24} />}
                            label="Tickets"
                            active={isActive("/admin/tickets")}
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
        <div
            className={`transition-transform duration-200 ${active ? "-translate-y-1" : ""
                }`}
        >
            {icon}
        </div>
        <span
            className={`text-[10px] font-medium mt-1 ${active ? "opacity-100 font-bold" : "opacity-70"
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
