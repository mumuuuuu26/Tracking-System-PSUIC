import React, { useState } from 'react';
import MonthlyReport from './MonthlyReport';
import AnnualReport from './AnnualReport';
import EquipmentAnalysis from './EquipmentAnalysis';
import ITPerformance from './ITPerformance';
import SatisfactionReport from './SatisfactionReport';
import { BarChart, PieChart, Activity, Server, Heart, ArrowLeft, Download, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import AdminWrapper from "../../../components/admin/AdminWrapper";
import AdminHeader from "../../../components/admin/AdminHeader";
import AdminSelect from "../../../components/admin/AdminSelect";

const ReportDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('monthly');
    const [month, setMonth] = useState(dayjs().month() + 1);
    const [year, setYear] = useState(dayjs().year());

    const tabs = [
        { id: 'monthly', label: 'Ticket Overview', icon: <Activity size={18} /> },
        { id: 'performance', label: 'User Analysis', icon: <Activity size={18} /> },
        { id: 'room', label: 'Floor & Room', icon: <Server size={18} /> },
        { id: 'equipment', label: 'Equipment', icon: <Server size={18} /> },
        // { id: 'annual', label: 'Annual Report', icon: <PieChart size={18} /> },
        // { id: 'satisfaction', label: 'Satisfaction', icon: <Heart size={18} /> },
    ];

    return (
        <AdminWrapper>
            <div className="flex flex-col h-full px-6 pt-6 pb-6 space-y-6 overflow-y-auto">
                {/* Header Card */}
                <AdminHeader
                    title="System Reports"
                    subtitle={`Analytics Overview • ${dayjs().format('MMMM D, YYYY')}`}
                    onBack={() => navigate(-1)}
                />

                {/* Filters & Tabs Row */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-3 mb-4">
                    {/* Tabs */}
                    <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-100">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-md font-bold text-xs transition-all
                                        ${activeTab === tab.id
                                        ? 'bg-[#1e2e4a] text-white shadow-md'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                    }
                                    `}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Date Filters */}
                    {activeTab === 'monthly' && (
                        <div className="flex items-center gap-2">
                            <AdminSelect
                                value={year}
                                onChange={setYear}
                                options={Array.from({ length: 3 }, (_, i) => 2024 + i)} // [2024, 2025, 2026]
                                className="min-w-[90px]"
                            />

                            <AdminSelect
                                value={month}
                                onChange={setMonth}
                                options={Array.from({ length: 12 }, (_, i) => ({
                                    value: i + 1,
                                    label: dayjs().month(i).format('MMMM')
                                }))}
                                className="min-w-[140px]"
                            />

                            <button className="bg-[#1e2e4a] text-white p-2 rounded-lg shadow-sm hover:bg-[#15233b] transition-colors">
                                <Download size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div id="report-content" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ErrorBoundary>
                        {activeTab === 'monthly' && <MonthlyReport month={month} year={year} />}
                        {activeTab === 'performance' && <ITPerformance />}
                        {activeTab === 'room' && (
                            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[300px]">
                                <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mb-3">
                                    <Server size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-[#1e2e4a] mb-1">Floor & Room Analysis</h3>
                                <p className="text-gray-500 text-sm text-center max-w-md">
                                    Detailed analysis of ticket distribution across different floors and rooms will be displayed here.
                                </p>
                            </div>
                        )}
                        {activeTab === 'equipment' && <EquipmentAnalysis />}
                        {/* {activeTab === 'annual' && <AnnualReport />}
                            {activeTab === 'satisfaction' && <SatisfactionReport />} */}
                    </ErrorBoundary>
                </div>
            </div>
        </AdminWrapper >
    );
};

export default ReportDashboard;
