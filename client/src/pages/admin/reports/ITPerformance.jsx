import React, { useEffect, useState, useCallback } from 'react';
import useAuthStore from '../../../store/auth-store';
import { getITPerformance } from '../../../api/report';
import { Star, CheckCircle, Clock, Award } from 'lucide-react';
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



    const getRankStyle = (index) => {
        if (index === 0) return "bg-blue-50 border-blue-200 shadow-md";
        if (index === 1) return "bg-gray-50 border-gray-200";
        if (index === 2) return "bg-slate-50 border-slate-200";
        return "bg-white border-gray-100";
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

                    <ExportButtons onExportExcel={exportExcel} />
                </>
            )}
        </div>
    );
};

export default ITPerformance;
