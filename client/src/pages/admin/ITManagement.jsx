import React, { useState, useEffect } from "react";
import { Search, Calendar, Edit2, UserCheck, UserX, Clock } from "lucide-react";
import { getITStaff, getITStaffStats } from "../../api/admin";
import useAuthStore from "../../store/auth-store";

const ITManagement = () => {
    const { token } = useAuthStore();
    const [staff, setStaff] = useState([]);
    const [stats, setStats] = useState({ active: 0, onLeave: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [staffRes, statsRes] = await Promise.all([
                getITStaff(token),
                getITStaffStats(token)
            ]);
            setStaff(staffRes.data);
            setStats(statsRes.data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const activeCount = stats.active;
    const leaveCount = stats.onLeave;

    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <div className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Active Staff</p>
                        <h3 className="text-3xl font-bold text-gray-800">{activeCount}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <UserCheck size={24} />
                    </div>
                </div>
                <div className="flex-1 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">On Leave</p>
                        <h3 className="text-3xl font-bold text-gray-800">{leaveCount}</h3>
                    </div>
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                        <UserX size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6 bg-gray-50 p-2 rounded-xl">
                    <Search className="text-gray-400 ml-2" size={20} />
                    <input
                        type="text"
                        placeholder="Search staff by name or role..."
                        className="bg-transparent flex-1 outline-none text-gray-700"
                    />
                </div>

                <div className="flex gap-3 mb-6">
                    <button className="px-5 py-2 bg-gray-900 text-white rounded-full text-sm font-medium">All</button>
                    <button className="px-5 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" /> Available
                    </button>
                    <button className="px-5 py-2 bg-white border border-gray-200 text-gray-600 rounded-full text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500" /> Busy
                    </button>
                </div>

                <div className="space-y-4">
                    {staff.map((member) => (
                        <div key={member.id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-lg transition-all duration-300">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gray-200 overflow-hidden">
                                        {member.picture ? (
                                            <img src={member.picture} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-lg">
                                                IT
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">{member.name || member.email}</h3>
                                        <p className="text-gray-500 text-sm">{member.department || "IT Specialist"}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${member.status === 'Available'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-red-100 text-red-700'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'Available' ? 'bg-green-500' : 'bg-red-500'}`} />
                                    {member.status}
                                </span>
                            </div>

                            {member.status === 'Busy' && member.currentTicket && (
                                <div className="bg-gray-50 rounded-xl p-3 mb-4 flex items-center justify-between">
                                    <div className="text-sm">
                                        <span className="text-gray-500 block text-xs mb-0.5">Working on Ticket</span>
                                        <span className="font-semibold text-gray-700">#{member.currentTicket.title}</span>
                                    </div>
                                    <button className="text-sm bg-white border px-3 py-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:border-blue-200">
                                        View Ticket
                                    </button>
                                </div>
                            )}

                            {member.status === 'Available' && (
                                <div className="mb-4">
                                    <div className="bg-blue-50/50 rounded-xl p-3 text-sm text-blue-600 flex items-center gap-2">
                                        <Clock size={16} />
                                        <span>Ready for assignment</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                                    <Edit2 size={16} /> Assign Task
                                </button>
                                <button className="w-10 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-100">
                                    <Calendar size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ITManagement;
