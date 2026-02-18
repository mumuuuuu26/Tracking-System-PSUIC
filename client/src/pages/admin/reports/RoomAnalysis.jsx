import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../../../store/auth-store';
import { getRoomStats } from '../../../api/report';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import ExportButtons from '../../../components/admin/ExportButtons';

const RoomAnalysis = () => {
    const { token } = useAuthStore();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getRoomStats(token);
            setData(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Failed to load room data");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Room Data");
        XLSX.writeFile(wb, `room_analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Calculate aggregated data for charts
    const floorData = data.reduce((acc, item) => {
        const floor = item.floor;
        const existing = acc.find(f => f.name === `Floor ${floor}`);
        if (existing) {
            existing.total += item.totalTickets;
            existing.completed += item.completed;
            existing.pending += item.pending;
        } else {
            acc.push({ name: `Floor ${floor}`, total: item.totalTickets, completed: item.completed, pending: item.pending });
        }
        return acc;
    }, []).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="space-y-4">
            <h2 className="text-base font-bold">Floor & Room Analysis</h2>

            {loading ? (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl animate-pulse">Loading...</div>
            ) : error ? (
                <div className="p-8 text-center bg-red-50 rounded-3xl border border-red-100">
                    <p className="text-red-500 font-bold">{error}</p>
                    <button onClick={loadData} className="mt-4 px-4 py-2 bg-white text-red-600 rounded-lg shadow-sm">Try Again</button>
                </div>
            ) : data.length > 0 ? (
                <div id="room-analysis-report">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                        {/* Floor-wise Tickets */}
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Tickets by Floor</h3>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={floorData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend iconType="circle" />
                                        <Bar dataKey="completed" name="Resolved" fill="#10B981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Room Density */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wider">Top 5 High-Incident Rooms</h3>
                            <div className="space-y-4">
                                {data.slice(0, 5).map((room, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs min-w-[80px] whitespace-nowrap">
                                                {room.roomNumber}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Location</span>
                                                <span className="text-sm text-gray-700 font-bold">Floor {room.floor}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <div className="text-lg font-black text-primary leading-none">{room.totalTickets}</div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter mt-1">Total Issues</div>
                                            </div>
                                            <div className="w-32 h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner hidden sm:block">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(25,60,108,0.2)]"
                                                    style={{ width: `${(room.totalTickets / data[0].totalTickets) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Detailed Table */}
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm max-h-64 flex flex-col">
                        <div className="overflow-y-auto flex-1 scrollbar-hide">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-gray-50 text-gray-700 font-bold sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3">Room</th>
                                        <th className="p-3">Floor</th>
                                        <th className="p-3 text-center">Total Issues</th>
                                        <th className="p-3 text-center">Resolved</th>
                                        <th className="p-3 text-center">Pending</th>
                                        <th className="p-3 pr-4 text-right">Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-3 font-bold text-gray-900">{item.roomNumber}</td>
                                            <td className="p-3 text-gray-500">Floor {item.floor}</td>
                                            <td className="p-3 text-center font-bold">{item.totalTickets}</td>
                                            <td className="p-3 text-center text-emerald-600 font-medium">{item.completed}</td>
                                            <td className="p-3 text-center text-amber-600 font-medium">{item.pending}</td>
                                            <td className="p-3 pr-4 text-right font-bold text-primary">
                                                {item.totalTickets > 0 ? Math.round((item.completed / item.totalTickets) * 100) : 0}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-6">
                        <ExportButtons onExportExcel={exportExcel} />
                    </div>
                </div>
            ) : (
                <div className="p-12 text-center bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🏢</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Room Data Found</h3>
                    <p className="text-gray-500">There are no room-related tickets to analyze yet.</p>
                </div>
            )}
        </div>
    );
};

export default RoomAnalysis;
