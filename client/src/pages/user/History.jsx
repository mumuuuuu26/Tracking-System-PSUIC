import { Clock, ArrowLeft } from "lucide-react";
import TicketHistory from "../../components/user/TicketHistory";
import { useNavigate } from "react-router-dom";

const History = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20 font-sans text-gray-900">
            {/* Mobile Header - Top Bar */}
            <div className="bg-[#193C6C] px-4 py-4 flex items-center sticky top-0 z-50 lg:hidden shadow-sm">
                <button
                    onClick={() => navigate(-1)}
                    className="text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <span className="text-lg font-bold text-white absolute left-1/2 -translate-x-1/2">
                    Task History
                </span>
            </div>

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
    );
};

export default History;
