import React, { useEffect, useState } from 'react';
import useAuthStore from '../../../store/auth-store';
import { getSatisfactionStats } from '../../../api/report';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Award, MessageSquare, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import ExportButtons from '../../../components/admin/ExportButtons';

const SatisfactionReport = () => {
    const { token } = useAuthStore();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = React.useCallback(async () => {
        try {
            setLoading(true);
            const res = await getSatisfactionStats(token);
            setData(res.data);
            setError(null);
        } catch (err) {
            console.error("Failed to load satisfaction stats", err);
            setError("Failed to load data. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const COLORS = ['#193C6C', '#1E40AF', '#2563EB', '#3B82F6', '#60A5FA']; // Monochromatic Blue Scale

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center h-64 text-red-500">
            <AlertCircle size={48} className="mb-2" />
            <p>{error}</p>
        </div>
    );

    if (!data || data.totalRated === 0) return (
        <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
            <Award size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium">No feedback received yet</p>
            <p className="text-sm">User SUS ratings and comments will appear here.</p>
        </div>
    );

    // Prepare chart data
    const ranges = ["0-20", "21-40", "41-60", "61-80", "81-100"];
    const chartData = ranges.map(range => ({
        name: range,
        value: data.distribution[range] || 0
    }));

    const exportExcel = () => {
        // Use ALL feedback if available
        const feedbackList = data.allFeedback || data.recentFeedback;

        // Feedback Sheet
        const feedbackWs = XLSX.utils.json_to_sheet(feedbackList.map(item => ({
            Date: new Date(item.createdAt).toLocaleDateString(),
            SUS_Score: item.rating,
            Comment: item.userFeedback || "No Comment",
            User: item.createdBy?.name || "Unknown"
        })));

        // Summary Sheet
        const summaryData = [
            { Metric: "Average SUS Score", Value: data.averageRating.toFixed(1) },
            { Metric: "Total Respondants", Value: data.totalRated },
            ...Object.entries(data.distribution).map(([range, count]) => ({ Metric: `Range ${range}`, Value: count }))
        ];
        const summaryWs = XLSX.utils.json_to_sheet(summaryData);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
        XLSX.utils.book_append_sheet(wb, feedbackWs, "Feedback_Detail");
        XLSX.writeFile(wb, `satisfaction_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div id="satisfaction-report-content" className="space-y-6 p-4 bg-white rounded-2xl">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-lg text-center border border-gray-200 shadow-sm relative overflow-hidden">
                        <h3 className="text-gray-600 font-bold text-lg mb-2">Total Respondents (v2.2 / {data.allFeedback?.length || 0})</h3>
                        <p className="text-4xl font-bold text-blue-600">{data.totalRated}</p>
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
                    </div>
                    <div className="bg-white p-6 rounded-lg text-center border border-gray-200 shadow-sm relative overflow-hidden">
                        <h3 className="text-gray-600 font-bold text-lg mb-2">Average SUS Score</h3>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-4xl font-bold text-blue-800">{data.averageRating.toFixed(1)}</span>
                            <span className="text-sm font-bold text-gray-400 mt-2">/ 100</span>
                        </div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-800"></div>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Chart */}
                    <div className="bg-white p-4 border rounded-lg h-96 shadow-sm">
                        <h3 className="font-bold mb-4 text-gray-700">SUS Score Distribution</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#f3f4f6' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Comments */}
                    <div className="bg-white border rounded-lg p-4 h-96 shadow-sm flex flex-col">
                        <h3 className="font-bold mb-4 flex items-center gap-2 text-gray-700">
                            <MessageSquare size={18} /> Recent Feedback
                        </h3>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                            {data.recentFeedback.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">No comments yet</p>
                            ) : (
                                data.recentFeedback.map((item, index) => (
                                    <div key={index} className="border-b border-gray-100 pb-3 last:border-0 hover:bg-gray-50 p-2 rounded transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.rating >= 80 ? 'bg-blue-100 text-blue-800' :
                                                    item.rating >= 60 ? 'bg-blue-50 text-blue-600' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {item.rating}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {new Date(item.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {item.userFeedback && (
                                            <p className="text-sm text-gray-600 italic mt-1">"{item.userFeedback}"</p>
                                        )}
                                        <div className="flex items-center gap-1 mt-2">
                                            <span className="text-xs text-gray-400">User:</span>
                                            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                                {item.createdBy?.name || "Unknown"}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <ExportButtons onExportExcel={exportExcel} />
        </div>
    );
};

export default SatisfactionReport;
