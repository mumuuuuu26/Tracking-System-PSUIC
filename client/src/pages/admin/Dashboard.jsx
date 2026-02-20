import React, { useState, useEffect, useCallback } from "react";
import { Users, Shield, Database, LayoutGrid, ChevronRight, Ticket, Monitor, Key, FileText, Briefcase, Lock, BookOpen } from "lucide-react";
import { getDashboardStats } from "../../api/admin";
import { useNavigate } from "react-router-dom";
import AdminWrapper from "../../components/admin/AdminWrapper";
import AdminHeader from "../../components/admin/AdminHeader";

const Dashboard = () => {
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
            const res = await getDashboardStats();
            setStats(res.data);
        } catch (err) {
            console.error(err);
        }
    }, []);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const kpiCards = [
        {
            title: "Total Tickets",
            count: stats.ticketCount,
            icon: <Ticket size={24} className="text-role-admin-text" />,
            bgIcon: "bg-gray-100",
        },
        {
            title: "IT Support",
            count: stats.itStaffCount,
            icon: <Briefcase size={24} className="text-role-admin-text" />,
            bgIcon: "bg-gray-100",
        },
        {
            title: "Resolution Rate",
            count: stats.resolutionRate + "%",
            icon: <Shield size={24} className="text-role-admin-text" />,
            bgIcon: "bg-gray-100",
        },
        {
            title: "Equipment",
            count: stats.equipmentCount,
            icon: <Database size={24} className="text-role-admin-text" />,
            bgIcon: "bg-gray-100",
        }
    ];

    const menuItems = [
        {
            title: "User Management",
            desc: "Manage student & staff accounts",
            icon: <Users size={24} className="text-role-admin-text" />,
            bg: "bg-gray-100",
            link: "/admin/manage-users",
        },
        {
            title: "Floor & Room Management",
            desc: "Lab and server room status",
            icon: <LayoutGrid size={24} className="text-role-admin-text" />,
            bg: "bg-gray-100",
            link: "/admin/manage-rooms",
        },
        {
            title: "Equipment Management",
            desc: "Inventory tracking",
            icon: <Database size={24} className="text-role-admin-text" />,
            bg: "bg-gray-100",
            link: "/admin/manage-equipment",
        },
        {
            title: "Permission",
            desc: "Access control",
            icon: <Lock size={24} className="text-role-admin-text" />,
            bg: "bg-gray-100",
            link: "/admin/permission",
        },
        {
            title: "Knowledge Base",
            desc: "Guides & Troubleshooting",
            icon: <BookOpen size={24} className="text-role-admin-text" />,
            bg: "bg-gray-100",
            link: "/admin/quick-fix",
        },
        {
            title: "Analytics Reports",
            desc: "Dashboard and export the reports",
            icon: <FileText size={24} className="text-role-admin-text" />,
            bg: "bg-gray-100",
            link: "/admin/reports",
        },
    ];

    return (
        <AdminWrapper>
            <div className="flex flex-col h-full px-6 pt-6 pb-24 md:pb-6 space-y-6 overflow-y-auto">
                <AdminHeader
                    title="Analytics Dashboard"
                    subtitle="Monitor helpdesk performance"
                    showBackPlaceholder={true}
                />

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                    {kpiCards.map((card, idx) => (
                        <div key={idx} className="bg-white px-6 py-5 rounded-[1.5rem] shadow-sm flex items-center justify-between h-28">
                            <div className="flex flex-col justify-center">
                                <p className="text-role-admin-text text-3xl font-medium mb-1">{card.count}</p>
                                <span className="text-gray-400 text-xs font-medium uppercase tracking-wide">{card.title}</span>
                            </div>
                            <div className={`w-12 h-12 rounded-full ${card.bgIcon} flex items-center justify-center shrink-0`}>
                                {React.cloneElement(card.icon, { size: 24 })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Management Section */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <h2 className="text-[#64748b] text-xs font-medium uppercase tracking-wider mb-3 ml-1">MANAGEMENT</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                        {menuItems.map((item, index) => (
                            <div
                                key={index}
                                onClick={() => navigate(item.link)}
                                className="bg-white px-6 py-4 rounded-[1.5rem] shadow-sm flex items-center gap-5 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
                            >
                                <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                                    {React.cloneElement(item.icon, { size: 24 })}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-medium text-role-admin-text truncate mb-0.5">{item.title}</h3>
                                    <p className="text-xs text-gray-500 truncate">{item.desc}</p>
                                </div>
                                <ChevronRight size={20} className="text-gray-300" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AdminWrapper>
    );
};

export default Dashboard;
