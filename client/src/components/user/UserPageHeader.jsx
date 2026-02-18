import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import MobileHeader from "../ui/MobileHeader";

const UserPageHeader = ({ title, showBack = true, onBack, titleTestId }) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <MobileHeader className="flex items-center">
            {showBack && (
                <button
                    onClick={handleBack}
                    className="text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
            )}
            <h1
                data-testid={titleTestId}
                className="text-lg font-bold text-white absolute left-1/2 -translate-x-1/2"
            >
                {title}
            </h1>
        </MobileHeader>
    );
};

export default UserPageHeader;
