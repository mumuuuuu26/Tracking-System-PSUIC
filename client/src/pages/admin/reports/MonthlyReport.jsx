import React, { useEffect, useState } from 'react';
import useAuthStore from '../../../store/auth-store';
import { getMonthlyStats } from '../../../api/report';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Download, Calendar, Ticket, CheckCircle, Clock, FileText } from 'lucide-react';
import dayjs from 'dayjs';

const MonthlyReport = () => {
    const { token } = useAuthStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(dayjs().month() + 1); // 1-12
    const [year, setYear] = useState(dayjs().year());

    useEffect(() => {
        loadData();
    }, [month, year]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await getMonthlyStats(token, month, year);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.text(`Monthly Report: ${month}/${year}`, 14, 15);

        doc.text(`Total: ${data.total}`, 14, 25);
        doc.text(`Solved: ${data.solved}`, 60, 25);
        doc.text(`Pending: ${data.pending}`, 100, 25);

        const tableColumn = ["Day", "Total", "Fixed", "Pending"];
        const tableRows = [];

        data.data.forEach(item => {
            const rowData = [item.day, item.total, item.fixed, item.pending];
            tableRows.push(rowData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 35,
        });

        doc.save(`monthly_report_${month}_${year}.pdf`);
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Monthly Data");
        XLSX.writeFile(wb, `monthly_report_${month}_${year}.xlsx`);
    };

    return (
        <div className="space-y-6">
            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100 gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                        <Calendar size={18} className="text-gray-400" />
                        <select
                            value={month}
                            onChange={e => setMonth(e.target.value)}
                            className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 cursor-pointer"
                        >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m}>Month {m}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                        <select
                            value={year}
                            onChange={e => setYear(e.target.value)}
                            className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 cursor-pointer"
                        >
                            {[2024, 2025, 2026].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={exportPDF} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors border border-red-100">
                        <FileText size={16} /> PDF
                    </button>
                    <button onClick={exportExcel} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-50 text-green-600 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-green-100 transition-colors border border-green-100">
                        <Download size={16} /> Excel
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>)}
                </div>
            ) : data && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-200 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2 opacity-90">
                                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                        <Ticket size={20} />
                                    </div>
                                    <span className="font-semibold">Total Tickets</span>
                                </div>
                                <p className="text-4xl font-bold tracking-tight">{data.total}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-green-50 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-green-100 transition-colors"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                        <CheckCircle size={20} />
                                    </div>
                                    <span className="font-semibold text-gray-600">Resolved</span>
                                </div>
                                <p className="text-4xl font-bold text-gray-800">{data.solved}</p>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            <div className="absolute right-0 top-0 w-24 h-24 bg-orange-50 rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none group-hover:bg-orange-100 transition-colors"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                        <Clock size={20} />
                                    </div>
                                    <span className="font-semibold text-gray-600">Pending</span>
                                </div>
                                <p className="text-4xl font-bold text-gray-800">{data.pending}</p>
                            </div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-xl text-gray-800">Daily Breakdown</h3>
                            <div className="flex gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Fixed
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-amber-500"></span> Pending
                                </div>
                            </div>
                        </div>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="day"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    />
                                    <Bar dataKey="fixed" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="pending" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default MonthlyReport;
