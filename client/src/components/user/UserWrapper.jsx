import React from 'react';

const UserWrapper = ({ children }) => {
    return (
        <div className="max-w-7xl mx-auto w-full min-h-screen font-sans text-[#1e2e4a]">
            {children}
        </div>
    );
};

export default UserWrapper;
