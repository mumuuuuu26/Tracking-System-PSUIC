import React, { useState, useEffect, useCallback } from "react";
import { Users, Shield, Database, LayoutGrid, ChevronRight, Home, Ticket, Settings, FileText, Monitor, Key, Briefcase } from "lucide-react";
import { getDashboardStats } from "../../api/admin";
import useAuthStore from "../../store/auth-store";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        ticketCount: 0,
        itStaffCount: 0,
        roomCount: 0,
        equipmentCount: 0,
        resolutionRate: 0
    });

    const loadStats = useCallback(async () => {
        try {
            const res = await getDashboardStats(token);
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    }, [token]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const kpiCards = [
        {
            title: "Total Tickets",
            count: stats.ticketCount,
            label: "Total Tickets",
            value: stats.ticketCount,
            icon: <Ticket size={24} className="text-white" />,
            bgIcon: "bg-blue-600",
            text: "text-blue-600"
        },
        {
            title: "IT Support",
            count: stats.itStaffCount,
            label: "IT Support",
            value: stats.itStaffCount,
            icon: <Briefcase size={24} className="text-white" />,
            bgIcon: "bg-blue-600",
            text: "text-blue-600"
        },
        {
            title: "Resolution Rate",
            count: stats.resolutionRate + "%",
            label: "Resolution Rate",
            value: stats.resolutionRate + "%",
            icon: <Shield size={24} className="text-white" />,
            bgIcon: "bg-blue-600",
            text: "text-blue-600"
        },
        {
            title: "Equipment",
            count: stats.equipmentCount,
            label: "Equipment",
            value: stats.equipmentCount,
            icon: <Database size={24} className="text-white" />,
            bgIcon: "bg-blue-600",
            text: "text-blue-600"
        }
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
            icon: <Monitor size={24} className="text-blue-600" />,
            bg: "bg-blue-50",
            link: "/admin/manage-it",
        },
        {
            title: "Floor & Room Management",
            desc: "Lab and server room status",
            icon: <LayoutGrid size={24} className="text-blue-600" />,
            bg: "bg-blue-50",
            link: "/admin/manage-rooms",
        },
        {
            title: "Equipment Management",
            desc: "Inventory tracking",
            icon: <Database size={24} className="text-blue-600" />,
            bg: "bg-blue-50",
            link: "/admin/manage-equipment",
        },
        {
            title: "Permission",
            desc: "Access control",
            icon: <Key size={24} className="text-blue-600" />,
            bg: "bg-blue-50",
            link: "/admin/permission",
        },
        {
            title: "Analytics Reports",
            desc: "Dashboard and export the reports",
            icon: <FileText size={24} className="text-blue-600" />,
            bg: "bg-blue-50",
            link: "/admin/reports",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Header */}
            <div className="bg-[#193C6C] pt-12 pb-16 px-6 rounded-b-[2.5rem] relative">

                <div>
                    <p className="text-blue-200 text-sm font-medium mb-1">Monitor helpdesk performance</p>
                    <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
                </div>
            </div>

            {/* Filter Dropdown (Mockup) */}


            {/* KPI Cards Grid */}
            <div className="px-6 grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8 mt-6">
                {kpiCards.map((card, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-24">
                        <div className="flex justify-between items-start">
                            <span className="text-xs text-gray-500 font-medium truncate">{card.label}</span>
                            <div className={`w-8 h-8 rounded-lg ${card.bgIcon} flex items-center justify-center shadow-sm`}>
                                {React.cloneElement(card.icon, { size: 16 })}
                            </div>
                        </div>
                        <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Management Section */}
            <div className="px-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Management</h2>
                <div className="space-y-4">
                    {menuItems.map((item, index) => (
                        <div
                            key={index}
                            onClick={() => navigate(item.link)}
                            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 active:scale-95 transition-transform cursor-pointer"
                        >
                            <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                                {item.icon}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                                <p className="text-xs text-gray-500">{item.desc}</p>
                            </div>
                            <ChevronRight size={20} className="text-gray-300" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
