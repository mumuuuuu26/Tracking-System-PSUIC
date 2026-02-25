import React from "react";
import { Outlet, Navigate, useLocation, Link } from "react-router-dom";
import {
    Users,
    BarChart,
    User,
    Briefcase,
    LayoutDashboard,
    LogOut
} from "lucide-react";

import useAuthStore from "../store/auth-store";
import AdminNavbar from "../components/admin/AdminNavbar";
import AdminWrapper from "../components/admin/AdminWrapper";


const LayoutAdmin = () => {
    const { user } = useAuthStore();
    const location = useLocation();

    // Check if user is admin
    if (!user || user.role !== "admin") {
        return <Navigate to="/login" />;
    }

    const isActive = (path) => location.pathname === path;




    return (
        <div className="admin-theme min-h-screen bg-gray-50 font-sans">
            {/* Reusable Admin Navbar */}
            <AdminNavbar />

            {/* Main Content */}
            <main className="py-6 px-4 md:px-8 max-w-7xl mx-auto w-full">
                <AdminWrapper>
                    <Outlet />
                </AdminWrapper>
            </main>

            {/* Mobile Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-30 md:hidden">
                <nav className="bg-white border-t border-gray-100 pb-safe pt-2 px-6 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.1)]">
                    <div className="flex items-center justify-between relative px-2">
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
                            href="/admin/quick-fix"
                            icon={<Briefcase size={24} />}
                            label="Quick Fix"
                            active={isActive("/admin/quick-fix")}
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

// Helper Component for Nav Links (Mobile)
const NavLink = ({ href, icon, label, active }) => (
    <Link
        to={href}
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
    </Link>
);

export default LayoutAdmin;
