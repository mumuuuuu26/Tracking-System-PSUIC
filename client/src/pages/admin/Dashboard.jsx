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
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header / Welcome Section */}
            <div className="bg-white border-b border-gray-100 pt-8 pb-8 px-4 mb-8 sticky top-0 z-20 bg-opacity-90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-500 mt-1">Welcome back, {user?.name || "Admin"}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                        <Clock size={16} className="text-blue-600" />
                        <span className="text-sm font-bold text-gray-700">
                            {currentTime.format("dddd, DD MMMM YYYY")}
                        </span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 space-y-8">
                {/* Stats Grid */}
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Overview</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {statCards.map((stat, index) => (
                            <div
                                key={index}
                                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow cursor-default group"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                                        {stat.icon}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                                    <p className="text-sm font-medium text-gray-400">{stat.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Management Grid */}
                <div>
                    <h2 className="text-lg font-bold text-gray-800 mb-4 px-1">Quick Access</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {menuItems.map((item, index) => (
                            <a
                                href={item.link}
                                key={index}
                                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-lg hover:border-blue-100 transition-all group relative overflow-hidden"
                            >
                                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white to-transparent opacity-50 rounded-bl-full pointer-events-none group-hover:scale-150 transition-transform duration-500`}></div>

                                <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-sm`}>
                                    {item.icon}
                                </div>
                                <div className="flex-1 relative z-10">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                                    <p className="text-sm text-gray-500">{item.desc}</p>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                                    <ChevronRight size={18} />
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
