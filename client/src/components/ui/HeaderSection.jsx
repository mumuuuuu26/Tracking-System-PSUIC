import React from "react";

const HeaderSection = ({ children, className = "" }) => {
    return (
        <header className={`bg-role-it shadow-md sticky top-0 z-50 font-sans text-white hidden md:block ${className}`}>
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-start gap-10">
                {children}
            </div>
        </header>
    );
};

export default HeaderSection;
