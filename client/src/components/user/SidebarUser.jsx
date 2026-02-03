import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home } from "lucide-react";

const SidebarUser = ({ className = "" }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = (path) => location.pathname === path;

    const services = [
        {
            icon: <img src="/icons/3dicons-bookmark-dynamic-color.png" alt="Home" />,
            title: "Home",
            action: () => navigate("/user"),
            path: "/user"
        },
        {
            icon: <img src="/icons/camera-3d.png" alt="Scan QR" />,
            title: "Scan QR",
            action: () => navigate("/user/scan-qr"),
            path: "/user/scan-qr",
            className: "lg:hidden"
        },
        {
            icon: <img src="/img/3dicons-pencil-dynamic-color.png" alt="Report Issue" />,
            title: "Report Issue",
            action: () => navigate("/user/create-ticket"),
            path: "/user/create-ticket"
        },
        {
            icon: <img src="/icons/calendar-3d.png" alt="IT Schedule" />,
            title: "IT Schedule",
            action: () => navigate("/user/it-schedule"),
            path: "/user/it-schedule"
        },
        {
            icon: <img src="/icons/notebook-3d.png" alt="Knowledge" />,
            title: "Knowledge",
            action: () => navigate("/user/quick-fix"),
            path: "/user/quick-fix"
        },


        {
            icon: <img src="/icons/history-3d.png" alt="History" />,
            title: "History",
            action: () => navigate("/user/history"),
            path: "/user/history"
        },
        {
            icon: <img src="/icons/profile-3d.png" alt="Profile" />,
            title: "Profile",
            action: () => navigate("/user/profile"),
            path: "/user/profile"
        },
    ];

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            {services.map((service, index) => (
                <button
                    key={index}
                    onClick={service.action}
                    className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 group w-full text-left
            ${isActive(service.path) ? "bg-white shadow-sm" : "hover:bg-gray-200/50"} ${service.className || ""}`}
                >
                    <div className="w-10 h-10 flex items-center justify-center shrink-0">
                        {React.cloneElement(service.icon, { className: "w-full h-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-300" })}
                    </div>
                    <span className={`text-sm font-bold ${isActive(service.path) ? "text-[#193C6C]" : "text-gray-700"}`}>
                        {service.title}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default SidebarUser;
