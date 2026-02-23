import React, { useEffect, useState, useCallback } from 'react';
import { getITPerformance } from '../../../api/report';
import { CheckCircle, Clock, TrendingUp, User, Users } from 'lucide-react';
import AdminSelect from '../../../components/admin/AdminSelect';
import ProfileAvatar from '../../../components/common/ProfileAvatar';
import { getUserDisplayName } from '../../../utils/userIdentity';
import dayjs from 'dayjs';

const ITPerformance = ({ month, year, externalData, externalLoading }) => {
    const [allStaff, setAllStaff] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [loading, setLoading] = useState(true);

    // Dynamic Date Range based on props
    const startDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('YYYY-MM-DD');
    const endDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).endOf('month').format('YYYY-MM-DD');

    // KPI Targets
    const TARGETS = {
        responseTime: 60,    // Target: < 60 mins (1 hr)
        resolutionTime: 240, // Target: < 240 mins (4 hrs)
    };

    // Convert raw minutes to "Xh Ym" or "Ym" format
    const formatDuration = (mins) => {
        if (mins === null || mins === undefined || isNaN(mins)) return 'N/A';
        const m = Math.round(Number(mins));
        if (m < 60) return `${m}m`;
        const h = Math.floor(m / 60);
        const rem = m % 60;
        return rem === 0 ? `${h}h` : `${h}h ${rem}m`;
    };

    // Return badge props based on value vs target
    const getRating = (value, target) => {
        if (value === null || value === undefined || isNaN(value)) return null;
        const v = Number(value);
        if (v <= target) return { label: 'Fast', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' };
        if (v <= target * 2) return { label: 'Acceptable', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' };
        return { label: 'Needs Improvement', bg: 'bg-red-100', text: 'text-red-600', dot: 'bg-red-500' };
    };

    const loadData = useCallback(async () => {
        if (externalData !== undefined) return; // skip if parent provides data
        try {
            setLoading(true);
            if (!startDate) return;
            const res = await getITPerformance(startDate, endDate);
            if (res.data && Array.isArray(res.data)) {
                setAllStaff(res.data);
                if (!selectedStaffId && res.data.length > 0) {
                    setSelectedStaffId(res.data[0].id);
                }
            } else {
                setAllStaff([]);
            }
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, externalData, selectedStaffId]);

    // Sync external data from parent
    useEffect(() => {
        if (externalData !== undefined) {
            const arr = Array.isArray(externalData) ? externalData : [];
            setAllStaff(arr);
            if (arr.length > 0 && !selectedStaffId) setSelectedStaffId(arr[0].id);
            setLoading(false);
        } else {
            loadData();
        }
    }, [externalData, loadData, selectedStaffId]);

    useEffect(() => {
        if (externalLoading !== undefined) setLoading(externalLoading);
    }, [externalLoading]);


    const handleStaffChange = (val) => {
        setSelectedStaffId(Number(val));
    };

    // Get current selected staff object
    const currentStaff = allStaff.find(s => s.id === selectedStaffId) || null;
    const currentStaffDisplayName = currentStaff ? getUserDisplayName(currentStaff, `Staff ${currentStaff.id}`) : '';



    const KpiCard = ({ title, value, icon, color, subtext, rating }) => {
        const IconComponent = icon;
        return (
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-full">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">{title}</p>
                        <h3 className="text-2xl text-gray-900 font-bold">{value}</h3>
                    </div>
                    <div className={`p-2 rounded-lg ${color} text-white shadow-sm`}>
                        <IconComponent size={18} />
                    </div>
                </div>
                {rating && (
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full w-fit mb-1.5 ${rating.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${rating.dot}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${rating.text}`}>{rating.label}</span>
                    </div>
                )}
                <p className="text-[11px] text-gray-400 font-medium">{subtext}</p>
            </div>
        );
    };

    return (
        <div className="space-y-4">

            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-base font-bold text-gray-900">Personal KPI Dashboard</h2>

                {/* Staff Selector */}
                <AdminSelect
                    value={selectedStaffId}
                    onChange={handleStaffChange}
                    options={[
                        ...allStaff.map(s => ({
                            value: s.id,
                            label: getUserDisplayName(s, `Staff ${s.id}`)
                        }))
                    ]}
                    placeholder="Select Staff"
                    icon={Users}
                    className="w-[200px]"
                    buttonClassName="w-full bg-white border-gray-200 h-9 text-xs"
                />
            </div>

            {loading ? (
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="h-48 bg-gray-50 rounded-xl animate-pulse border border-gray-100"></div>
                    <div className="h-48 bg-gray-50 rounded-xl animate-pulse border border-gray-100"></div>
                </div>
            ) : currentStaff ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Profile Card */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                            <div className="mb-3">
                                <div className="w-16 h-16 rounded-full border border-gray-100 overflow-hidden bg-gray-50 mx-auto shadow-sm">
                                    <ProfileAvatar
                                        user={currentStaff}
                                        alt={`${currentStaffDisplayName} profile`}
                                        className="w-full h-full"
                                        imageClassName="w-full h-full object-cover"
                                        fallbackClassName="w-full h-full flex items-center justify-center bg-[#1e2e4a] text-white"
                                        initialsClassName="text-base font-bold"
                                    />
                                </div>
                            </div>
                            <h3 className="text-base font-bold text-gray-900">{currentStaffDisplayName}</h3>
                            <p className="text-gray-500 text-xs mb-4">
                                {currentStaff.role ? currentStaff.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'IT Support'}
                            </p>

                            <div className="flex gap-4 w-full pt-3 border-t border-gray-100 justify-center">
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Active</p>
                                    <p className="text-sm font-bold text-gray-700">{currentStaff.pendingJobs}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Resolved</p>
                                    <p className="text-sm font-bold text-emerald-600">{currentStaff.totalResolved}</p>
                                </div>
                            </div>
                        </div>

                        {/* KPI Cards section - mapped to occupy remaining space */}
                        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <KpiCard
                                title="Tickets Resolved"
                                value={currentStaff.totalResolved}
                                icon={CheckCircle}
                                color="bg-emerald-500"
                                subtext="Total completed tickets"
                            />
                            <KpiCard
                                title="Avg. Response Time"
                                value={formatDuration(currentStaff.avgResponseTime)}
                                icon={Clock}
                                color="bg-blue-500"
                                subtext={`Target: under ${formatDuration(TARGETS.responseTime)}`}
                                rating={getRating(currentStaff.avgResponseTime, TARGETS.responseTime)}
                            />
                            <KpiCard
                                title="Avg. Resolution Time"
                                value={formatDuration(currentStaff.avgResolutionTime)}
                                icon={TrendingUp}
                                color="bg-amber-500"
                                subtext={`Target: under ${formatDuration(TARGETS.resolutionTime)}`}
                                rating={getRating(currentStaff.avgResolutionTime, TARGETS.resolutionTime)}
                            />
                        </div>
                    </div>


                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-gray-200 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <User size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-gray-900 font-medium text-lg mb-1">No Staff Selected</h3>
                    <p className="text-gray-500 text-sm max-w-xs">Select an IT support specialist to view their report.</p>
                </div>
            )}
        </div>
    );
};

export default ITPerformance;
