import React, { useEffect, useState } from 'react';
import useAuthStore from '../../../store/auth-store';
import { getMonthlyStats } from '../../../api/report';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import ExportButtons from '../../../components/admin/ExportButtons';
import { Download, Calendar, Ticket, CheckCircle, Clock } from 'lucide-react';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';

const MonthlyReport = ({ month, year }) => {
    const { token } = useAuthStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = React.useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await getMonthlyStats(token, month, year);
            setData(res.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Failed to load report data");
        } finally {
            setLoading(false);
        }
    }, [token, month, year]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const exportPDF = async () => {
        try {
            setLoading(true);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            let pageIndex = 1;
            let element = document.getElementById(`pdf-page-${pageIndex}`);

            while (element) {
                if (pageIndex > 1) {
                    pdf.addPage();
                }

                const canvas = await html2canvas(element, { scale: 3, useCORS: true });
                const imgData = canvas.toDataURL('image/png');

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

                pageIndex++;
                element = document.getElementById(`pdf-page-${pageIndex}`);
            }

            pdf.save(`monthly_report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error("PDF Export failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const exportExcel = () => {
        if (!data?.data) return;
        const ws = XLSX.utils.json_to_sheet(data.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Monthly Data");
        XLSX.writeFile(wb, `monthly_report_${month}_${year}.xlsx`);
    };

    // Safe accessors
    const reportData = Array.isArray(data?.data) ? data.data : [];
    const totalTickets = data?.total || 0;
    const resolvedTickets = data?.solved || 0;
    const pendingTickets = data?.pending || 0;

    return (
        <div className="space-y-6">

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>)}
                </div>
            ) : error ? (
                <div className="p-8 text-center bg-red-50 rounded-3xl border border-red-100">
                    <div className="text-red-500 text-xl font-bold mb-2">Error Loading Report</div>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={loadData}
                        className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            ) : data ? (
                <div id="monthly-report-content" className="space-y-6 p-4 bg-white rounded-3xl">
                    {/* Summary Cards */}
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 text-blue-900 rounded-lg">
                                    <Ticket size={24} />
                                </div>
                                <span className="font-semibold text-gray-700">Total Tickets</span>
                            </div>
                            <p className="text-4xl font-bold text-blue-900 mt-2">{totalTickets}</p>
                            <div className="absolute right-0 top-0 h-full w-1 bg-blue-900"></div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
                                    <CheckCircle size={24} />
                                </div>
                                <span className="font-semibold text-gray-700">Resolved</span>
                            </div>
                            <p className="text-4xl font-bold text-blue-700 mt-2">{resolvedTickets}</p>
                            <div className="absolute right-0 top-0 h-full w-1 bg-blue-700"></div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                    <Clock size={24} />
                                </div>
                                <span className="font-semibold text-gray-700">Pending</span>
                            </div>
                            <p className="text-4xl font-bold text-blue-500 mt-2">{pendingTickets}</p>
                            <div className="absolute right-0 top-0 h-full w-1 bg-blue-500"></div>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-xl text-gray-800">Daily Breakdown</h3>
                            <div className="flex gap-4 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-[#193C6C]"></span> Resolved
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-[#3B82F6]"></span> Pending
                                </div>
                            </div>
                        </div>
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={reportData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                                    <Bar dataKey="fixed" fill="#193C6C" radius={[4, 4, 0, 0]} barSize={20} name="Resolved" />
                                    <Bar dataKey="pending" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} name="Pending" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="min-h-[400px] flex flex-col items-center justify-center p-8 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
                        <Calendar size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No Reports Available</h3>
                    <p className="text-gray-500 text-center max-w-sm mt-1">
                        There is no ticket data for {dayjs(new Date(year, month - 1)).format('MMMM YYYY')}.
                        Try selecting a different month or year.
                    </p>
                </div>
            )}

            <ExportButtons onExportPDF={exportPDF} onExportExcel={exportExcel} />

            {/* Hidden PDF Export Content - PAGINATED */}
            {data && (
                <div className="absolute -left-[9999px] top-0 font-['Sarabun'] text-black">
                    {/* Page 1: Header, Summary, and First Batch */}
                    <div id="pdf-page-1" className="w-[210mm] h-[297mm] bg-white p-[20mm] relative flex flex-col justify-between">
                        <div>
                            {/* Header Section */}
                            <div className="relative mb-8">
                                {/* Logo Centered */}
                                <div className="flex justify-center mb-4">
                                    <img src="/img/psu_emblem.png" alt="PSU Emblem" className="h-24 w-auto object-contain grayscale" />
                                </div>

                                {/* Text Centered */}
                                <div className="text-center space-y-1">
                                    <h1 className="text-xl font-bold text-black uppercase">Prince of Songkla University</h1>
                                    <h2 className="text-lg font-medium text-black">International College</h2>
                                    <h3 className="text-2xl font-bold mt-4 text-black uppercase">Monthly Performance Report</h3>
                                    <p className="text-lg font-medium text-black">Academic Year {new Date().getFullYear()}</p>
                                </div>

                                {/* Document Info (Top Right) */}
                                <div className="absolute top-0 right-0 text-right text-xs text-black">
                                    <p>Doc ID: PSUIC-MTH-{new Date().getFullYear()}-01</p>
                                    <p>Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>

                            {/* Part 1: Executive Summary */}
                            <div className="mb-8">
                                <h4 className="text-lg font-bold mb-2 text-black">1. Executive Summary</h4>
                                <table className="w-full border-collapse border border-black text-sm text-black">
                                    <tbody>
                                        <tr>
                                            <td className="border border-black p-2 bg-gray-100 font-bold w-1/3 text-black">Total Tickets</td>
                                            <td className="border border-black p-2 text-center text-lg font-bold text-black">{reportData.reduce((acc, curr) => acc + (curr.total || 0), 0)} Items</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 bg-gray-100 font-bold text-black">Resolved</td>
                                            <td className="border border-black p-2 text-center font-bold text-black">{reportData.reduce((acc, curr) => acc + (curr.fixed || 0), 0)} Items</td>
                                        </tr>
                                        <tr>
                                            <td className="border border-black p-2 bg-gray-100 font-bold text-black">Pending</td>
                                            <td className="border border-black p-2 text-center font-bold text-black">{reportData.reduce((acc, curr) => acc + (curr.pending || 0), 0)} Items</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Part 2: Detailed Assessment (First Batch) */}
                            <div className="mb-6">
                                <h4 className="text-lg font-bold mb-2 text-black">2. Daily Breakdown</h4>
                                <table className="w-full border-collapse border border-black text-sm text-black">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border border-black p-2 text-center w-24 text-black">Date</th>
                                            <th className="border border-black p-2 text-center text-black">Total</th>
                                            <th className="border border-black p-2 text-center text-black">Resolved</th>
                                            <th className="border border-black p-2 text-center text-black">Pending</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Reduced to 10 items to prevent page cut-off */}
                                        {reportData.slice(0, 10).map((item, index) => (
                                            <tr key={index}>
                                                <td className="border border-black p-2 text-center font-bold text-black">{item.day}</td>
                                                <td className="border border-black p-2 text-center font-medium text-black">{(item.fixed || 0) + (item.pending || 0)}</td>
                                                <td className="border border-black p-2 text-center font-medium text-black">{item.fixed}</td>
                                                <td className="border border-black p-2 text-center font-medium text-black">{item.pending}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="text-right text-sm text-black">Page 1</div>
                    </div>

                    {/* Subsequent Pages */}
                    {reportData.length > 10 && Array.from({ length: Math.ceil(Math.max(reportData.length - 10, 0) / 20) }).map((_, pageIndex) => (
                        <div key={pageIndex} id={`pdf-page-${pageIndex + 2}`} className="w-[210mm] h-[297mm] bg-white p-[20mm] relative flex flex-col justify-between mt-10">
                            <div>
                                {/* Header Continuation */}
                                <div className="flex justify-between items-center border-b border-black pb-2 mb-6">
                                    <span className="font-bold text-black">Daily Breakdown (Continued)</span>
                                    <span className="text-sm text-black">{new Date().toLocaleDateString('en-GB')}</span>
                                </div>

                                <table className="w-full border-collapse border border-black text-sm text-black">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="border border-black p-2 text-center w-24 text-black">Date</th>
                                            <th className="border border-black p-2 text-center text-black">Total</th>
                                            <th className="border border-black p-2 text-center text-black">Resolved</th>
                                            <th className="border border-black p-2 text-center text-black">Pending</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.slice(10 + (pageIndex * 20), 10 + ((pageIndex + 1) * 20)).map((item, index) => (
                                            <tr key={index}>
                                                <td className="border border-black p-2 text-center font-bold text-black">{item.day}</td>
                                                <td className="border border-black p-2 text-center font-medium text-black">{(item.fixed || 0) + (item.pending || 0)}</td>
                                                <td className="border border-black p-2 text-center font-medium text-black">{item.fixed}</td>
                                                <td className="border border-black p-2 text-center font-medium text-black">{item.pending}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Signature Area on Last Page */}
                            {pageIndex === Math.ceil(Math.max(reportData.length - 10, 0) / 20) - 1 && (
                                <div className="mt-8 flex justify-end">
                                    <div className="text-center w-64">
                                        <div className="border-b border-black mb-2 h-8"></div>
                                        <p className="text-sm font-bold text-black">Authorized Signature</p>
                                        <p className="text-xs text-black">Admin / Manager</p>
                                    </div>
                                </div>
                            )}

                            <div className="text-right text-sm text-black">
                                Page {pageIndex + 2}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MonthlyReport;
