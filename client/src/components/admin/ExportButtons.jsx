import React from 'react';
import { Download, FileText } from 'lucide-react';

const ExportButtons = ({ onExportPDF, onExportExcel, isExporting }) => {
    return (
        <div className="flex gap-4 justify-center mt-8">
            <button
                onClick={onExportPDF}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-6 py-3 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors border border-red-100 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isExporting ? <span className="animate-spin">⏳</span> : <FileText size={18} />}
                Export PDF
            </button>
            <button
                onClick={onExportExcel}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 bg-green-50 text-green-600 px-6 py-3 rounded-xl text-sm font-bold hover:bg-green-100 transition-colors border border-green-100 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Download size={18} />
                Export Excel
            </button>
        </div>
    );
};

export default ExportButtons;
