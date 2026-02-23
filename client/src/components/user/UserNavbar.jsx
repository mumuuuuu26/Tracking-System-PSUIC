import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { confirmLogout } from "../../utils/sweetalert";
import HeaderSection from "../ui/HeaderSection";
import ProfileAvatar from "../common/ProfileAvatar";
import { getUserDisplayName } from "../../utils/userIdentity";

const UserNavbar = () => {
    const { user, actionLogout } = useAuthStore();
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;
    const displayName = getUserDisplayName(user, "User");

    const navLinks = [
        { name: "Home", path: "/user", testId: "nav-home" },
        { name: "Report Issue", path: "/user/create-ticket", testId: "nav-create-ticket" },
        { name: "History", path: "/user/history", testId: "nav-history" },
        { name: "Schedule", path: "/user/it-schedule", testId: "nav-schedule" },
        { name: "Knowledge", path: "/user/quick-fix", testId: "nav-knowledge" },
    ];

    const handleLogout = async () => {
        const isConfirmed = await confirmLogout();
        if (isConfirmed) {
            actionLogout();
            navigate("/");
        }
    };

    return (
        <HeaderSection className="bg-role-it">
            {/* Logo Section */}
            <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => navigate("/user")}>
                <img
                    src="/img/psuic_logo.png"
                    alt="PSUIC Service"
                    className="h-10 w-auto object-contain brightness-0 invert"
                />
            </div>

            {/* Navigation Links (Left) */}
            <nav className="flex items-center gap-8">
                {navLinks.map((link) => (
                    <Link
                        key={link.name}
                        to={link.path}
                        data-testid={link.testId}
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
                    onClick={() => navigate("/user/profile")}
                    className="flex items-center gap-3 cursor-pointer group"
                >
                    <ProfileAvatar
                        user={user}
                        alt="Profile"
                        className="w-10 h-10 rounded-full border-2 border-white/20 overflow-hidden shadow-sm group-hover:border-white transition-all"
                        imageClassName="w-full h-full object-cover"
                        fallbackClassName="w-full h-full bg-white/10 text-white flex items-center justify-center"
                        initialsClassName="font-bold text-sm"
                    />
                    <div className="hidden lg:block text-right">
                        <p className="text-sm font-bold text-white leading-none group-hover:text-blue-200 transition-colors">
                            {displayName.split(" ")[0] || "User"}
                        </p>
                        <p className="text-[10px] text-blue-200 font-medium uppercase tracking-wider">
                            {user?.role || "Student"}
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
        </HeaderSection>
    );
};

export default UserNavbar;
