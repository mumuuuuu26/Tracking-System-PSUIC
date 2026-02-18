import React from 'react';

const ITWrapper = ({ children, className = "" }) => {
    return (
        <div className={`w-full max-w-5xl mx-auto ${className}`}>
            {children}
        </div>
    );
};

export default ITWrapper;
