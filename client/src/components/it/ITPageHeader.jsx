import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ITPageHeader = ({ title, showBack = true, onBack }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="bg-[#193C6C] px-4 pt-4 pb-10 flex items-center sticky top-0 z-50 lg:hidden shadow-sm rounded-b-[30px]">
            {showBack && (
                <button
                    onClick={handleBack}
                    className="text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
            )}
            <span className="text-lg font-bold text-white absolute left-1/2 -translate-x-1/2">
                {title}
            </span>
        </div>
    );
};

export default ITPageHeader;
