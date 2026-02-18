import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { confirmLogout } from "../../utils/sweetalert";

const AdminNavbar = () => {
    const { user, actionLogout } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { name: "Home", path: "/admin" },
        { name: "Users", path: "/admin/manage-users" },
        { name: "Reports", path: "/admin/reports" },
        { name: "Knowledge Base", path: "/admin/quick-fix" },
    ];

    const handleLogout = async () => {
        const isConfirmed = await confirmLogout();
        if (isConfirmed) {
            actionLogout();
            navigate("/");
        }
    };

    return (
        <header className="bg-role-admin shadow-md sticky top-0 z-50 font-sans text-white">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-start gap-10">
                {/* Logo Section */}
                <div className="flex items-center gap-3 shrink-0">
                    <img
                        src="/img/psuic_logo.png"
                        alt="PSUIC Service"
                        className="h-10 w-auto object-contain brightness-0 invert"
                    />
                </div>

                {/* Navigation Links (Left Aligned) */}
                <nav className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            className={`text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 py-1 ${isActive(link.path)
                                ? "text-white border-white"
                                : "text-gray-300 border-transparent hover:text-white"
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>

                {/* Right Section: Profile & Logout */}
                <div className="flex items-center gap-5 ml-auto">
                    {/* Profile */}
                    <div
                        onClick={() => navigate("/admin/profile")}
                        className="flex items-center gap-3 cursor-pointer group"
                    >
                        {user?.picture ? (
                            <img
                                src={user.picture}
                                alt="Profile"
                                className="w-10 h-10 rounded-full border-2 border-white/20 object-cover shadow-sm group-hover:border-white transition-all"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center font-bold text-sm border-2 border-white/20 shadow-sm group-hover:scale-105 transition-all">
                                {user?.name?.charAt(0) || "A"}
                            </div>
                        )}
                        <div className="hidden lg:block text-right">
                            <p className="text-sm font-bold text-white leading-none group-hover:text-blue-200 transition-colors">
                                {user?.name?.split(' ')[0] || "Admin"}
                            </p>
                            <p className="text-[10px] text-blue-200 font-medium uppercase tracking-wider">
                                {user?.role || "Administrator"}
                            </p>
                        </div>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10"
                        title="Log out"
                    >
                        <LogOut size={20} />
                        <span className="hidden xl:inline text-sm font-bold">Log out</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default AdminNavbar;
