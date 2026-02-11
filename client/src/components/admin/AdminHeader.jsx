import React from 'react';
import { ArrowLeft } from 'lucide-react';


const AdminHeader = ({ title, subtitle, onBack, children, className = "", showBackPlaceholder = false }) => {


    return (
        <div className={`bg-white rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}>
            <div className="flex items-center gap-4">
                {onBack ? (
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                ) : showBackPlaceholder ? (
                    <div className="w-10 h-10 -ml-2" />
                ) : null}
                <div>
                    <h1 className="text-[#1e2e4a] text-2xl font-medium">{title}</h1>
                    {subtitle && <p className="text-gray-500 text-sm font-medium">{subtitle}</p>}
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-3">
                    {children}
                </div>
            )}
        </div>
    );
};

export default AdminHeader;
