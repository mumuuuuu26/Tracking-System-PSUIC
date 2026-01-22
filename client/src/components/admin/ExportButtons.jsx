import React from 'react';
import { Download, FileText } from 'lucide-react';

const ExportButtons = ({ onExportPDF, onExportExcel, isExporting }) => {
    return (
        <div className="flex gap-4 justify-center mt-8">
            <button
                onClick={onExportPDF}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 bg-[#193C6C] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#15325b] transition-colors shadow-lg shadow-blue-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isExporting ? <span className="animate-spin">⏳</span> : <FileText size={18} />}
                Export PDF
            </button>
            <button
                onClick={onExportExcel}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 bg-white text-[#193C6C] px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors border border-blue-200 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download size={18} />
                Export Excel
            </button>
        </div>
    );
};

export default ExportButtons;
