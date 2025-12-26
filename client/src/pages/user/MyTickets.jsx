import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  X,
  Download,
  Printer,
  TrendingUp,
  FileText,
  Weight,
  DollarSign,
} from "lucide-react";
import useEcomStore from "../../store/ecom-store";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const fmt = (n) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const MyTickets = () => {
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
  const today = dayjs().format("YYYY-MM-DD");

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

  const generatePDF = (product) => {
    const category = {
      name: product.title?.split(" - ")[0] || product.title || "ไม่ระบุ",
      customerType:
        product.description === "ลูกค้ารายใหญ่" ? "large" : "retail",
    };

    const net = Math.max((product.weightIn || 0) - (product.weightOut || 0), 0);
    const totalAmount = product.price * net;

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

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(billHTML);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      toast.error("ไม่สามารถเปิดหน้าต่างใหม่ได้ กรุณาอนุญาตให้เปิด popup");
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-emerald-100/30 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-blue-100/30 to-transparent rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header with Icon */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg mb-4 transform hover:scale-110 transition-transform duration-300">
            <Search className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-emerald-700 to-teal-700 bg-clip-text text-transparent mb-3">
            ค้นหาข้อมูลการซื้อขาย
          </h1>
          <p className="text-gray-600 text-lg">
            ค้นหาและจัดการบิลการซื้อขายปาล์มน้ำมันของคุณได้อย่างง่ายดาย
          </p>
        </div>

        {/* Enhanced Search Section with Glass Effect */}
        <div className="relative backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/50 p-8 mb-8 hover:shadow-emerald-200/50 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-3xl"></div>

          <div className="relative flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative group w-full">
              <Search
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors"
                size={20}
              />
              <input
                type="text"
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="ค้นหาทะเบียนรถ เช่น กก 1988"
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-200/50 rounded-2xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-300 bg-white/70 placeholder-gray-400 text-gray-800 font-medium"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSearch}
                className="group relative px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-2xl font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <div className="relative flex items-center gap-2">
                  <Search size={20} />
                  <span>ค้นหา</span>
                </div>
              </button>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 ${
                  showFilters
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                    : "bg-white/70 border-2 border-gray-200/50 hover:border-emerald-300 hover:bg-emerald-50/50"
                }`}
                title="ตัวกรองเพิ่มเติม"
              >
                <Filter size={20} />
              </button>

              {(plateNumber || dateFrom || dateTo) && (
                <button
                  onClick={clearFilters}
                  className="p-4 border-2 border-red-200 bg-red-50/70 text-red-600 rounded-2xl hover:bg-red-100 hover:border-red-300 transition-all duration-300 transform hover:scale-110 hover:rotate-90"
                  title="ล้างตัวกรอง"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
          {/* Enhanced Date Filters with Animation */}
          {showFilters && (
            <div className="mt-8 pt-8 border-t border-gray-200/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    จากวันที่
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    max={today}
                    className="w-full px-4 py-3 border-2 border-gray-200/50 rounded-xl focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 outline-none transition-all duration-300 bg-white/70 relative z-10"
                  />
                </div>
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    ถึงวันที่
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    max={today}
                    className="w-full px-4 py-3 border-2 border-gray-200/50 rounded-xl focus:border-teal-400 focus:ring-4 focus:ring-teal-100 outline-none transition-all duration-300 bg-white/70 relative z-10"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Summary Cards with Staggered Animation */}
        {searched && summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card 1 - Total Bills */}
            <div
              className="group relative backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl border border-white/50 p-6 hover:shadow-2xl hover:shadow-blue-200/50 transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
              style={{ animation: "fadeInUp 0.6s ease-out" }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  จำนวนบิลทั้งหมด
                </div>
                <div className="text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {summary.total}
                </div>
                <p className="text-sm text-gray-600 mt-2 font-medium">รายการ</p>
              </div>
            </div>

            {/* Card 2 - Total Weight */}
            <div
              className="group relative backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl border border-white/50 p-6 hover:shadow-2xl hover:shadow-purple-200/50 transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
              style={{
                animation: "fadeInUp 0.6s ease-out 0.15s",
                animationFillMode: "backwards",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-2xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <Weight className="w-7 h-7 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-purple-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  น้ำหนักรวมทั้งหมด
                </div>
                <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {fmt(summary.totalWeight)}
                </div>
                <p className="text-sm text-gray-600 mt-2 font-medium">
                  กิโลกรัม
                </p>
              </div>
            </div>

            {/* Card 3 - Total Amount */}
            <div
              className="group relative backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl border border-white/50 p-6 hover:shadow-2xl hover:shadow-emerald-200/50 transition-all duration-500 transform hover:-translate-y-2 overflow-hidden"
              style={{
                animation: "fadeInUp 0.6s ease-out 0.3s",
                animationFillMode: "backwards",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-2xl transform translate-x-16 -translate-y-16 group-hover:scale-150 transition-transform duration-700"></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    <DollarSign className="w-7 h-7 text-white" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">
                  ยอดเงินรวมทั้งหมด
                </div>
                <div className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {fmt(summary.totalAmount)}
                </div>
                <p className="text-sm text-gray-600 mt-2 font-medium">บาท</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Results Table */}
        {searched && (
          <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            {filteredBills.length === 0 ? (
              <div className="p-20 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                    <Search className="w-12 h-12 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-semibold text-lg">
                    ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                  </p>
                  <p className="text-gray-400">
                    ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองใหม่
                  </p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-slate-100 border-b-2 border-gray-200/50">
                      <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        วันที่/เวลา
                      </th>
                      <th className="px-6 py-5 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                        ทะเบียนรถ
                      </th>
                      <th className="px-6 py-5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        ประเภท
                      </th>
                      <th className="px-6 py-5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        น้ำหนักเข้า
                      </th>
                      <th className="px-6 py-5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        น้ำหนักออก
                      </th>
                      <th className="px-6 py-5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        น้ำหนักสุทธิ
                      </th>
                      <th className="px-6 py-5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        ราคา/กก.
                      </th>
                      <th className="px-6 py-5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        ยอดรวม
                      </th>
                      <th className="px-6 py-5 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBills.map((bill, index) => {
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
                          className="hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/50 transition-all duration-300 group"
                        >
                          <td className="px-6 py-5 text-sm text-gray-600 font-medium">
                            {dayjs(bill.createdAt).format("DD/MM/YY HH:mm")}
                          </td>
                          <td className="px-6 py-5">
                            <span className="font-bold text-gray-800 text-base group-hover:text-emerald-700 transition-colors">
                              {plateNumber}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span
                              className={`inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-full shadow-sm ${
                                bill.description === "ลูกค้ารายใหญ่"
                                  ? "bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200"
                                  : "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border border-emerald-200"
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  bill.description === "ลูกค้ารายใหญ่"
                                    ? "bg-amber-500"
                                    : "bg-emerald-500"
                                } animate-pulse`}
                              ></div>
                              {bill.description}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center text-gray-700 font-semibold">
                            {fmt(bill.weightIn)}
                          </td>
                          <td className="px-6 py-5 text-center text-gray-700 font-semibold">
                            {fmt(bill.weightOut)}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="font-bold text-gray-800 text-base">
                              {fmt(net)}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center text-gray-700 font-semibold">
                            {fmt(bill.price)}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="font-black text-xl bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                              {fmt(total)}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => generatePDF(bill)}
                                className="group/btn relative p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110"
                              >
                                <Printer className="w-5 h-5" />
                                <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap font-medium">
                                  พิมพ์บิล
                                </span>
                              </button>
                              <button
                                onClick={() => generatePDF(bill)}
                                className="group/btn relative p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:-translate-y-1 hover:scale-110"
                              >
                                <Download className="w-5 h-5" />
                                <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity whitespace-nowrap font-medium">
                                  ดาวน์โหลด
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

        {/* Enhanced Empty State */}
        {!searched && (
          <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-2xl border border-white/50 p-20">
            <div className="text-center">
              <div className="relative inline-block mb-8">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30 transform hover:scale-110 transition-transform duration-300">
                  <Search className="w-16 h-16 text-white" />
                </div>
              </div>

              <h3 className="text-3xl font-black bg-gradient-to-r from-gray-800 to-emerald-700 bg-clip-text text-transparent mb-4">
                เริ่มต้นค้นหาข้อมูลของคุณ
              </h3>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed mb-10">
                ใส่ทะเบียนรถหรือเลือกช่วงวันที่ที่ต้องการค้นหา
                แล้วกดปุ่มค้นหาเพื่อดูรายละเอียดบิลอย่างครบถ้วน
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center max-w-3xl mx-auto">
                <div className="group flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-black text-lg">1</span>
                  </div>
                  <span className="font-semibold text-gray-700">
                    ระบุทะเบียนรถ
                  </span>
                </div>

                <div className="hidden sm:block text-gray-300 text-2xl">→</div>

                <div className="group flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-black text-lg">2</span>
                  </div>
                  <span className="font-semibold text-gray-700">
                    เลือกช่วงเวลา
                  </span>
                </div>

                <div className="hidden sm:block text-gray-300 text-2xl">→</div>

                <div className="group flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                    <span className="text-white font-black text-lg">3</span>
                  </div>
                  <span className="font-semibold text-gray-700">กดค้นหา</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animation Keyframes */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default MyTickets;
