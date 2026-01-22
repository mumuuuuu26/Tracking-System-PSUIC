import React, { useState } from 'react';
import MonthlyReport from './MonthlyReport';
import AnnualReport from './AnnualReport';
import EquipmentAnalysis from './EquipmentAnalysis';
import ITPerformance from './ITPerformance';
import SatisfactionReport from './SatisfactionReport';
import { BarChart, PieChart, Activity, Server, Heart, Calendar } from 'lucide-react';
import dayjs from 'dayjs';
import ErrorBoundary from '../../../components/common/ErrorBoundary';

const ReportDashboard = () => {
    const [activeTab, setActiveTab] = useState('monthly');
    const [month, setMonth] = useState(dayjs().month() + 1);
    const [year, setYear] = useState(dayjs().year());

    const tabs = [
        { id: 'monthly', label: 'Monthly Report', icon: <BarChart size={18} /> },
        { id: 'annual', label: 'Annual Report', icon: <PieChart size={18} /> },
        { id: 'equipment', label: 'Equipment Analysis', icon: <Server size={18} /> },
        { id: 'performance', label: 'IT Performance', icon: <Activity size={18} /> },
        { id: 'satisfaction', label: 'Satisfaction', icon: <Heart size={18} /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 pt-8 pb-6 px-4 mb-8 sticky top-0 z-20 bg-opacity-90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">System Reports</h1>
                    <p className="text-gray-500 text-sm mb-6">View system performance, equipment analysis, and user satisfaction reports</p>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Scrollable Tabs */}
                        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1 w-full md:w-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                    flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap
                                    ${activeTab === tab.id
                                            ? 'bg-gray-900 text-white shadow-md'
                                            : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                                        }
                                `}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Filters (Only for Monthly Report for now, or adaptable) */}
                        {activeTab === 'monthly' && (
                            <div className="flex items-center gap-2 bg-gray-50 px-1 py-1 rounded-xl border border-gray-100 p-1">
                                <div className="flex items-center gap-2 px-3 py-1.5 border-r border-gray-200">
                                    <Calendar size={16} className="text-gray-400" />
                                    <select
                                        value={month}
                                        onChange={e => setMonth(Number(e.target.value))}
                                        className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer py-1"
                                    >
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>Month {m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="px-3 py-1.5">
                                    <select
                                        value={year}
                                        onChange={e => setYear(Number(e.target.value))}
                                        className="bg-transparent border-none text-sm font-bold text-gray-700 focus:ring-0 cursor-pointer py-1"
                                    >
                                        {Array.from({ length: 3 }, (_, i) => 2024 + i).map(y => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div id="report-content" className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/50 min-h-[500px]">
                <ErrorBoundary>
                    {activeTab === 'monthly' && <MonthlyReport month={month} year={year} />}
                    {activeTab === 'annual' && <AnnualReport />}
                    {activeTab === 'equipment' && <EquipmentAnalysis />}
                    {activeTab === 'performance' && <ITPerformance />}
                    {activeTab === 'satisfaction' && <SatisfactionReport />}
                </ErrorBoundary>
            </div>
        </div >
    );
};

export default ReportDashboard;
