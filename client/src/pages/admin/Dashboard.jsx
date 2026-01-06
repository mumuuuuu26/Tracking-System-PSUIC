import React, { useState, useEffect } from "react";
import { Ticket, Users, Monitor, Building, ChevronRight } from "lucide-react";
import { getDashboardStats } from "../../api/admin";
import useAuthStore from "../../store/auth-store";

const Dashboard = () => {
    const { token } = useAuthStore();
    const [stats, setStats] = useState({
        ticketCount: 0,
        itStaffCount: 0,
        roomCount: 0,
        equipmentCount: 0,
    });

    useEffect(() => {
        loadStats();
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
            icon: <Ticket className="text-blue-500" />,
            color: "bg-blue-100",
        },
        {
            title: "Active IT Staff",
            value: stats.itStaffCount,
            icon: <Users className="text-blue-500" />,
            color: "bg-blue-100",
        },
        {
            title: "Rooms",
            value: stats.roomCount,
            icon: <Building className="text-orange-500" />,
            color: "bg-orange-100",
        },
        {
            title: "Equipment",
            value: stats.equipmentCount,
            icon: <Monitor className="text-purple-500" />,
            color: "bg-purple-100",
        },
    ];

    const menuItems = [
        {
            title: "User Management",
            desc: "Manage student & staff accounts",
            icon: <Users className="text-blue-600" />,
            bg: "bg-blue-100",
            link: "/admin/manage-users",
        },
        {
            title: "IT Staff Management",
            desc: "Assign roles and schedules",
            icon: <Monitor className="text-purple-600" />,
            bg: "bg-purple-100",
            link: "/admin/manage-it",
        },
        {
            title: "Room Management",
            desc: "Lab and server room status",
            icon: <Building className="text-orange-600" />,
            bg: "bg-orange-100",
            link: "/admin/manage-rooms",
        },
        {
            title: "Category Management",
            desc: "Add or edit equipment categories",
            icon: <Ticket className="text-green-600" />,
            bg: "bg-green-100",
            link: "/admin/manage-categories",
        },
    ];

    return (
        <div className="space-y-6">
            {/* Blue Banner */}
            <div className="bg-gradient-to-r from-blue-400 to-blue-300 rounded-3xl h-48 w-full shadow-lg relative overflow-hidden">
                {/* Decorative Circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-10 w-20 h-20 bg-white/20 rounded-full blur-xl" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32"
                    >
                        <div
                            className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-2`}
                        >
                            {stat.icon}
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                            <p className="text-sm text-gray-500">{stat.title}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Management Section */}
            <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Management</h2>
                <div className="space-y-3">
                    {menuItems.map((item, index) => (
                        <a
                            href={item.link}
                            key={index}
                            className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow group"
                        >
                            <div
                                className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}
                            >
                                {item.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800">{item.title}</h3>
                                <p className="text-sm text-gray-500">{item.desc}</p>
                            </div>
                            <ChevronRight className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
