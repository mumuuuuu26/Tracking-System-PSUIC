import React, { useEffect, useState } from 'react';
import useAuthStore from '../../../store/auth-store';
import { getEquipmentStats } from '../../../api/report';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const EquipmentAnalysis = () => {
    const { token } = useAuthStore();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await getEquipmentStats(token);
            // res.data is array of { amount, name, room }
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold">Top Problematic Equipment</h2>

            {loading ? <p>Loading...</p> : (
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Chart */}
                    <div className="bg-white p-4 border rounded-lg h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="amount"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Table */}
                    <div className="bg-white border rounded-lg overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-bold">
                                <tr>
                                    <th className="p-3">Rank</th>
                                    <th className="p-3">Equipment</th>
                                    <th className="p-3">Room</th>
                                    <th className="p-3 text-right">Issues</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, index) => (
                                    <tr key={index} className="border-t hover:bg-gray-50">
                                        <td className="p-3 font-bold text-gray-500">#{index + 1}</td>
                                        <td className="p-3 font-medium">{item.name}</td>
                                        <td className="p-3 text-gray-500">{item.room}</td>
                                        <td className="p-3 text-right font-bold text-red-500">{item.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentAnalysis;
