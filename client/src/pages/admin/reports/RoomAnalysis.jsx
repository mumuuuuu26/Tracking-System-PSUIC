import React, { useEffect, useState, useCallback } from 'react';
import { getRoomStats } from '../../../api/report';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RoomAnalysis = ({ month, year, externalData, externalLoading }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        if (externalData !== undefined) return; // skip fetch if parent provides data
        try {
            setLoading(true);
            setError(null);
            const res = await getRoomStats(month, year);
            setData(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Failed to load room data");
        } finally {
            setLoading(false);
        }
    }, [month, year, externalData]);

    // Sync external data
    useEffect(() => {
        if (externalData !== undefined) {
            setData(externalData);
            setLoading(false);
            setError(null);
        }
    }, [externalData]);

    useEffect(() => {
        if (externalLoading !== undefined) setLoading(externalLoading);
    }, [externalLoading]);

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
        <div className="space-y-3">
            <h2 className="text-base font-bold text-gray-900">Floor & Room Analysis</h2>

            {loading ? (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl animate-pulse">Loading...</div>
            ) : error ? (
                <div className="p-8 text-center bg-red-50 rounded-3xl border border-red-100">
                    <p className="text-red-500 font-bold">{error}</p>
                    <button onClick={loadData} className="mt-4 px-4 py-2 bg-white text-red-600 rounded-lg shadow-sm">Try Again</button>
                </div>
            ) : data.length > 0 ? (
                <div id="room-analysis-report">
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        {/* Floor-wise Tickets */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Tickets by Floor</h3>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={floorData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                                        <Bar dataKey="completed" name="Resolved" fill="#10B981" radius={[4, 4, 0, 0]} barSize={24} />
                                        <Bar dataKey="pending" name="Pending" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Room Density */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Top 5 High-Incident Rooms</h3>
                            <div className="space-y-2">
                                {data.slice(0, 5).map((room, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="px-2.5 py-1.5 rounded bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] min-w-[70px] whitespace-nowrap">
                                                {room.roomNumber}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Location</span>
                                                <span className="text-xs text-gray-700 font-bold">Floor {room.floor}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-base font-black text-primary leading-none">{room.totalTickets}</div>
                                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-0.5">Issues</div>
                                            </div>
                                            <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner hidden sm:block">
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
                    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
                        <div className="overflow-y-auto max-h-56 scrollbar-hide">
                            <table className="w-full text-[11px] text-left">
                                <thead className="bg-gray-50 text-gray-700 font-bold sticky top-0 z-10">
                                    <tr>
                                        <th className="p-2.5">Room</th>
                                        <th className="p-2.5">Floor</th>
                                        <th className="p-2.5 text-center">Total Issues</th>
                                        <th className="p-2.5 text-center">Resolved</th>
                                        <th className="p-2.5 text-center">Pending</th>
                                        <th className="p-2.5 pr-4 text-right">Rate</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                                            <td className="p-2 px-2.5 font-bold text-gray-900">{item.roomNumber}</td>
                                            <td className="p-2 px-2.5 text-gray-500">Floor {item.floor}</td>
                                            <td className="p-2 text-center font-bold">{item.totalTickets}</td>
                                            <td className="p-2 text-center text-emerald-600 font-medium">{item.completed}</td>
                                            <td className="p-2 text-center text-amber-600 font-medium">{item.pending}</td>
                                            <td className="p-2 pr-4 text-right font-bold text-primary">
                                                {item.totalTickets > 0 ? Math.round((item.completed / item.totalTickets) * 100) : 0}%
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
