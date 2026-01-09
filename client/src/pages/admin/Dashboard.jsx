import React, { useState, useEffect } from "react";
import { Ticket, Users, Monitor, Building, ChevronRight, Clock, Shield, Database, LayoutGrid } from "lucide-react";
import { getDashboardStats } from "../../api/admin";
import useAuthStore from "../../store/auth-store";
import dayjs from "dayjs";

const Dashboard = () => {
    const { user, token } = useAuthStore();
    const [stats, setStats] = useState({
        ticketCount: 0,
        itStaffCount: 0,
        roomCount: 0,
        equipmentCount: 0,
    });
    const [currentTime, setCurrentTime] = useState(dayjs());

    useEffect(() => {
        loadStats();
        const timer = setInterval(() => setCurrentTime(dayjs()), 60000);
        return () => clearInterval(timer);
    }, []);

    const loadStats = async () => {
        try {
            const res = await getDashboardStats(token);
            setStats(res.data);
        } catch (err) {
            console.log(err);
        }
    };

    const statCards = [
        {
            title: "Total tickets",
            value: stats.ticketCount,
            icon: <Ticket size={24} className="text-white" />,
            bg: "bg-blue-500",
            lightBg: "bg-blue-50",
            textColor: "text-blue-600"
        },
        {
            title: "Active IT Staff",
            value: stats.itStaffCount,
            icon: <Users size={24} className="text-white" />,
            bg: "bg-emerald-500",
            lightBg: "bg-emerald-50",
            textColor: "text-emerald-600"
        },
        {
            title: "Rooms",
            value: stats.roomCount,
            icon: <Building size={24} className="text-white" />,
            bg: "bg-orange-500",
            lightBg: "bg-orange-50",
            textColor: "text-orange-600"
        },
        {
            title: "Equipment",
            value: stats.equipmentCount,
            icon: <Monitor size={24} className="text-white" />,
            bg: "bg-purple-500",
            lightBg: "bg-purple-50",
            textColor: "text-purple-600"
        },
    ];

    const menuItems = [
        {
            title: "User Management",
            desc: "Manage student & staff accounts",
            icon: <Users size={24} className="text-blue-600" />,
            bg: "bg-blue-50",
            link: "/admin/manage-users",
        },
        {
            title: "IT Staff Management",
            desc: "Assign roles and schedules",
            icon: <Shield size={24} className="text-emerald-600" />,
            bg: "bg-emerald-50",
            link: "/admin/manage-it",
        },
        {
            title: "Room Management",
            desc: "Lab and server room status",
            icon: <LayoutGrid size={24} className="text-orange-600" />,
            bg: "bg-orange-50",
            link: "/admin/manage-rooms",
        },
        {
            title: "Category Management",
            desc: "Add or edit equipment categories",
            icon: <Database size={24} className="text-purple-600" />,
            bg: "bg-purple-50",
            link: "/admin/manage-categories",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Blue Header Section */}
            <div className="bg-blue-600 pt-8 pb-24 px-6 rounded-b-[2.5rem] shadow-lg relative z-0">
                <div className="max-w-4xl mx-auto flex justify-between items-start text-white">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <Shield className="text-white" size={18} />
                            </div>
                            <span className="font-bold tracking-wider text-xs opacity-80 bg-blue-700 px-2 py-1 rounded-lg">ADMIN PORTAL</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">PSUIC Service</h1>
                        <p className="text-blue-100 text-sm mt-1 font-medium">Welcome back, {user?.name || "Admin"}</p>
                    </div>

                    <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs text-blue-200 font-medium">{currentTime.format("dddd")}</p>
                            <p className="font-bold text-sm">{currentTime.format("DD MMM YYYY")}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold shadow-sm">
                            <Clock size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Stats Card */}
            <div className="max-w-4xl mx-auto px-6 -mt-20 relative z-10">
                <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
                    <div className="flex justify-between items-center text-center divide-x divide-gray-100">
                        <div className="flex-1 px-2 group cursor-pointer hover:bg-gray-50 rounded-xl transition-colors py-2">
                            <p className="text-3xl font-extrabold text-blue-600 mb-1 group-hover:scale-110 transition-transform duration-300">{stats.ticketCount}</p>
                            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Total Tickets</p>
                        </div>
                        <div className="flex-1 px-2 group cursor-pointer hover:bg-gray-50 rounded-xl transition-colors py-2">
                            <p className="text-3xl font-extrabold text-emerald-600 mb-1 group-hover:scale-110 transition-transform duration-300">{stats.itStaffCount}</p>
                            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">IT Staff</p>
                        </div>
                        <div className="flex-1 px-2 group cursor-pointer hover:bg-gray-50 rounded-xl transition-colors py-2">
                            <p className="text-3xl font-extrabold text-orange-600 mb-1 group-hover:scale-110 transition-transform duration-300">{stats.roomCount}</p>
                            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Rooms</p>
                        </div>
                        <div className="flex-1 px-2 group cursor-pointer hover:bg-gray-50 rounded-xl transition-colors py-2">
                            <p className="text-3xl font-extrabold text-purple-600 mb-1 group-hover:scale-110 transition-transform duration-300">{stats.equipmentCount}</p>
                            <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">Equipment</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Access Grid */}
            <div className="max-w-4xl mx-auto px-6 mt-10">
                <h2 className="text-lg font-bold text-gray-800 mb-6 pl-1 flex items-center gap-2">
                    <LayoutGrid size={20} className="text-gray-400" />
                    Management
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {menuItems.map((item, index) => (
                        <a
                            href={item.link}
                            key={index}
                            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 transition-all group relative overflow-hidden"
                        >
                            {/* Decorative Background Blob */}
                            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.bg.replace('50', '100')} to-transparent opacity-50 rounded-bl-[100px] pointer-events-none group-hover:scale-150 transition-transform duration-700 ease-out`}></div>

                            <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center shrink-0 group-hover:rotate-6 transition-transform shadow-inner`}>
                                {item.icon}
                            </div>
                            <div className="flex-1 relative z-10">
                                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                <p className="text-sm text-gray-500 font-medium">{item.desc}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-2">
                                <ChevronRight size={18} />
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
