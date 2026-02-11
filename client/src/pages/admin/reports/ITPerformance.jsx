import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../../../store/auth-store';
import { getITPerformance } from '../../../api/report';
import { Star, CheckCircle, Clock, Trophy, Medal, Award } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import ExportButtons from '../../../components/admin/ExportButtons';

const ITPerformance = () => {
    const { token } = useAuthStore();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getITPerformance(token);
            // Sort by total resolved desc, then rating desc
            const sorted = res.data.sort((a, b) => b.totalResolved - a.totalResolved || b.avgRating - a.avgRating);
            setData(sorted);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getRankIcon = (index) => {
        if (index === 0) return <Trophy className="text-blue-600 fill-blue-600" size={24} />;
        if (index === 1) return <Medal className="text-gray-400 fill-gray-400" size={24} />;
        if (index === 2) return <Medal className="text-slate-500 fill-slate-500" size={24} />;
        return <span className="text-lg font-bold text-gray-400 w-6 text-center">{index + 1}</span>;
    };

    const getRankStyle = (index) => {
        if (index === 0) return "bg-blue-50 border-blue-200 shadow-md";
        if (index === 1) return "bg-gray-50 border-gray-200";
        if (index === 2) return "bg-slate-50 border-slate-200";
        return "bg-white border-gray-100";
    };

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

            pdf.save(`it_performance_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            console.error("PDF Export failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const exportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(data.map((it, index) => ({
            Rank: index + 1,
            Name: it.name || it.email,
            TotalResolved: it.totalResolved,
            ActiveJobs: it.pendingJobs,
            AvgResponseTime: `${it.avgResponseTime || 0} min`,
            AvgResolutionTime: `${it.avgResolutionTime || 0} min`,
            Rating: it.avgRating,
            ReviewCount: it.totalRated
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "IT Performance");
        XLSX.writeFile(wb, `it_performance_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-gray-800">IT Staff Performance Ranking</h2>
                <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    Real-time performance data
                </span>
            </div>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse"></div>)}
                </div>
            ) : (
                <>
                    <div id="it-performance-report">
                        {/* Team Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                            {/* Total Resolved - Deepest Blue */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="p-1.5 bg-blue-50 text-blue-900 rounded-lg">
                                        <CheckCircle size={20} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Total Resolved</p>
                                </div>
                                <p className="text-2xl font-extrabold text-blue-900">
                                    {data.reduce((acc, curr) => acc + (curr.totalResolved || 0), 0)}
                                </p>
                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-900"></div>
                            </div>

                            {/* Active Jobs - Corporate Blue */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
                                        <Clock size={20} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Active Jobs</p>
                                </div>
                                <p className="text-2xl font-extrabold text-blue-700">
                                    {data.reduce((acc, curr) => acc + (curr.pendingJobs || 0), 0)}
                                </p>
                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-700"></div>
                            </div>

                            {/* Avg Response - Medium Blue */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                        <Clock size={20} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Avg Response</p>
                                </div>
                                <p className="text-2xl font-extrabold text-blue-600">
                                    {(data.reduce((acc, curr) => acc + Number(curr.avgResponseTime || 0), 0) / (data.filter(d => Number(d.avgResponseTime) > 0).length || 1)).toFixed(0)} <span className="text-xs font-normal text-gray-400">min</span>
                                </p>
                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
                            </div>

                            {/* Avg Resolution - Lighter Blue */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
                                        <Clock size={20} />
                                    </div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Avg Resolution</p>
                                </div>
                                <p className="text-2xl font-extrabold text-blue-500">
                                    {(data.reduce((acc, curr) => acc + Number(curr.avgResolutionTime || 0), 0) / (data.filter(d => Number(d.avgResolutionTime) > 0).length || 1)).toFixed(0)} <span className="text-xs font-normal text-gray-400">min</span>
                                </p>
                                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                            </div>
                        </div>

                        {/* List Content */}
                        <div id="it-performance-content" className="space-y-3 bg-white p-4 rounded-xl">
                            {data.map((it, index) => (
                                <div
                                    key={it.id}
                                    className={`p-3 md:p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between transition-all hover:shadow-md hover:-translate-y-0.5 ${getRankStyle(index)}`}
                                >
                                    <div className="flex items-center gap-4 w-full md:w-auto mb-2 md:mb-0">
                                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                                            {getRankIcon(index)}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full p-0.5 bg-white shadow-sm border border-gray-100">
                                                <img
                                                    src={it.picture || `https://ui-avatars.com/api/?name=${it.name || 'IT'}&background=random`}
                                                    alt={it.name}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-gray-800">{it.name || it.email}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${(it.avgRating || 0) >= 80 ? 'bg-blue-100 text-blue-800' :
                                                        (it.avgRating || 0) >= 60 ? 'bg-blue-50 text-blue-600' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        Score: {Number(it.avgRating || 0).toFixed(1)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        ({it.totalRated || 0} reviews)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-end px-2 md:px-0">
                                        <div className="text-center md:text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 flex items-center justify-end gap-1">
                                                <CheckCircle size={12} className="text-blue-600" />
                                                Resolved
                                            </p>
                                            <p className="font-extrabold text-lg text-gray-800">{it.totalResolved || 0}</p>
                                        </div>
                                        <div className="text-center md:text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 flex items-center justify-end gap-1">
                                                <Clock size={12} className="text-blue-400" />
                                                Active
                                            </p>
                                            <p className="font-extrabold text-lg text-gray-800">{it.pendingJobs || 0}</p>
                                        </div>
                                        <div className="text-center md:text-right pl-3 border-l border-gray-100 flex flex-col gap-1">
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                    Avg Response
                                                </p>
                                                <p className="font-bold text-sm text-blue-800">
                                                    {it.avgResponseTime || 0} m
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                                                    Avg Resol.
                                                </p>
                                                <p className="font-bold text-sm text-blue-600">
                                                    {it.avgResolutionTime || 0} m
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {data.length === 0 && (
                                <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 font-medium text-sm">No performance data available yet.</p>
                                </div>
                            )}
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
                                        <h3 className="text-2xl font-bold mt-4 text-black uppercase">IT Staff Performance Report</h3>
                                        <p className="text-lg font-medium text-black">Academic Year {new Date().getFullYear()}</p>
                                    </div>

                                    {/* Document Info (Top Right) */}
                                    <div className="absolute top-0 right-0 text-right text-xs text-black">
                                        <p>Doc ID: PSUIC-ITP-{new Date().getFullYear()}-01</p>
                                        <p>Date: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>

                                {/* Executive Summary Ranking */}
                                <div className="mb-6">
                                    <h4 className="text-lg font-bold mb-2 text-black">1. Performance Ranking</h4>
                                    <table className="w-full border-collapse border border-black text-sm text-black">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border border-black p-2 text-center font-bold w-16 text-black">Rank</th>
                                                <th className="border border-black p-2 text-left font-bold text-black">Name</th>
                                                <th className="border border-black p-2 text-center font-bold text-black">Resolved</th>
                                                <th className="border border-black p-2 text-center font-bold text-black">Avg Score</th>
                                                <th className="border border-black p-2 text-center font-bold text-black">Avg Time/Task</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Limited to 10 to fit page 1 */}
                                            {data.slice(0, 10).map((it, index) => (
                                                <tr key={index}>
                                                    <td className="border border-black p-2 text-center font-bold text-black">{index + 1}</td>
                                                    <td className="border border-black p-2 font-medium text-black">{it.name || it.email}</td>
                                                    <td className="border border-black p-2 text-center text-black">{it.totalResolved}</td>
                                                    <td className="border border-black p-2 text-center font-bold text-black">{Number(it.avgRating || 0).toFixed(1)}</td>
                                                    <td className="border border-black p-2 text-center text-black">{it.avgResolutionTime || 0} min</td>
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
                                        <span className="font-bold text-black">Performance Ranking (Continued)</span>
                                        <span className="text-sm text-black">{new Date().toLocaleDateString('en-GB')}</span>
                                    </div>

                                    <table className="w-full border-collapse border border-black text-sm text-black">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="border border-black p-2 text-center font-bold w-16 text-black">Rank</th>
                                                <th className="border border-black p-2 text-left font-bold text-black">Name</th>
                                                <th className="border border-black p-2 text-center font-bold text-black">Resolved</th>
                                                <th className="border border-black p-2 text-center font-bold text-black">Avg Score</th>
                                                <th className="border border-black p-2 text-center font-bold text-black">Avg Time/Task</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.slice(10 + (pageIndex * 20), 10 + ((pageIndex + 1) * 20)).map((it, index) => (
                                                <tr key={index}>
                                                    <td className="border border-black p-2 text-center font-bold text-black">{10 + index + (pageIndex * 20) + 1}</td>
                                                    <td className="border border-black p-2 font-medium text-black">{it.name || it.email}</td>
                                                    <td className="border border-black p-2 text-center text-black">{it.totalResolved}</td>
                                                    <td className="border border-black p-2 text-center font-bold text-black">{Number(it.avgRating || 0).toFixed(1)}</td>
                                                    <td className="border border-black p-2 text-center text-black">{it.avgResolutionTime || 0} min</td>
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
            )}
        </div>
    );
};

export default ITPerformance;
