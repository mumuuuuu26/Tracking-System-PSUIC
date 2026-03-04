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
        <div className="sticky top-0 z-40 lg:hidden px-0">
            <MobileHeader className="flex items-center">
                {showBack && (
                    <button
                        onClick={handleBack}
                        className="text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft size={22} />
                    </button>
                )}
                <h1
                    data-testid={titleTestId}
                    className="text-base font-bold text-white absolute left-1/2 -translate-x-1/2 tracking-wide"
                >
                    {title}
                </h1>
            </MobileHeader>
        </div>
    );
};

export default UserPageHeader;
