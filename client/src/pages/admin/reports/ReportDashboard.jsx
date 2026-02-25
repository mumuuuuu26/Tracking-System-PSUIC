import React, { useState, useEffect, useCallback } from 'react';
import MonthlyReport from './MonthlyReport';
import EquipmentAnalysis from './EquipmentAnalysis';
import ITPerformance from './ITPerformance';
import RoomAnalysis from './RoomAnalysis';
import { Activity, Server, FileText, TableProperties, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import ErrorBoundary from '../../../components/common/ErrorBoundary';
import AdminWrapper from "../../../components/admin/AdminWrapper";
import AdminHeader from "../../../components/admin/AdminHeader";
import AdminSelect from "../../../components/admin/AdminSelect";
import { getMonthlyStats, getEquipmentStats, getITPerformance, getRoomStats, getSubComponentStats } from '../../../api/report';

const VALID_TABS = ['monthly', 'performance', 'room', 'equipment'];

const loadPdfDeps = async () => {
    const [jspdfModule, autoTableModule] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
    ]);

    const jsPDF = jspdfModule.jsPDF ?? jspdfModule.default;
    const autoTable = autoTableModule.default ?? autoTableModule.autoTable ?? autoTableModule;
    return { jsPDF, autoTable };
};

const loadXlsxDeps = async () => {
    const module = await import('xlsx/dist/xlsx.mini.min.js');
    return module.default ?? module;
};

