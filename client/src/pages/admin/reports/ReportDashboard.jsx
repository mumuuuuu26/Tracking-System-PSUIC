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
        { id: 'monthly', label: 'Monthly Report', icon: <BarChart size={20} /> },
        { id: 'annual', label: 'Annual Report', icon: <PieChart size={20} /> },
        { id: 'equipment', label: 'Equipment Analysis', icon: <Server size={20} /> },
        { id: 'performance', label: 'IT Performance', icon: <Activity size={20} /> },
        { id: 'satisfaction', label: 'Satisfaction', icon: <Heart size={20} /> },
    ];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">System Reports</h1>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-2 px-6 py-3 rounded-t-lg font-medium transition-colors
                            ${activeTab === tab.id
                                ? 'bg-white border-x border-t border-gray-200 text-blue-600 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                            }
                        `}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-b-xl min-h-[500px]">
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
