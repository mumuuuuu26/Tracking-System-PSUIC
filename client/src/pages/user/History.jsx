import React from "react";
import { Clock } from "lucide-react";
import TicketHistory from "../../components/user/TicketHistory";
import UserWrapper from "../../components/user/UserWrapper";
import UserPageHeader from "../../components/user/UserPageHeader";

const History = () => {

    return (
        <UserWrapper>
            <div className="pb-20 bg-gray-50 dark:bg-[#0d1b2a] min-h-screen">
                {/* Mobile Header */}
                <UserPageHeader title="Task History" />

                {/* Desktop Header Section */}
                <div className="max-w-5xl mx-auto pt-8 px-6 mb-6 hidden lg:block">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-700/30 border border-blue-200 dark:border-blue-700/40 flex items-center justify-center text-blue-600 dark:text-blue-300 transition-colors">
                            <Clock size={20} />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight transition-colors">Task History</h1>
                    </div>
                    <p className="text-gray-500 dark:text-blue-400/60 text-sm ml-14 transition-colors">Archive of all completed maintenance tasks and resolutions</p>
                </div>

                <div className="max-w-5xl mx-auto px-6 mt-6 space-y-5 animate-in fade-in duration-500 relative z-10">
                    <TicketHistory />
                </div>
            </div>
        </UserWrapper>
    );
};

export default History;
