import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MobileHeader from "../ui/MobileHeader";

const ITPageHeader = ({ title, showBack = true, onBack, children }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <MobileHeader className="-mt-6 -mx-4 md:-mx-8 flex items-center justify-between">
            <div className="flex-shrink-0 z-10">
                {showBack && (
                    <button
                        onClick={handleBack}
                        className="text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                )}
            </div>
            <span className="text-lg font-bold text-white absolute left-1/2 -translate-x-1/2 z-0 pointer-events-none whitespace-nowrap text-center">
                {title}
            </span>
            <div className="flex-shrink-0 z-10 flex items-center justify-end min-w-[40px]">
                {children}
            </div>
        </MobileHeader>
    );
};

export default ITPageHeader;
