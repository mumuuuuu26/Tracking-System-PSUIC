import React, { useState } from 'react';
import MonthlyReport from './MonthlyReport';
import AnnualReport from './AnnualReport';
import EquipmentAnalysis from './EquipmentAnalysis';
import ITPerformance from './ITPerformance';
import SatisfactionReport from './SatisfactionReport';
import { BarChart, PieChart, Activity, Server, Heart } from 'lucide-react';

const ReportDashboard = () => {
    const [activeTab, setActiveTab] = useState('monthly');

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
            <div className="bg-white border-b border-gray-100 pt-8 pb-4 px-4 sticky top-0 z-20 bg-opacity-90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-800 mb-6">System Reports</h1>

                    {/* Scrollable Tabs */}
                    <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'bg-gray-900 text-white shadow-lg shadow-gray-200 transform scale-105'
                                        : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-800'
                                    }
                                `}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === 'monthly' && <MonthlyReport />}
                {activeTab === 'annual' && <AnnualReport />}
                {activeTab === 'equipment' && <EquipmentAnalysis />}
                {activeTab === 'performance' && <ITPerformance />}
                {activeTab === 'satisfaction' && <SatisfactionReport />}
            </div>
        </div>
    );
};

export default ReportDashboard;
