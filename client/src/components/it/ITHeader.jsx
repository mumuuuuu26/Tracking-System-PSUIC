import React from 'react';
import { ArrowLeft } from 'lucide-react';

const ITHeader = ({ title, subtitle, onBack, children, className = "", showBackPlaceholder = false }) => {
    return (
        <div className={`bg-white dark:bg-[#1a2f4e] rounded-3xl p-6 shadow-sm dark:shadow-none border border-transparent dark:border-blue-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4 ${className}`}>
            <div className="flex items-center gap-4">
                {onBack ? (
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 text-gray-400 dark:text-blue-300/60 hover:text-gray-600 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                ) : showBackPlaceholder ? (
                    <div className="w-10 h-10 -ml-2" />
                ) : null}
                <div>
                    <h1 className="text-[#1e2e4a] dark:text-white text-2xl font-bold">{title}</h1>
                    {subtitle && <p className="text-gray-500 dark:text-blue-300/70 text-sm font-medium">{subtitle}</p>}
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

export default ITHeader;
