import React, { useEffect, useState, useCallback } from 'react';
import { getAnnualStats } from '../../../api/report';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import ExportButtons from '../../../components/admin/ExportButtons';
import dayjs from 'dayjs';

const AnnualReport = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(dayjs().year());

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getAnnualStats(year);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [year]);

    useEffect(() => {
        loadData();
    }, [loadData]);


    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Annual Data");
        XLSX.writeFile(wb, `annual_report_${year}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                    <select value={year} onChange={e => setYear(e.target.value)} className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 cursor-pointer">
                        {Array.from({ length: (dayjs().year() + 10) - 2024 + 1 }, (_, i) => 2024 + i).map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? <p>Loading...</p> : (
                <>
                    <div id="annual-report-content" className="bg-white p-6 border rounded-2xl h-96 shadow-sm">
                        <h3 className="font-bold mb-6 text-xl text-gray-800">Annual Trend</h3>
                        <ResponsiveContainer width="100%" height="90%">
                            <AreaChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Area type="monotone" dataKey="total" stroke="#193C6C" fill="#193C6C" fillOpacity={0.1} name="Total Tickets" strokeWidth={3} />
                                <Area type="monotone" dataKey="fixed" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} name="Resolved" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <ExportButtons onExportExcel={exportExcel} />
                </>
            )}
        </div>
    );
};

export default AnnualReport;
