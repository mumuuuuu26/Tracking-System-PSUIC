import React, { useState, useEffect } from "react";
import { Search, Filter, X, Download, Printer } from "lucide-react";
import useEcomStore from "../../store/ecom-store";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const fmt = (n) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const SearchBills = () => {
  const token = useEcomStore((s) => s.token);
  const products = useEcomStore((s) => s.products);
  const getProduct = useEcomStore((s) => s.getProduct);
  const categories = useEcomStore((s) => s.categories);
  const getCategory = useEcomStore((s) => s.getCategory);

  const [plateNumber, setPlateNumber] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    getProduct(token, 1000);
    getCategory(token);
  }, []);

  const handleSearch = () => {
    let filtered = [...products];

    if (plateNumber.trim()) {
      filtered = filtered.filter((p) => {
        const plate = p.title?.split(" - ")[0] || p.title;
        return plate.toLowerCase().includes(plateNumber.toLowerCase());
      });
    }

    if (dateFrom) {
      const from = dayjs(dateFrom).startOf("day");
      filtered = filtered.filter(
        (p) =>
          dayjs(p.createdAt).isAfter(from) || dayjs(p.createdAt).isSame(from)
      );
    }

    if (dateTo) {
      const to = dayjs(dateTo).endOf("day");
      filtered = filtered.filter(
        (p) => dayjs(p.createdAt).isBefore(to) || dayjs(p.createdAt).isSame(to)
      );
    }

    setFilteredBills(filtered);
    setSearched(true);
    toast.success(`ค้นหาเสร็จสิ้น พบ ${filtered.length} รายการ`);
  };

  const clearFilters = () => {
    setPlateNumber("");
    setDateFrom("");
    setDateTo("");
    setShowFilters(false);
    setFilteredBills([]);
    setSearched(false);
  };

  // ฟังก์ชันสร้าง PDF
  const generatePDF = (product) => {
    const category = categories.find((c) => c.id === product.categoryId);
    if (!category) {
      toast.error("ไม่พบข้อมูลทะเบียนรถ");
      return;
    }

    const net = Math.max((product.weightIn || 0) - (product.weightOut || 0), 0);
    const totalAmount = product.price * net;

    // สร้าง HTML สำหรับบิล
    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>ใบแสดงรายการซื้อขายปาล์มน้ำมัน - ${product.title}</title>
        <style>
          @page { 
            size: A4 landscape;
            margin: 0; 
          }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
            padding: 15mm;
            background: white;
            width: 297mm;
            height: 210mm;
          }
          .bill-container {
            width: 100%;
            height: 100%;
            background: white;
            padding: 12mm;
            border: 3px solid #059669;
            display: flex;
            flex-direction: column;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #059669;
            padding-bottom: 8px;
            margin-bottom: 15px;
          }
          .company-name {
            font-size: 32px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 4px;
          }
          .bill-title {
            font-size: 26px;
            font-weight: bold;
            color: #047857;
            margin-top: 8px;
          }
          .address {
            font-size: 13px;
            color: #374151;
            margin-top: 6px;
            line-height: 1.5;
          }
          .content-wrapper {
            display: flex;
            gap: 20px;
            flex: 1;
          }
          .left-section {
            flex: 1;
          }
          .right-section {
            flex: 1;
          }
          .info-section {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin: 15px 0;
          }
          .info-box {
            padding: 10px;
            background: #f3f4f6;
            border-radius: 8px;
          }
          .info-label {
            font-size: 11px;
            color: #6b7280;
            margin-bottom: 3px;
          }
          .info-value {
            font-size: 15px;
            font-weight: bold;
            color: #1f2937;
          }
          .details-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0;
          }
          .details-table th {
            background: #d1fae5;
            color: #065f46;
            padding: 10px;
            text-align: left;
            border: 1px solid #6ee7b7;
            font-size: 13px;
          }
          .details-table td {
            padding: 8px 10px;
            border: 1px solid #d1d5db;
            font-size: 13px;
          }
          .details-table tr:nth-child(even) {
            background: #f9fafb;
          }
          .total-section {
            margin-top: 15px;
            border-top: 2px solid #059669;
            padding-top: 12px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 15px;
          }
          .total-row.grand {
            font-size: 20px;
            font-weight: bold;
            color: #059669;
            border-top: 2px solid #d1d5db;
            margin-top: 8px;
            padding-top: 12px;
          }
          .signature-section {
            display: flex;
            justify-content: space-around;
            margin-top: 30px;
          }
          .signature-box {
            text-align: center;
            width: 180px;
          }
          .signature-line {
            border-top: 1px solid #000;
            margin-top: 50px;
            padding-top: 6px;
            font-size: 13px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #d1d5db;
            color: #6b7280;
            font-size: 11px;
          }
          .customer-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
          }
          .badge-large {
            background: #fef3c7;
            color: #92400e;
          }
          .badge-retail {
            background: #d1fae5;
            color: #065f46;
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <div class="company-name">บ้านกลางปาล์ม</div>
            <div class="address">
              เลขที่ 93/1 ม.3 ต.บ้านกลาง อ.อ่าวลึก จ.กระบี่ 81110<br>
              โทร: 087-897-1223 | อีเมล: banklangpalm@gmail.com
            </div>
            <div class="bill-title">ใบรายการซื้อขายปาล์มน้ำมัน</div>
          </div>

          <div class="info-section">
            <div class="info-box">
              <div class="info-label">เลขที่</div>
              <div class="info-value">${String(product.id).padStart(
                8,
                "0"
              )}</div>
            </div>
            <div class="info-box">
              <div class="info-label">วันที่</div>
              <div class="info-value">${dayjs(product.createdAt).format(
                "DD/MM/YYYY"
              )}</div>
            </div>
            <div class="info-box">
              <div class="info-label">เวลา</div>
              <div class="info-value">${dayjs(product.createdAt).format(
                "HH:mm"
              )} น.</div>
            </div>
          </div>

          <div class="content-wrapper">
            <div class="left-section">
              <table class="details-table">
                <tr>
                  <th colspan="2">รายละเอียดการชั่งน้ำหนัก</th>
                </tr>
                <tr>
                  <td style="width: 45%">ทะเบียนรถ</td>
                  <td style="width: 55%; font-weight: bold">
                    ${category.name}
                    <span class="customer-badge ${
                      category.customerType === "large"
                        ? "badge-large"
                        : "badge-retail"
                    }">
                      ${
                        category.customerType === "large"
                          ? "ลูกค้ารายใหญ่"
                          : "ลูกค้ารายย่อย"
                      }
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>น้ำหนักเข้า</td>
                  <td style="font-weight: bold">${Number(
                    product.weightIn || 0
                  ).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })} กก.</td>
                </tr>
                <tr>
                  <td>น้ำหนักออก</td>
                  <td style="font-weight: bold">${Number(
                    product.weightOut || 0
                  ).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })} กก.</td>
                </tr>
                <tr style="background: #fef3c7">
                  <td style="font-weight: bold; color: #92400e">น้ำหนักสุทธิ</td>
                  <td style="font-weight: bold; font-size: 16px; color: #92400e">${Number(
                    net
                  ).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })} กก.</td>
                </tr>
              </table>

              <div class="signature-section">
                <div class="signature-box">
                  <div class="signature-line">ผู้ขาย</div>
                  <div style="margin-top: 4px; font-size: 11px">(ลงชื่อ)</div>
                </div>
                <div class="signature-box">
                  <div class="signature-line">ผู้รับซื้อ</div>
                  <div style="margin-top: 4px; font-size: 11px">(ลงชื่อ)</div>
                </div>
              </div>
            </div>

            <div class="right-section">
              <div class="total-section">
                <div class="total-row">
                  <span>ราคาต่อหน่วย (กก.):</span>
                  <span>${Number(product.price).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })} บาท</span>
                </div>
                <div class="total-row">
                  <span>น้ำหนักสุทธิ:</span>
                  <span>${Number(net).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })} กก.</span>
                </div>
                <div class="total-row grand">
                  <span>จำนวนเงินรวม:</span>
                  <span>${Number(totalAmount).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })} บาท</span>
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>ขอบคุณที่ใช้บริการ - บ้านกลางปาล์ม</p>
            <p style="margin-top: 5px">หมายเหตุ: กรุณาเก็บใบบิลนี้ไว้เป็นหลักฐาน</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // สร้าง window ใหม่สำหรับพิมพ์
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(billHTML);
      printWindow.document.close();

      // รอให้โหลดเสร็จแล้วพิมพ์
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      toast.error("ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาอนุญาตให้เปิด popup");
    }
  };

  // คำนวณสรุปผล
  const summary = searched
    ? {
        total: filteredBills.length,
        totalWeight: filteredBills.reduce((sum, bill) => {
          return (
            sum + Math.max((bill.weightIn || 0) - (bill.weightOut || 0), 0)
          );
        }, 0),
        totalAmount: filteredBills.reduce((sum, bill) => {
          const net = Math.max((bill.weightIn || 0) - (bill.weightOut || 0), 0);
          return sum + bill.price * net;
        }, 0),
      }
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ค้นหาข้อมูลการซื้อขาย
          </h1>
          <p className="text-gray-600">
            ค้นหาและดูรายละเอียดบิลการซื้อขายปาล์มน้ำมันของคุณ
          </p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="ค้นหาทะเบียนรถ เช่น 1234"
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
            />

            <div className="flex items-center gap-2">
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                <Search size={20} />
                ค้นหา
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-3 border-2 rounded-xl transition-all ${
                  showFilters
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 hover:bg-gray-100"
                }`}
                title="ตัวกรองเพิ่มเติม"
              >
                <Filter size={20} />
              </button>

              {(plateNumber || dateFrom || dateTo) && (
                <button
                  onClick={clearFilters}
                  className="p-3 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-all"
                  title="ล้างตัวกรอง"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Date Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จากวันที่
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ถึงวันที่
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards - แสดงเฉพาะเมื่อค้นหาแล้ว */}
        {searched && summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  จำนวนบิล
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {summary.total}
              </div>
              <p className="text-sm text-gray-600 mt-1">รายการ</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  น้ำหนักรวม
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-800">
                {fmt(summary.totalWeight)}
              </div>
              <p className="text-sm text-gray-600 mt-1">กิโลกรัม</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  ยอดเงินรวม
                </span>
              </div>
              <div className="text-3xl font-bold text-emerald-600">
                {fmt(summary.totalAmount)}
              </div>
              <p className="text-sm text-gray-600 mt-1">บาท</p>
            </div>
          </div>
        )}

        {/* Results Table */}
        {searched && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {filteredBills.length === 0 ? (
              <div className="p-20 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                  </p>
                  <p className="text-gray-400 text-sm">
                    ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองใหม่
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                        วันที่/เวลา
                      </th>
                      <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                        ทะเบียนรถ
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                        ประเภท
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                        น้ำหนักเข้า
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                        น้ำหนักออก
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                        น้ำหนักสุทธิ
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                        ราคา/กก.
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                        ยอดรวม
                      </th>
                      <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBills.map((bill) => {
                      const net = Math.max(
                        (bill.weightIn || 0) - (bill.weightOut || 0),
                        0
                      );
                      const total = bill.price * net;
                      const plateNumber =
                        bill.title?.split(" - ")[0] || bill.title;

                      return (
                        <tr
                          key={bill.id}
                          className="hover:bg-gray-50 transition-colors duration-150"
                        >
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {dayjs(bill.createdAt).format("DD/MM/YY HH:mm")}
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-semibold text-gray-800">
                              {plateNumber}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                                bill.description === "ลูกค้ารายใหญ่"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {bill.description}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-gray-700">
                            {fmt(bill.weightIn)}
                          </td>
                          <td className="px-4 py-4 text-center text-gray-700">
                            {fmt(bill.weightOut)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="font-semibold text-gray-800">
                              {fmt(net)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-gray-700">
                            {fmt(bill.price)}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="font-bold text-lg text-emerald-600">
                              {fmt(total)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => generatePDF(bill)}
                                className="group relative p-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                title="พิมพ์/ดาวน์โหลดบิล"
                              >
                                <Printer className="w-5 h-5" />
                                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  พิมพ์บิล
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  // สามารถเพิ่มฟังก์ชันดาวน์โหลด PDF ได้ในอนาคต
                                  generatePDF(bill);
                                }}
                                className="group relative p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                                title="ดาวน์โหลด PDF"
                              >
                                <Download className="w-5 h-5" />
                                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  ดาวน์โหลด PDF
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Initial State - แสดงเมื่อยังไม่ได้ค้นหา */}
        {!searched && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-16">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-6">
                <Search className="w-12 h-12 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">
                เริ่มค้นหาข้อมูลของคุณ
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                ใส่ทะเบียนรถหรือเลือกช่วงวันที่ที่ต้องการค้นหา
                แล้วกดปุ่มค้นหาเพื่อดูรายละเอียดบิล
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">1</span>
                  </div>
                  <span>ระบุทะเบียนรถ</span>
                </div>
                <div className="hidden sm:block text-gray-400">→</div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 font-semibold">2</span>
                  </div>
                  <span>เลือกช่วงเวลา (ถ้าต้องการ)</span>
                </div>
                <div className="hidden sm:block text-gray-400">→</div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <span className="text-emerald-600 font-semibold">3</span>
                  </div>
                  <span>กดค้นหา</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBills;
