import React, { useState } from 'react';
import MonthlyReport from './MonthlyReport';
import AnnualReport from './AnnualReport';
import EquipmentAnalysis from './EquipmentAnalysis';
import ITPerformance from './ITPerformance';
import SatisfactionReport from './SatisfactionReport';
import { BarChart, PieChart, Activity, Server, Heart, Calendar, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import ErrorBoundary from '../../../components/common/ErrorBoundary';

const ReportDashboard = () => {
    const navigate = useNavigate();
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
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Header */}
            {/* Header */}
            {/* Header */}
            <div className="bg-[#193C6C] px-6 pt-8 pb-6 shadow-md">
                <div className="flex items-center gap-4 text-white mb-2">
                    <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-2 -ml-2 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">System Reports</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 pt-6 mb-6">
                <p className="text-gray-500 text-sm mb-6">View system performance, equipment analysis, and user satisfaction reports</p>
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    {/* Scrollable Tabs */}
                    <div className="w-full lg:w-auto overflow-x-auto pb-1 -mx-4 lg:mx-0 px-4 lg:px-0">
                        <div className="flex gap-2 min-w-max">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                    flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap border
                                    ${activeTab === tab.id
                                            ? 'bg-[#193C6C] text-white border-[#193C6C] shadow-md shadow-blue-900/20'
                                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                                        }
                                `}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filters (Only for Monthly Report for now) */}
                    {activeTab === 'monthly' && (
                        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                            <div className="relative group">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <select
                                    value={month}
                                    onChange={e => setMonth(Number(e.target.value))}
                                    className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl pl-10 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer min-w-[140px]"
                                >
                                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                        <option key={m} value={m}>Month {m}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>

                            <div className="relative group">
                                <select
                                    value={year}
                                    onChange={e => setYear(Number(e.target.value))}
                                    className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl px-4 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                                >
                                    {Array.from({ length: 3 }, (_, i) => 2024 + i).map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div id="report-content" className="max-w-7xl mx-auto px-4 lg:px-6 py-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
