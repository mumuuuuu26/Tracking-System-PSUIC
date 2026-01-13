import React, { useEffect, useState } from 'react';
import useAuthStore from '../../../store/auth-store';
import { getITPerformance } from '../../../api/report';
import { Star, CheckCircle, Clock, Trophy, Medal, Award } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import ExportButtons from '../../../components/admin/ExportButtons';

const ITPerformance = () => {
    const { token } = useAuthStore();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
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
    };

    const getRankIcon = (index) => {
        if (index === 0) return <Trophy className="text-yellow-500 fill-yellow-500" size={24} />;
        if (index === 1) return <Medal className="text-gray-400 fill-gray-400" size={24} />;
        if (index === 2) return <Medal className="text-amber-700 fill-amber-700" size={24} />;
        return <span className="text-lg font-bold text-gray-400 w-6 text-center">{index + 1}</span>;
    };

    const getRankStyle = (index) => {
        if (index === 0) return "bg-gradient-to-r from-yellow-50 to-white border-yellow-200 shadow-md";
        if (index === 1) return "bg-gradient-to-r from-gray-50 to-white border-gray-200";
        if (index === 2) return "bg-gradient-to-r from-amber-50 to-white border-amber-200";
        return "bg-white border-gray-100";
    };

    const exportPDF = async () => {
        try {
            setLoading(true);
            console.log("Starting PDF Export...");

            // 1. Scroll to top to prevent viewport clipping issues
            window.scrollTo(0, 0);

            const reportElement = document.getElementById('it-performance-report');
            if (!reportElement) {
                throw new Error("Report element not found");
            }

            // 2. Clone the element to ensure a clean capture context
            // This fixes "Unable to find element in cloned iframe" by ensuring the node is at the root body
            const clone = reportElement.cloneNode(true);

            // 3. Style the clone to be visible to html2canvas but hidden from user
            // We strip margins/padding that might shift it, and force a white background
            clone.style.position = 'absolute';
            clone.style.top = '0px';
            clone.style.left = '0px';
            // Match original width to keep layout
            clone.style.width = `${reportElement.offsetWidth}px`;
            clone.style.zIndex = '-9999'; // Behind everything
            clone.style.backgroundColor = '#ffffff';

            document.body.appendChild(clone);

            // Wait a moment for images in the clone to 'settle'
            await new Promise(resolve => setTimeout(resolve, 500));

            // Determine correct html2canvas function
            const h2c = html2canvas.default || html2canvas;
            if (typeof h2c !== 'function') {
                throw new Error("html2canvas is not loaded correctly");
            }

            console.log("Capturing clone...");
            const canvas = await h2c(clone, {
                scale: 2,
                useCORS: true,
                logging: false, // Reduce console noise
                backgroundColor: '#ffffff',
                allowTaint: true, // Allow unsafe images if necessary, though useCORS should handle it
                scrollY: 0,
                scrollX: 0
            });

            // 4. Remove the clone immediately
            document.body.removeChild(clone);

            console.log("Canvas captured. Generating PNG...");
            const imgData = canvas.toDataURL('image/png');

            console.log("Generating PDF...");
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth - 20; // 10mm margin each side
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 10; // Top margin

            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 10, -pageHeight + 10, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`it_performance_${new Date().toISOString().split('T')[0]}.pdf`);
            console.log("PDF Saved.");

        } catch (err) {
            console.error("PDF Export failed:", err);
            const errMsg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
            alert(`PDF Export failed: ${errMsg}`);

            // Cleanup in case of error (if clone is still there)
            // Note: We don't have a reference to 'clone' here easily unless we move declaration up, 
            // but effectively the page refresh or next render cleans up. 
            // For robustness, we could declare clone outside try, but this is usually fine.
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
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse"></div>)}
                </div>
            ) : (
                <>
                    <div id="it-performance-report">
                        {/* Team Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <CheckCircle size={20} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 uppercase">Total Resolved</p>
                                </div>
                                <p className="text-3xl font-extrabold text-gray-800">
                                    {data.reduce((acc, curr) => acc + (curr.totalResolved || 0), 0)}
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                        <Clock size={20} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 uppercase">Active Jobs</p>
                                </div>
                                <p className="text-3xl font-extrabold text-gray-800">
                                    {data.reduce((acc, curr) => acc + (curr.pendingJobs || 0), 0)}
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                        <Clock size={20} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 uppercase">Avg Response</p>
                                </div>
                                <p className="text-3xl font-extrabold text-indigo-600">
                                    {(data.reduce((acc, curr) => acc + Number(curr.avgResponseTime || 0), 0) / (data.filter(d => Number(d.avgResponseTime) > 0).length || 1)).toFixed(0)} <span className="text-sm font-normal text-gray-400">min</span>
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                        <Clock size={20} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 uppercase">Avg Resolution</p>
                                </div>
                                <p className="text-3xl font-extrabold text-emerald-600">
                                    {(data.reduce((acc, curr) => acc + Number(curr.avgResolutionTime || 0), 0) / (data.filter(d => Number(d.avgResolutionTime) > 0).length || 1)).toFixed(0)} <span className="text-sm font-normal text-gray-400">min</span>
                                </p>
                            </div>
                        </div>

                        {/* List Content */}
                        <div id="it-performance-content" className="space-y-4 bg-white p-6 rounded-2xl">
                            {data.map((it, index) => (
                                <div
                                    key={it.id}
                                    className={`p-4 md:p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between transition-all hover:shadow-lg hover:-translate-y-0.5 ${getRankStyle(index)}`}
                                >
                                    <div className="flex items-center gap-6 w-full md:w-auto mb-4 md:mb-0">
                                        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center">
                                            {getRankIcon(index)}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full p-1 bg-white shadow-sm border border-gray-100">
                                                <img
                                                    src={it.picture || `https://ui-avatars.com/api/?name=${it.name || 'IT'}&background=random`}
                                                    alt={it.name}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-800">{it.name || it.email}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={14}
                                                                className={i < Math.round(it.avgRating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded">
                                                        {Number(it.avgRating || 0).toFixed(1)}
                                                    </span>
                                                    <span className="text-xs text-gray-400 ml-1">
                                                        ({it.totalRated || 0} reviews)
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 md:gap-12 w-full md:w-auto justify-between md:justify-end px-4 md:px-0">
                                        <div className="text-center md:text-right">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-end gap-1">
                                                <CheckCircle size={14} className="text-emerald-500" />
                                                Resolved
                                            </p>
                                            <p className="font-extrabold text-2xl text-gray-800">{it.totalResolved || 0}</p>
                                        </div>
                                        <div className="text-center md:text-right">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-end gap-1">
                                                <Clock size={14} className="text-amber-500" />
                                                Active
                                            </p>
                                            <p className="font-extrabold text-2xl text-gray-800">{it.pendingJobs || 0}</p>
                                        </div>
                                        <div className="text-center md:text-right pl-4 border-l border-gray-100 flex flex-col gap-2">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                                                    Avg Response
                                                </p>
                                                <p className="font-bold text-lg text-blue-600">
                                                    {it.avgResponseTime || 0} m
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                                                    Avg Resol.
                                                </p>
                                                <p className="font-bold text-lg text-emerald-600">
                                                    {it.avgResolutionTime || 0} m
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {data.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 font-medium">No performance data available yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <ExportButtons onExportPDF={exportPDF} onExportExcel={exportExcel} />
                </>
            )}
        </div>
    );
};

export default ITPerformance;
