import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../../../store/auth-store';
import { getAnnualStats } from '../../../api/report';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import ExportButtons from '../../../components/admin/ExportButtons';
import dayjs from 'dayjs';
import html2canvas from 'html2canvas';

const AnnualReport = () => {
    const { token } = useAuthStore();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(dayjs().year());

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getAnnualStats(token, year);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token, year]);

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

            pdf.save(`annual_report_${year}.pdf`);
        } catch (err) {
            console.error("PDF Export failed:", err);
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
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                    <select value={year} onChange={e => setYear(e.target.value)} className="bg-transparent border-none text-sm font-semibold text-gray-700 focus:ring-0 cursor-pointer">
                        {[2024, 2025, 2026].map(y => (
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

                    <ExportButtons onExportPDF={exportPDF} onExportExcel={exportExcel} />

                    {/* Hidden PDF Export Content - PAGINATED */}
                    <div className="absolute -left-[9999px] top-0 font-['Sarabun'] text-black">
                        {/* Page 1: Header, Summary, and All Data (12 months fit easily) */}
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
                                        <h3 className="text-2xl font-bold mt-4 text-black uppercase">Annual Performance Report</h3>
                                        <p className="text-lg font-medium text-black">Academic Year {year}</p>
                                    </div>

                                    {/* Document Info (Top Right) */}
                                    <div className="absolute top-0 right-0 text-right text-xs text-black">
                                        <p>Doc ID: PSUIC-ANN-{year}-01</p>
                                        <p>Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>

                                {/* Part 1: Executive Summary */}
                                <div className="mb-8">
                                    <h4 className="text-lg font-bold mb-2 text-black">1. Yearly Summary</h4>
                                    <table className="w-full border-collapse border border-black text-sm text-black">
                                        <tbody>
                                            <tr>
                                                <td className="border border-black p-2 bg-gray-100 font-bold w-1/3 text-black">Total Tickets</td>
                                                <td className="border border-black p-2 text-center text-lg font-bold text-black">{data.reduce((acc, curr) => acc + curr.total, 0)} Items</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-black p-2 bg-gray-100 font-bold text-black">Resolved</td>
                                                <td className="border border-black p-2 text-center font-bold text-black">{data.reduce((acc, curr) => acc + curr.fixed, 0)} Items</td>
                                            </tr>
                                            <tr>
                                                <td className="border border-black p-2 bg-gray-100 font-bold text-black">Resolution Rate</td>
                                                <td className="border border-black p-2 text-center font-bold text-black">
                                                    {data.reduce((acc, curr) => acc + curr.total, 0) > 0
                                                        ? Math.round((data.reduce((acc, curr) => acc + curr.fixed, 0) / data.reduce((acc, curr) => acc + curr.total, 0)) * 100)
                                                        : 0}%
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Part 2: Detailed Assessment (Monthly Breakdown) */}
                                <div className="mb-6">
                                    <h4 className="text-lg font-bold mb-2 text-black">2. Monthly Breakdown</h4>
                                    <table className="w-full border-collapse border border-black text-sm text-black">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border border-black p-2 text-center font-bold w-16 text-black">Month</th>
                                                <th className="border border-black p-2 text-center font-bold text-black">Total Tickets</th>
                                                <th className="border border-black p-2 text-center font-bold text-black">Resolved</th>
                                                <th className="border border-black p-2 text-center font-bold text-black">Resolution Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="border border-black p-2 text-center font-bold text-black">{item.name}</td>
                                                    <td className="border border-black p-2 text-center font-medium text-black">{item.total}</td>
                                                    <td className="border border-black p-2 text-center text-black font-medium">{item.fixed}</td>
                                                    <td className="border border-black p-2 text-center font-bold text-black">
                                                        {item.total > 0 ? Math.round((item.fixed / item.total) * 100) : 0}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Signature Area */}
                            <div className="mt-8 flex justify-end">
                                <div className="text-center w-64">
                                    <div className="border-b border-black mb-2 h-8"></div>
                                    <p className="text-sm font-bold text-black">Authorized Signature</p>
                                    <p className="text-xs text-black">Admin / Manager</p>
                                </div>
                            </div>

                            <div className="text-right text-sm text-black">Page 1</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default AnnualReport;
