import React, { useState } from 'react';
import MonthlyReport from './MonthlyReport';
import AnnualReport from './AnnualReport';
import EquipmentAnalysis from './EquipmentAnalysis';
import ITPerformance from './ITPerformance';
import SatisfactionReport from './SatisfactionReport';
import { BarChart, PieChart, Activity, Server, Heart, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ReportDashboard = () => {
    const [activeTab, setActiveTab] = useState('monthly');
    const [isExporting, setIsExporting] = useState(false);

    const tabs = [
        { id: 'monthly', label: 'Monthly Report', icon: <BarChart size={18} /> },
        { id: 'annual', label: 'Annual Report', icon: <PieChart size={18} /> },
        { id: 'equipment', label: 'Equipment Analysis', icon: <Server size={18} /> },
        { id: 'performance', label: 'IT Performance', icon: <Activity size={18} /> },
        { id: 'satisfaction', label: 'Satisfaction', icon: <Heart size={18} /> },
    ];

    const handleExportPDF = async () => {
        setIsExporting(true);
        const element = document.getElementById('report-content');
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                windowWidth: element.scrollWidth,
                windowHeight: element.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 10;

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save(`psuic-report-${activeTab}-${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error("Export failed", err);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 pt-8 pb-4 px-4 sticky top-0 z-20 bg-opacity-90 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-800">System Reports</h1>


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
            <div id="report-content" className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white/50 min-h-[500px]">
                {activeTab === 'monthly' && <MonthlyReport />}
                {activeTab === 'annual' && <AnnualReport />}
                {activeTab === 'equipment' && <EquipmentAnalysis />}
                {activeTab === 'performance' && <ITPerformance />}
                {activeTab === 'satisfaction' && <SatisfactionReport />}
            </div>
        </div >
    );
};

export default ReportDashboard;
