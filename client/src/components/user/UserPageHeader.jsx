import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

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
            <div className="bg-gradient-to-r from-blue-700 via-blue-800 to-blue-900 dark:from-[#0d1b2a] dark:via-[#193C6C] dark:to-[#0d1b2a] px-5 py-4 flex items-center shadow-[0_4px_20px_rgba(0,0,0,0.15)] dark:shadow-none border-b border-transparent dark:border-white/10 rounded-b-[2rem]">
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
            </div>
        </div>
    );
};

export default UserPageHeader;
