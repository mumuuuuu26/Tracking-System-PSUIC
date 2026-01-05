import React, { useEffect, useState } from 'react';
import useAuthStore from '../../../store/auth-store';
import { getAnnualStats } from '../../../api/report';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import dayjs from 'dayjs';

const AnnualReport = () => {
    const { token } = useAuthStore();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(dayjs().year());

    useEffect(() => {
        loadData();
    }, [year]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await getAnnualStats(token, year);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Annual Data");
        XLSX.writeFile(wb, `annual_report_${year}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <select value={year} onChange={e => setYear(e.target.value)} className="p-2 border rounded">
                    {[2024, 2025, 2026].map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
                <button onClick={exportExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                    <Download size={16} /> Export Excel
                </button>
            </div>

            {loading ? <p>Loading...</p> : (
                <div className="bg-white p-4 border rounded-lg h-96">
                    <h3 className="font-bold mb-4">Annual Trend</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Area type="monotone" dataKey="total" stroke="#8884d8" fill="#8884d8" name="Total Tickets" />
                            <Area type="monotone" dataKey="fixed" stroke="#82ca9d" fill="#82ca9d" name="Fixed" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default AnnualReport;
