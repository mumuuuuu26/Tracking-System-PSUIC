import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../../../store/auth-store';
import { getEquipmentStats } from '../../../api/report';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import * as XLSX from 'xlsx';
import ExportButtons from '../../../components/admin/ExportButtons';

const EquipmentAnalysis = () => {
    const { token } = useAuthStore();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getEquipmentStats(token);
            // res.data is array of { amount, name, room }
            setData(res.data || []);
        } catch (err) {
            console.error(err);
            setError("Failed to load equipment data");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const COLORS = ['#193C6C', '#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD']; // Monochromatic Blue Scale


    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Equipment Data");
        XLSX.writeFile(wb, `equipment_analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-4">
            <h2 className="text-base font-bold">Top Problematic Equipment</h2>

            {loading ? <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl animate-pulse">Loading...</div> : error ? (
                <div className="p-8 text-center bg-red-50 rounded-3xl border border-red-100">
                    <p className="text-red-500 font-bold">{error}</p>
                    <button onClick={loadData} className="mt-4 px-4 py-2 bg-white text-red-600 rounded-lg shadow-sm">Try Again</button>
                </div>
            ) : data.length > 0 ? (
                <>
                    <div id="equipment-analysis-content" className="grid md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl">
                        {/* Chart */}
                        <div className="bg-white p-2 border rounded-xl h-64 flex flex-col justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                        outerRadius={65}
                                        innerRadius={40}
                                        paddingAngle={5}
                                        fill="#8884d8"
                                        dataKey="amount"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        wrapperStyle={{ fontSize: '10px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Table */}
                        <div className="bg-white border rounded-xl overflow-hidden flex flex-col h-64">
                            <div className="overflow-y-auto flex-1 scrollbar-hide">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-gray-50 text-gray-700 font-bold sticky top-0 z-10">
                                        <tr>
                                            <th className="p-2 pl-3">Rank</th>
                                            <th className="p-2">Equipment</th>
                                            <th className="p-2">Room</th>
                                            <th className="p-2 pr-3 text-right">Issues</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-2 pl-3 font-bold text-gray-400">#{index + 1}</td>
                                                <td className="p-2 font-medium text-gray-700 truncate max-w-[120px]" title={item.name}>{item.name}</td>
                                                <td className="p-2 text-gray-500">{item.room}</td>
                                                <td className="p-2 pr-3 text-right font-bold text-red-500">{item.amount}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <ExportButtons onExportExcel={exportExcel} />
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
