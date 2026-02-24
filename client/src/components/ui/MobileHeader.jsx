import React from "react";
import { HEADER_CONFIG } from "../../config/headerConfig";

const MobileHeader = ({ children, className = "" }) => {
    return (
        <div className={`${HEADER_CONFIG.wrapperClasses} ${className}`}>
            {children}
        </div>
    );
};

export default MobileHeader;
