import React from "react";

const MobileHeader = ({ children, className = "" }) => {
    return (
        <div className={`bg-[#193C6C] px-4 pt-8 pb-10 sticky top-0 z-50 lg:hidden shadow-md rounded-b-[2.5rem] ${className}`}>
            {children}
        </div>
    );
};

export default MobileHeader;
