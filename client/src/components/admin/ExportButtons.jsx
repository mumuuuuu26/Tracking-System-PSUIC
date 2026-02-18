import React from 'react';
import { Download, FileText } from 'lucide-react';

const ExportButtons = ({ onExportExcel, isExporting }) => {
    return (
        <div className="flex justify-center mt-8">
            <button
                onClick={onExportExcel}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 bg-[#193C6C] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#15325b] transition-colors border border-blue-200 shadow-lg shadow-blue-900/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                <Download size={18} className="group-hover:translate-y-0.5 transition-transform" />
                Export Excel Report
            </button>
        </div>
    );
};

export default ExportButtons;
