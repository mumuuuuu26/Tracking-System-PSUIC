import React, { useEffect, useState } from 'react';
import { getMonthlyStats } from '../../../api/report';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Calendar, Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import dayjs from 'dayjs';

const MonthlyReport = ({ month, year, externalData, externalLoading }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = React.useCallback(async () => {
        // If parent provides data, skip own fetch
        if (externalData !== undefined) return;
        try {
            setLoading(true);
            setError(null);
            const res = await getMonthlyStats(month, year);
            setData(res.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || err.message || "Failed to load report data");
        } finally {
            setLoading(false);
        }
    }, [month, year, externalData]);

    // Sync external data when provided by parent
    useEffect(() => {
        if (externalData !== undefined) {
            setData(externalData);
            setLoading(false);
            setError(null);
        }
    }, [externalData]);

    useEffect(() => {
        if (externalLoading !== undefined) setLoading(externalLoading);
    }, [externalLoading]);

    // Safe accessors
    const reportData = Array.isArray(data?.data) ? data.data : [];
    const totalTickets = data?.total || 0;
    const notStarted = data?.not_started || 0;
    const inProgress = data?.in_progress || 0;
    const completed = data?.completed || 0;
    const resolutionRate = data?.resolutionRate || 0;

    return (
        <div className="space-y-6">

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse"></div>)}
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
                <div id="monthly-report-content" className="space-y-4">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        {/* Total Tickets */}
                        <div className="bg-primary text-white p-3 rounded-xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{totalTickets}</h3>
                                    <p className="text-blue-200 text-[10px] font-medium uppercase tracking-wider">Total Tickets</p>
                                </div>
                                <button className="mt-1 text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded w-fit transition-colors flex items-center gap-1">
                                    Details <span className="text-[9px]">›</span>
                                </button>
                            </div>
                            <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-14 h-14 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all"></div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/10">
                                <Activity size={36} />
                            </div>
                        </div>

                        {/* Not Started */}
                        <div className="bg-error text-white p-3 rounded-xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{notStarted}</h3>
                                    <p className="text-red-100 text-[10px] font-medium uppercase tracking-wider">Not Started</p>
                                </div>
                                <button className="mt-1 text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded w-fit transition-colors flex items-center gap-1">
                                    Details <span className="text-[9px]">›</span>
                                </button>
                            </div>
                            <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-14 h-14 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all"></div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/10">
                                <AlertCircle size={36} />
                            </div>
                        </div>

                        {/* In Progress */}
                        <div className="bg-warning text-white p-3 rounded-xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{inProgress}</h3>
                                    <p className="text-orange-100 text-[10px] font-medium uppercase tracking-wider">In Progress</p>
                                </div>
                                <button className="mt-1 text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded w-fit transition-colors flex items-center gap-1">
                                    Details <span className="text-[9px]">›</span>
                                </button>
                            </div>
                            <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-14 h-14 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all"></div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/10">
                                <Clock size={36} />
                            </div>
                        </div>

                        {/* Completed */}
                        <div className="bg-success text-white p-3 rounded-xl shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{completed}</h3>
                                    <p className="text-green-100 text-[10px] font-medium uppercase tracking-wider">Completed</p>
                                </div>
                                <button className="mt-1 text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded w-fit transition-colors flex items-center gap-1">
                                    Details <span className="text-[9px]">›</span>
                                </button>
                            </div>
                            <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-14 h-14 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all"></div>
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white/10">
                                <CheckCircle size={36} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Daily Trend Chart (2/3 width) */}
                        <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Daily Ticket Trend</h3>
                                <div className="px-2.5 py-1 bg-gray-50 text-gray-500 rounded text-[10px] font-bold uppercase tracking-wider border border-gray-100">
                                    Last 7 Days
                                </div>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={reportData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="day"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', fontSize: '11px' }}
                                        />
                                        <Area type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Resolution Rate (1/3 width) */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-full min-h-[250px]">
                            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4">
                                <Activity size={32} />
                            </div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Resolution Rate</h3>
                            <p className="text-5xl font-bold text-gray-900 mb-2">{resolutionRate}%</p>
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                                Success
                            </span>
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


        </div>
    );
};

export default MonthlyReport;