const ReportDashboard = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const currentMonth = dayjs().month() + 1;
    const currentYear = dayjs().year();
    const maxYear = currentYear + 10;
    const parseTab = useCallback(
        (value) => (VALID_TABS.includes(value) ? value : 'monthly'),
        []
    );

    const parseMonth = useCallback((value) => {
        const num = Number(value);
        return Number.isInteger(num) && num >= 1 && num <= 12 ? num : currentMonth;
    }, [currentMonth]);

    const parseYear = useCallback((value) => {
        const num = Number(value);
        return Number.isInteger(num) && num >= 2024 && num <= maxYear ? num : currentYear;
    }, [currentYear, maxYear]);

    const [activeTab, setActiveTab] = useState(() => parseTab(searchParams.get('tab')));
    const [month, setMonth] = useState(() => parseMonth(searchParams.get('month')));
    const [year, setYear] = useState(() => parseYear(searchParams.get('year')));
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);

    // ---- Central data state for all tabs ----
    const [monthlyData, setMonthlyData] = useState(null);
    const [equipmentData, setEquipmentData] = useState([]);
    const [subComponentData, setSubComponentData] = useState([]); // [NEW]
    const [roomData, setRoomData] = useState([]);
    const [itData, setItData] = useState([]);
    const [loadingAll, setLoadingAll] = useState(false);

    const tabs = [
        { id: 'monthly', label: 'Ticket Overview', icon: <Activity size={18} /> },
        { id: 'performance', label: 'User Analysis', icon: <Activity size={18} /> },
        { id: 'room', label: 'Floor & Room', icon: <Server size={18} /> },
        { id: 'equipment', label: 'Equipment', icon: <Server size={18} /> },
    ];

    const updateSearchParams = useCallback((updates = {}) => {
        const params = new URLSearchParams(searchParams);
        const nextTab = updates.tab ?? activeTab;
        const nextMonth = Number(updates.month ?? month);
        const nextYear = Number(updates.year ?? year);

        params.set('tab', parseTab(nextTab));
        params.set('month', String(parseMonth(nextMonth)));
        params.set('year', String(parseYear(nextYear)));
        setSearchParams(params, { replace: true });
    }, [activeTab, month, parseMonth, parseTab, parseYear, searchParams, setSearchParams, year]);

    useEffect(() => {
        const nextTab = parseTab(searchParams.get('tab'));
        const nextMonth = parseMonth(searchParams.get('month'));
        const nextYear = parseYear(searchParams.get('year'));

        setActiveTab((prev) => (prev === nextTab ? prev : nextTab));
        setMonth((prev) => (prev === nextMonth ? prev : nextMonth));
        setYear((prev) => (prev === nextYear ? prev : nextYear));
    }, [parseMonth, parseTab, parseYear, searchParams]);

    // Fetch ALL data whenever month/year changes
    const fetchAllData = useCallback(async () => {
        setLoadingAll(true);
        try {
            const startDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('YYYY-MM-DD');
            const endDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).endOf('month').format('YYYY-MM-DD');

            const [mRes, eRes, rRes, iRes, sRes] = await Promise.allSettled([
                getMonthlyStats(month, year),
                getEquipmentStats(month, year),
                getRoomStats(month, year),
                getITPerformance(startDate, endDate),
                getSubComponentStats(month, year) // [NEW]
            ]);

            if (mRes.status === 'fulfilled') setMonthlyData(mRes.value.data);
            if (eRes.status === 'fulfilled') setEquipmentData(eRes.value.data || []);
            if (rRes.status === 'fulfilled') setRoomData(rRes.value.data || []);
            if (iRes.status === 'fulfilled') setItData(Array.isArray(iRes.value.data) ? iRes.value.data : []);
            if (sRes.status === 'fulfilled') setSubComponentData(Array.isArray(sRes.value.data) ? sRes.value.data : []); // [NEW]
        } catch {
            // Silent fail — individual tabs render their own error states
        } finally {
            setLoadingAll(false);
        }
    }, [month, year]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // ---- Unified PDF Export ----
    const exportAllAsPDF = async () => {
        setIsExportingPDF(true);
        try {
            const { jsPDF, autoTable } = await loadPdfDeps();
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const periodLabel = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('MMMM YYYY');
            const pageW = doc.internal.pageSize.getWidth();
            const margin = 14;

            // --- Custom Thai Font Initialization ---
            try {
                const arrayBufferToBase64 = (buffer) => {
                    let binary = '';
                    const bytes = new Uint8Array(buffer);
                    const len = bytes.byteLength;
                    for (let i = 0; i < len; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    return window.btoa(binary);
                };

                const fontReq = await fetch('/fonts/Sarabun-Regular.ttf');
                const fontBuffer = await fontReq.arrayBuffer();
                doc.addFileToVFS('Sarabun-Regular.ttf', arrayBufferToBase64(fontBuffer));
                doc.addFont('Sarabun-Regular.ttf', 'Sarabun', 'normal');

                const boldReq = await fetch('/fonts/Sarabun-Bold.ttf');
                const boldBuffer = await boldReq.arrayBuffer();
                doc.addFileToVFS('Sarabun-Bold.ttf', arrayBufferToBase64(boldBuffer));
                doc.addFont('Sarabun-Bold.ttf', 'Sarabun', 'bold');
            } catch (err) {
                console.warn('Failed to load Thai fonts for PDF:', err);
            }

            // ---- Helper functions ----
            const addSectionTitle = (title, yPos) => {
                doc.setFontSize(11);
                doc.setFont('Sarabun', 'bold');
                doc.setTextColor(25, 60, 108); // primary color
                doc.text(title, margin, yPos);
                doc.setDrawColor(25, 60, 108);
                doc.setLineWidth(0.3);
                doc.line(margin, yPos + 1.5, pageW - margin, yPos + 1.5);
                return yPos + 6;
            };

            const addKpiRow = (items, yStart) => {
                const colW = (pageW - margin * 2) / items.length;
                items.forEach((item, i) => {
                    const x = margin + i * colW;
                    doc.setFillColor(245, 247, 250);
                    doc.roundedRect(x, yStart, colW - 2, 18, 2, 2, 'F');
                    doc.setFontSize(16);
                    doc.setFont('Sarabun', 'bold');
                    doc.setTextColor(30, 30, 30);
                    doc.text(String(item.value), x + colW / 2, yStart + 9, { align: 'center' });
                    doc.setFontSize(7);
                    doc.setFont('Sarabun', 'normal');
                    doc.setTextColor(120, 120, 120);
                    doc.text(item.label.toUpperCase(), x + colW / 2, yStart + 14, { align: 'center' });
                });
                return yStart + 22;
            };

            // =========================================
            // PAGE 1: Cover + Ticket Overview
            // =========================================
            // Cover Header
            doc.setFillColor(25, 60, 108);
            doc.rect(0, 0, pageW, 32, 'F');
            doc.setFontSize(20);
            doc.setFont('Sarabun', 'bold');
            doc.setTextColor(255, 255, 255);
            doc.text('System Analytics Report', margin, 15);
            doc.setFontSize(10);
            doc.setFont('Sarabun', 'normal');
            doc.setTextColor(180, 200, 230);
            doc.text(`Period: ${periodLabel}  •  Generated: ${dayjs().format('DD MMM YYYY HH:mm')}`, margin, 22);
            doc.text('PSU International College — IT Tracking System', margin, 28);

            let y = 42;

            // ---- Section 1: Ticket Overview ----
            y = addSectionTitle('1. Ticket Overview', y);
            if (monthlyData) {
                y = addKpiRow([
                    { label: 'Total Tickets', value: monthlyData.total ?? 0 },
                    { label: 'Not Started', value: monthlyData.not_started ?? 0 },
                    { label: 'In Progress', value: monthlyData.in_progress ?? 0 },
                    { label: 'Completed', value: monthlyData.completed ?? 0 },
                    { label: 'Resolution Rate', value: `${monthlyData.resolutionRate ?? 0}%` },
                ], y);

                const dailyRows = (monthlyData.data || []).map(d => [
                    `Day ${d.day}`,
                    d.total,
                    d.not_started,
                    d.in_progress,
                    d.completed,
                ]);

                autoTable(doc, {
                    startY: y,
                    head: [['Day', 'Total', 'Not Started', 'In Progress', 'Completed']],
                    body: dailyRows,
                    theme: 'striped',
                    styles: { font: 'Sarabun' },
                    headStyles: { fillColor: [25, 60, 108], fontSize: 8, fontStyle: 'bold' },
                    bodyStyles: { fontSize: 8 },
                    margin: { left: margin, right: margin },
                    tableWidth: pageW - margin * 2,
                    columnStyles: {
                        0: { halign: 'center' },
                        1: { halign: 'center' },
                        2: { halign: 'center' },
                        3: { halign: 'center' },
                        4: { halign: 'center' },
                    },
                });
                y = doc.lastAutoTable.finalY + 10;
            } else {
                doc.setFontSize(9); doc.setTextColor(150, 150, 150);
                doc.text('No ticket data available for this period.', margin, y + 4);
                y += 12;
            }

            // =========================================
            // Section 2: IT Staff Performance
            // =========================================
            if (y > 240) { doc.addPage(); y = 20; }
            y = addSectionTitle('2. IT Staff Performance (Personal KPI)', y);

            if (itData.length > 0) {
                autoTable(doc, {
                    startY: y,
                    head: [['Staff Name', 'Active Jobs', 'Resolved (Period)', 'Avg Response (min)', 'Avg Resolution (min)']],
                    body: itData.map(s => [
                        s.name || s.email || `IT #${s.id}`,
                        s.pendingJobs ?? 0,
                        s.totalResolved ?? 0,
                        s.avgResponseTime ?? 0,
                        s.avgResolutionTime ?? 0,
                    ]),
                    theme: 'striped',
                    styles: { font: 'Sarabun' },
                    headStyles: { fillColor: [25, 60, 108], fontSize: 8, fontStyle: 'bold' },
                    bodyStyles: { fontSize: 8 },
                    margin: { left: margin, right: margin },
                    tableWidth: pageW - margin * 2,
                    columnStyles: {
                        1: { halign: 'center' },
                        2: { halign: 'center' },
                        3: { halign: 'center' },
                        4: { halign: 'center' },
                    },
                });
                y = doc.lastAutoTable.finalY + 10;
            } else {
                doc.setFontSize(9); doc.setTextColor(150, 150, 150);
                doc.text('No IT performance data available for this period.', margin, y + 4);
                y += 12;
            }

            // =========================================
            // Section 3: Floor & Room Analysis
            // =========================================
            if (y > 220) { doc.addPage(); y = 20; }
            y = addSectionTitle('3. Floor & Room Analysis', y);

            if (roomData.length > 0) {
                autoTable(doc, {
                    startY: y,
                    head: [['Room', 'Floor', 'Total Issues', 'Resolved', 'Pending', 'Rate']],
                    body: roomData.map(r => [
                        r.roomNumber || '-',
                        `Floor ${r.floor || '-'}`,
                        r.totalTickets ?? 0,
                        r.completed ?? 0,
                        r.pending ?? 0,
                        r.totalTickets > 0 ? `${Math.round((r.completed / r.totalTickets) * 100)}%` : '0%',
                    ]),
                    theme: 'striped',
                    styles: { font: 'Sarabun' },
                    headStyles: { fillColor: [25, 60, 108], fontSize: 8, fontStyle: 'bold' },
                    bodyStyles: { fontSize: 8 },
                    margin: { left: margin, right: margin },
                    tableWidth: pageW - margin * 2,
                    columnStyles: {
                        2: { halign: 'center' },
                        3: { halign: 'center' },
                        4: { halign: 'center' },
                        5: { halign: 'center' },
                    },
                });
                y = doc.lastAutoTable.finalY + 10;
            } else {
                doc.setFontSize(9); doc.setTextColor(150, 150, 150);
                doc.text('No room data available for this period.', margin, y + 4);
                y += 12;
            }

            // =========================================
            // Section 4: Equipment Analysis
            // =========================================
            if (y > 220) { doc.addPage(); y = 20; }
            y = addSectionTitle('4. Top Problematic Equipment', y);

            if (equipmentData.length > 0) {
                autoTable(doc, {
                    startY: y,
                    head: [['Rank', 'Equipment Name', 'Location (Room)', 'Status', 'Issue Count']],
                    body: equipmentData.map((e, i) => [
                        `#${i + 1}`,
                        e.name || '-',
                        e.room || '-',
                        e.status || '-',
                        e.amount ?? 0,
                    ]),
                    theme: 'striped',
                    styles: { font: 'Sarabun' },
                    headStyles: { fillColor: [25, 60, 108], fontSize: 8, fontStyle: 'bold' },
                    bodyStyles: { fontSize: 8 },
                    margin: { left: margin, right: margin },
                    tableWidth: pageW - margin * 2,
                    columnStyles: {
                        0: { halign: 'center', cellWidth: 15 },
                        4: { halign: 'center' },
                    },
                });
                y = doc.lastAutoTable.finalY + 10;
            } else {
                doc.setFontSize(9); doc.setTextColor(150, 150, 150);
                doc.text('No equipment data available for this period.', margin, y + 4);
                y += 12;
            }

            // =========================================
            // Section 5: Top Replaced Parts (Sub-components)
            // =========================================
            if (y > 220) { doc.addPage(); y = 20; }
            y = addSectionTitle('5. Top Replaced Parts', y);

            if (subComponentData && subComponentData.length > 0) {
                autoTable(doc, {
                    startY: y,
                    head: [['Rank', 'Replacement Part', 'Count']],
                    body: subComponentData.map((s, i) => [
                        `#${i + 1}`,
                        s.name || '-',
                        s.amount ?? 0,
                    ]),
                    theme: 'striped',
                    styles: { font: 'Sarabun' },
                    headStyles: { fillColor: [25, 60, 108], fontSize: 8, fontStyle: 'bold' },
                    bodyStyles: { fontSize: 8 },
                    margin: { left: margin, right: margin },
                    tableWidth: pageW - margin * 2,
                    columnStyles: {
                        0: { halign: 'center', cellWidth: 20 },
                        2: { halign: 'center', cellWidth: 30 },
                    },
                });
            } else {
                doc.setFontSize(9); doc.setTextColor(150, 150, 150);
                doc.text('No replaced parts data available for this period.', margin, y + 4);
            }

            // ---- Page numbers ----
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(7);
                doc.setTextColor(180, 180, 180);
                doc.text(`Page ${i} of ${totalPages}`, pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
            }

            doc.save(`System_Report_${periodLabel.replace(' ', '_')}.pdf`);
        } catch {
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setIsExportingPDF(false);
        }
    };

    // ---- Unified Excel Export (multi-sheet workbook) ----
    const exportAllAsExcel = async () => {
        setIsExportingExcel(true);
        try {
            const XLSX = await loadXlsxDeps();
            const periodLabel = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('MMMM_YYYY');
            const wb = XLSX.utils.book_new();

            // Sheet 1: Ticket Overview
            const ticketRows = (monthlyData?.data || []).map(d => ({
                Day: `Day ${d.day}`,
                Total: d.total ?? 0,
                'Not Started': d.not_started ?? 0,
                'In Progress': d.in_progress ?? 0,
                Completed: d.completed ?? 0,
            }));
            // Prepend summary row
            ticketRows.unshift({
                Day: 'SUMMARY',
                Total: monthlyData?.total ?? 0,
                'Not Started': monthlyData?.not_started ?? 0,
                'In Progress': monthlyData?.in_progress ?? 0,
                Completed: monthlyData?.completed ?? 0,
            });
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ticketRows), 'Ticket Overview');

            // Sheet 2: IT Staff Performance
            const itRows = itData.map(s => ({
                Name: s.name || s.email || `Staff #${s.id}`,
                'Active Jobs': s.pendingJobs ?? 0,
                'Resolved (Period)': s.totalResolved ?? 0,
                'Avg Response (min)': s.avgResponseTime ?? 0,
                'Avg Resolution (min)': s.avgResolutionTime ?? 0,
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itRows.length ? itRows : [{ Note: 'No data' }]), 'IT Performance');

            // Sheet 3: Room Analysis
            const roomRows = roomData.map(r => ({
                Room: r.roomNumber || '-',
                Floor: `Floor ${r.floor || '-'}`,
                'Total Issues': r.totalTickets ?? 0,
                Resolved: r.completed ?? 0,
                Pending: r.pending ?? 0,
                'Resolution Rate': r.totalTickets > 0 ? `${Math.round((r.completed / r.totalTickets) * 100)}%` : '0%',
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(roomRows.length ? roomRows : [{ Note: 'No data' }]), 'Room Analysis');

            // Sheet 4: Equipment Analysis
            const equipRows = equipmentData.map((e, i) => ({
                Rank: i + 1,
                'Equipment Name': e.name || '-',
                'Room / Location': e.room || '-',
                Status: e.status || '-',
                'Issue Count': e.amount ?? 0,
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(equipRows.length ? equipRows : [{ Note: 'No data' }]), 'Equipment');

            // Sheet 5: Top Replaced Parts
            const subRows = subComponentData.map((s, i) => ({
                Rank: i + 1,
                'Replacement Part': s.name || '-',
                'Count': s.amount ?? 0,
            }));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(subRows.length ? subRows : [{ Note: 'No data' }]), 'Replaced Parts');

            XLSX.writeFile(wb, `System_Report_${periodLabel}.xlsx`);
        } catch {
            alert('Failed to generate Excel file. Please try again.');
        } finally {
            setIsExportingExcel(false);
        }
    };

    return (
        <AdminWrapper>
            <div className="flex flex-col h-full px-6 pt-2 pb-24 md:pb-2 space-y-2 overflow-y-auto">
                {/* Header Card */}
                <AdminHeader
                    title="System Reports"
                    subtitle={`Analytics Overview • ${dayjs().format('MMMM D, YYYY')}`}
                    onBack={() => navigate(-1)}
                />

                {/* Filters & Tabs Row */}
                <div className="flex flex-col lg:flex-row items-center justify-between gap-3 mb-4">
                    {/* Tabs */}
                    <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-100">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id);
                                    updateSearchParams({ tab: tab.id });
                                }}
                                className={`
                                        flex items-center gap-2 px-3 py-1.5 rounded-md font-bold text-xs transition-all
                                        ${activeTab === tab.id
                                        ? 'bg-primary text-white shadow-md'
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                    }
                                    `}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Date Filters + Export Button */}
                    <div className="flex items-center gap-2">
                        <AdminSelect
                            value={year}
                            onChange={(value) => {
                                const nextYear = Number(value);
                                setYear(nextYear);
                                updateSearchParams({ year: nextYear });
                            }}
                            options={Array.from({ length: (dayjs().year() + 10) - 2024 + 1 }, (_, i) => 2024 + i)}
                            className="min-w-[90px]"
                        />
                        <AdminSelect
                            value={month}
                            onChange={(value) => {
                                const nextMonth = Number(value);
                                setMonth(nextMonth);
                                updateSearchParams({ month: nextMonth });
                            }}
                            options={Array.from({ length: 12 }, (_, i) => ({
                                value: i + 1,
                                label: dayjs().month(i).format('MMMM')
                            }))}
                            className="min-w-[140px]"
                        />
                        {/* Export PDF Button */}
                        <button
                            onClick={exportAllAsPDF}
                            disabled={isExportingPDF || loadingAll}
                            title="Export all report sections as a single PDF"
                            className="flex items-center gap-2 bg-[#193C6C] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#15325b] transition-all shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed border border-blue-900/20 whitespace-nowrap"
                        >
                            {isExportingPDF ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <FileText size={15} />
                            )}
                            {isExportingPDF ? 'Generating...' : 'Export PDF'}
                        </button>

                        {/* Export Excel Button */}
                        <button
                            onClick={exportAllAsExcel}
                            disabled={isExportingExcel || loadingAll}
                            title="Export all report sections as a multi-sheet Excel workbook"
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed border border-emerald-800/20 whitespace-nowrap"
                        >
                            {isExportingExcel ? (
                                <Loader2 size={15} className="animate-spin" />
                            ) : (
                                <TableProperties size={15} />
                            )}
                            {isExportingExcel ? 'Exporting...' : 'Export Excel'}
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div id="report-content" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ErrorBoundary>
                        {activeTab === 'monthly' && (
                            <MonthlyReport
                                month={month}
                                year={year}
                                externalData={monthlyData}
                                externalLoading={loadingAll}
                            />
                        )}
                        {activeTab === 'performance' && (
                            <ITPerformance
                                month={month}
                                year={year}
                                externalData={itData}
                                externalLoading={loadingAll}
                            />
                        )}
                        {activeTab === 'room' && (
                            <RoomAnalysis
                                month={month}
                                year={year}
                                externalData={roomData}
                                externalLoading={loadingAll}
                            />
                        )}
                        {activeTab === 'equipment' && (
                            <EquipmentAnalysis
                                month={month}
                                year={year}
                                externalData={equipmentData}
                                externalSubData={subComponentData}
                                externalLoading={loadingAll}
                            />
                        )}
                    </ErrorBoundary>
                </div>
            </div>
        </AdminWrapper>
    );
};

export default ReportDashboard;
