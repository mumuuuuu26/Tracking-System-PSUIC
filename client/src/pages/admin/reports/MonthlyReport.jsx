import React, { useEffect, useState } from 'react';
import useAuthStore from '../../../store/auth-store';
import { getMonthlyStats } from '../../../api/report';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
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
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div className="flex gap-4">
                    <select value={month} onChange={e => setMonth(e.target.value)} className="p-2 border rounded">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>Month {m}</option>
                        ))}
                    </select>
                    <select value={year} onChange={e => setYear(e.target.value)} className="p-2 border rounded">
                        {[2024, 2025, 2026].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportPDF} className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                        <Download size={16} /> PDF
                    </button>
                    <button onClick={exportExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        <Download size={16} /> Excel
                    </button>
                </div>
            </div>

            {loading ? <p>Loading...</p> : data && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <h3 className="text-blue-600 font-bold text-lg">Total Tickets</h3>
                            <p className="text-3xl font-bold">{data.total}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                            <h3 className="text-green-600 font-bold text-lg">Fixed</h3>
                            <p className="text-3xl font-bold">{data.solved}</p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg text-center">
                            <h3 className="text-orange-600 font-bold text-lg">Pending</h3>
                            <p className="text-3xl font-bold">{data.pending}</p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white p-4 border rounded-lg h-96">
                        <h3 className="font-bold mb-4">Daily Breakdown</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.data}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="day" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="fixed" fill="#10B981" name="Fixed" />
                                <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </>
            )}
        </div>
    );
};

export default MonthlyReport;
