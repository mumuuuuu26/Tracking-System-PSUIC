import React, { useEffect, useState, useCallback } from 'react';
import { getEquipmentStats } from '../../../api/report';
import { Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts';

const EquipmentAnalysis = ({ month, year, externalData, externalSubData, externalLoading }) => {
    const [data, setData] = useState([]);
    const [subData, setSubData] = useState([]); // [NEW]
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        if (externalData !== undefined) return; // skip fetch if parent provides data
        try {
            setLoading(true);
            setError(null);
            const res = await getEquipmentStats(month, year);
            setData(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Failed to load equipment data");
        } finally {
            setLoading(false);
        }
    }, [month, year, externalData]);

    // Sync external data from parent
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

    // Standalone mode: fetch data ourselves when month/year changes and no parent provides data
    useEffect(() => {
        if (externalData === undefined) {
            loadData();
        }
    }, [loadData, externalData]);

    useEffect(() => {
        if (externalSubData !== undefined) {
            setSubData(externalSubData);
        }
    }, [externalSubData]);

    const COLORS = ['#193C6C', '#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'];
    const PIE_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16', '#22C55E'];

    return (
        <div className="space-y-6">
            <h2 className="text-base font-bold text-gray-900">Equipment & Components Analysis</h2>

            {loading ? <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl animate-pulse">Loading...</div> : error ? (
                <div className="p-8 text-center bg-red-50 rounded-3xl border border-red-100">
                    <p className="text-red-500 font-bold">{error}</p>
                    <button onClick={loadData} className="mt-4 px-4 py-2 bg-white text-red-600 rounded-lg shadow-sm">Try Again</button>
                </div>
            ) : data.length > 0 ? (
                <>
                    <div id="equipment-analysis-content" className="grid md:grid-cols-2 gap-4">
                        {/* Chart */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col min-h-[350px]">
                            <h3 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider w-full text-left">Top Problematic Workstations</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fontSize: 10, fill: '#6B7280' }}
                                        angle={-35}
                                        textAnchor="end"
                                        interval={0}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fontSize: 10, fill: '#6B7280' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                        formatter={(value) => [value, 'Issues']}
                                    />
                                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Table */}
                        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
                            <div className="p-2.5 border-b border-gray-100 bg-gray-50">
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Analysis Details</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-[11px] text-left">
                                    <thead className="bg-gray-50 text-gray-700 font-bold">
                                        <tr>
                                            <th className="p-2.5 pl-4">Rank</th>
                                            <th className="p-2.5">Equipment</th>
                                            <th className="p-2.5">Room</th>
                                            <th className="p-2.5 pr-4 text-right">Issues</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-2.5 pl-4 font-bold text-gray-400">#{index + 1}</td>
                                                <td className="p-2.5 font-medium text-gray-900">{item.name}</td>
                                                <td className="p-2.5 text-gray-500">{item.room}</td>
                                                <td className="p-2.5 pr-4 text-right font-bold text-primary">{item.amount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>


                    {/* [NEW] SubComponent Analysis */}
                    {subData && subData.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-base font-bold text-gray-900 mb-4">Top Replaced Parts</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Pie Chart */}
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col min-h-[350px] items-center justify-center">
                                    <h3 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider w-full text-left">Replacement Distribution</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={subData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={2}
                                                dataKey="amount"
                                            >
                                                {subData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                                formatter={(value) => [value, 'Replacements']}
                                            />
                                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Table */}
                                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden flex flex-col">
                                    <div className="p-2.5 border-b border-gray-100 bg-gray-50">
                                        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Parts Details</h3>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-[11px] text-left">
                                            <thead className="bg-gray-50 text-gray-700 font-bold">
                                                <tr>
                                                    <th className="p-2.5 pl-4">Rank</th>
                                                    <th className="p-2.5">Part Name</th>
                                                    <th className="p-2.5 pr-4 text-right">Replacements</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {subData.map((item, index) => (
                                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                        <td className="p-2.5 pl-4 font-bold text-gray-400">#{index + 1}</td>
                                                        <td className="p-2.5 font-medium text-gray-900">{item.name}</td>
                                                        <td className="p-2.5 pr-4 text-right font-bold text-orange-500">{item.amount}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="p-12 text-center bg-gray-50 rounded-3xl border border-gray-100">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">📉</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Equipment Data Found</h3>
                    <p className="text-gray-500">There are no equipment-related tickets to analyze.</p>
                </div>
            )}
        </div>
    );
};

export default EquipmentAnalysis;
