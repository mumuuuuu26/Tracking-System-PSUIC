import React from "react";
import { Clock, ArrowLeft } from "lucide-react";
import TicketHistory from "../../components/user/TicketHistory";
import UserWrapper from "../../components/user/UserWrapper";
import UserPageHeader from "../../components/user/UserPageHeader";

const History = () => {

    return (
        <UserWrapper>
            <div className="pb-20">
                {/* Mobile Header - Top Bar */}
                <UserPageHeader title="Task History" />

                {/* Desktop Header Section */}
                <div className="max-w-5xl mx-auto pt-8 px-6 mb-8 hidden lg:block">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-full bg-[#193C6C] flex items-center justify-center text-white shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-clock"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        </div>
                        <h1 className="text-3xl font-extrabold text-[#193C6C] tracking-tight">Task History</h1>
                    </div>
                    <p className="text-gray-500 text-sm ml-14">Archive of all completed maintenance tasks and resolutions</p>
                </div>

                <div className="max-w-5xl mx-auto px-6 mt-6 space-y-5 animate-in fade-in duration-500 relative z-10">
                    <TicketHistory />
                </div>
            </div>
        </UserWrapper>
    );
};

export default History;
