import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../../../store/auth-store';
import { getEquipmentStats } from '../../../api/report';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import ExportButtons from '../../../components/admin/ExportButtons';
import html2canvas from 'html2canvas';

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

            pdf.save(`equipment_analysis_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error("PDF Export failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Equipment Data");
        XLSX.writeFile(wb, `equipment_analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-bold">Top Problematic Equipment</h2>

            {loading ? <div className="h-64 flex items-center justify-center bg-gray-50 rounded-2xl animate-pulse">Loading...</div> : error ? (
                <div className="p-8 text-center bg-red-50 rounded-3xl border border-red-100">
                    <p className="text-red-500 font-bold">{error}</p>
                    <button onClick={loadData} className="mt-4 px-4 py-2 bg-white text-red-600 rounded-lg shadow-sm">Try Again</button>
                </div>
            ) : data.length > 0 ? (
                <>
                    <div id="equipment-analysis-content" className="grid md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl">
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

                    <ExportButtons onExportPDF={exportPDF} onExportExcel={exportExcel} />

                    {/* Hidden PDF Export Content - PAGINATED */}
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
                                        <h3 className="text-2xl font-bold mt-4 text-black uppercase">Equipment Analysis Report</h3>
                                        <p className="text-lg font-medium text-black">Academic Year {new Date().getFullYear()}</p>
                                    </div>

                                    {/* Document Info (Top Right) */}
                                    <div className="absolute top-0 right-0 text-right text-xs text-black">
                                        <p>Doc ID: PSUIC-EQA-{new Date().getFullYear()}-01</p>
                                        <p>Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>

                                {/* Report Content */}
                                <div className="mb-6">
                                    <h4 className="text-lg font-bold mb-2 text-black">1. Top Problematic Equipment</h4>
                                    <table className="w-full border-collapse border border-black text-sm text-black">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border border-black p-2 text-center font-bold w-16 text-black">Rank</th>
                                                <th className="border border-black p-2 text-left font-bold text-black">Equipment Name</th>
                                                <th className="border border-black p-2 text-left font-bold text-black">Room/Location</th>
                                                <th className="border border-black p-2 text-center font-bold text-black">Issue Count</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Slice first 10 items */}
                                            {data.slice(0, 10).map((item, index) => (
                                                <tr key={index}>
                                                    <td className="border border-black p-2 text-center font-bold text-black">{index + 1}</td>
                                                    <td className="border border-black p-2 font-medium text-black">{item.name}</td>
                                                    <td className="border border-black p-2 text-black">{item.room}</td>
                                                    <td className="border border-black p-2 text-center font-bold text-black">{item.amount} Times</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="text-right text-sm text-black">Page 1</div>
                        </div>

                        {/* Subsequent Pages (20 items per page) */}
                        {Array.from({ length: Math.ceil(Math.max(data.length - 10, 0) / 20) }).map((_, pageIndex) => (
                            <div key={pageIndex} id={`pdf-page-${pageIndex + 2}`} className="w-[210mm] h-[297mm] bg-white p-[20mm] relative flex flex-col justify-between mt-10">
                                <div>
                                    {/* Header Repeat */}
                                    <div className="flex justify-between items-center border-b border-black pb-2 mb-6">
                                        <span className="font-bold text-black">Top Problematic Equipment (Continued)</span>
                                        <span className="text-sm text-black">{new Date().toLocaleDateString('en-GB')}</span>
                                    </div>

                                    <table className="w-full border-collapse border border-black text-sm text-black">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border border-black p-2 text-center font-bold w-16 text-black">Rank</th>
                                                <th className="border border-black p-2 text-left font-bold text-black">Equipment Name</th>
                                                <th className="border border-black p-2 text-left font-bold text-black">Room/Location</th>
                                                <th className="border border-black p-2 text-center font-bold text-black">Issue Count</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.slice(10 + (pageIndex * 20), 10 + ((pageIndex + 1) * 20)).map((item, index) => (
                                                <tr key={index}>
                                                    <td className="border border-black p-2 text-center font-bold text-black">{10 + index + (pageIndex * 20) + 1}</td>
                                                    <td className="border border-black p-2 font-medium text-black">{item.name}</td>
                                                    <td className="border border-black p-2 text-black">{item.room}</td>
                                                    <td className="border border-black p-2 text-center font-bold text-black">{item.amount} Times</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Signature Area on Last Page */}
                                {pageIndex === Math.ceil(Math.max(data.length - 10, 0) / 20) - 1 && (
                                    <div className="mt-8 flex justify-end">
                                        <div className="text-center w-64">
                                            <div className="border-b border-black mb-2 h-8"></div>
                                            <p className="text-sm font-bold text-black">Authorized Signature</p>
                                            <p className="text-xs text-black">Admin / Manager</p>
                                        </div>
                                    </div>
                                )}

                                <div className="text-right text-sm text-black">Page {pageIndex + 2}</div>
                            </div>
                        ))}
                    </div>
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
