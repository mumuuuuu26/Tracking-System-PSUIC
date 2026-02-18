import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import MobileHeader from "../ui/MobileHeader";

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
        <MobileHeader className="-mt-6 -mx-4 md:-mx-8 flex items-center">
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
        </MobileHeader>
    );
};

export default ITPageHeader;
