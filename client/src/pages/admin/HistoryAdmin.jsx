import React, { useEffect, useState } from "react";
import useEcomStore from "../../store/ecom-store";
import { removeProduct, updateProduct } from "../../api/ticket";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { Printer } from "lucide-react";

const HistoryAdmin = () => {
  const token = useEcomStore((s) => s.token);
  const getProduct = useEcomStore((s) => s.getProduct);
  const products = useEcomStore((s) => s.products);
  const categories = useEcomStore((s) => s.categories);
  const getCategory = useEcomStore((s) => s.getCategory);

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const maxDate = dayjs().format("YYYY-MM-DD");

  // Edit Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    weightIn: 0,
    weightOut: 0,
    price: 0,
  });

  useEffect(() => {
    getProduct(token, 1000);
    getCategory(token);
  }, []);

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const applyFilters = () => {
    let filtered = [...products];

    if (q.trim()) {
      filtered = filtered.filter((product) => {
        const plateNumber = product.title?.split(" - ")[0] || product.title;
        return plateNumber.toLowerCase().includes(q.toLowerCase());
      });
    }

    if (dateFrom) {
      const fromDate = dayjs(dateFrom).startOf("day");
      filtered = filtered.filter(
        (product) =>
          dayjs(product.createdAt).isAfter(fromDate) ||
          dayjs(product.createdAt).isSame(fromDate)
      );
    }

    if (dateTo) {
      const toDate = dayjs(dateTo).endOf("day");
      filtered = filtered.filter(
        (product) =>
          dayjs(product.createdAt).isBefore(toDate) ||
          dayjs(product.createdAt).isSame(toDate)
      );
    }

    if (customerTypeFilter !== "all") {
      filtered = filtered.filter((product) => {
        if (customerTypeFilter === "large") {
          return product.description === "ลูกค้ารายใหญ่";
        } else {
          return product.description === "ลูกค้ารายย่อย";
        }
      });
    }

    setFilteredProducts(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [q, dateFrom, dateTo, customerTypeFilter, products]);

  const clearFilters = () => {
    setQ("");
    setDateFrom("");
    setDateTo("");
    setCustomerTypeFilter("all");
    setShowFilters(false);
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

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditForm({
      title: item.title || "",
      description: item.description || "",
      weightIn: item.weightIn || 0,
      weightOut: item.weightOut || 0,
      price: item.price || 0,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      setLoadingId(editingItem.id);
      await updateProduct(token, editingItem.id, editForm);
      toast.success("แก้ไขข้อมูลสำเร็จ");
      await getProduct(token, 1000);
      setShowEditModal(false);
      setEditingItem(null);
    } catch (err) {
      console.log(err);
      toast.error("แก้ไขข้อมูลไม่สำเร็จ");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`ลบบิล "${title}"?`)) return;
    try {
      setLoadingId(id);
      await removeProduct(token, id);
      toast.success("ลบบิลสำเร็จ");
      await getProduct(token, 1000);
    } catch (err) {
      console.log(err);
      toast.error("ลบไม่สำเร็จ");
    } finally {
      setLoadingId(null);
    }
  };

  const fmt = (n) =>
    Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

  const summary = {
    total: filteredProducts.length,
    totalAmount: filteredProducts.reduce((sum, product) => {
      const net = Math.max(
        (product.weightIn || 0) - (product.weightOut || 0),
        0
      );
      return sum + product.price * net;
    }, 0),
    totalWeight: filteredProducts.reduce((sum, product) => {
      return (
        sum + Math.max((product.weightIn || 0) - (product.weightOut || 0), 0)
      );
    }, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <svg
                className="w-8 h-8 text-white"
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
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                ประวัติบิลย้อนหลัง
              </h1>
              <p className="text-gray-600 mt-1">ดูและจัดการบิลทั้งหมดของคุณ</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium border border-gray-200"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span>{showFilters ? "ซ่อนตัวกรอง" : "แสดงตัวกรอง"}</span>
          </button>
        </div>

        {showFilters && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ค้นหาทะเบียนรถ
                </label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="พิมพ์ทะเบียนรถ..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภทลูกค้า
                </label>
                <select
                  value={customerTypeFilter}
                  onChange={(e) => setCustomerTypeFilter(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 bg-white cursor-pointer transition-all duration-200"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="large">ลูกค้ารายใหญ่</option>
                  <option value="retail">ลูกค้ารายย่อย</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  จากวันที่
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  max={maxDate}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all duration-200"
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
                  max={maxDate}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                ล้างตัวกรอง
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
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

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
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

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
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

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <th className="px-4 py-4 text-center text-sm font-semibold text-gray-700">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((item) => {
                  const net = Math.max(
                    (item.weightIn || 0) - (item.weightOut || 0),
                    0
                  );
                  const total = item.price * net;
                  const plateNumber = item.title?.split(" - ")[0] || item.title;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-4 py-4 text-sm text-gray-600">
                        {dayjs(item.createdAt).format("DD/MM/YY HH:mm")}
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-gray-800">
                          {plateNumber}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                            item.description === "ลูกค้ารายใหญ่"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {item.description}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700">
                        {fmt(item.weightIn)}
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700">
                        {fmt(item.weightOut)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-semibold text-gray-800">
                          {fmt(net)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-gray-700">
                        {fmt(item.price)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-lg text-emerald-600">
                          {fmt(total)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => generatePDF(item)}
                            className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 shadow-md"
                            title="พิมพ์บิล"
                          >
                            <Printer className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors duration-200 shadow-md"
                            title="แก้ไข"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.title)}
                            disabled={loadingId === item.id}
                            className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 shadow-md disabled:opacity-50"
                            title="ลบ"
                          >
                            {loadingId === item.id ? (
                              <svg
                                className="animate-spin h-5 w-5"
                                viewBox="0 0 24 24"
                              >
                                <circle
                                  className="opacity-25"
                                  cx="12"
                                  cy="12"
                                  r="10"
                                  stroke="currentColor"
                                  strokeWidth="4"
                                  fill="none"
                                />
                                <path
                                  className="opacity-75"
                                  fill="currentColor"
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-400"
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
                        <p className="text-gray-500 font-medium">
                          ไม่พบข้อมูลบิลตามเงื่อนไขที่เลือก
                        </p>
                        <p className="text-gray-400 text-sm">
                          ลองปรับเปลี่ยนตัวกรองหรือเพิ่มบิลใหม่
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">
                แก้ไขข้อมูลบิล
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ทะเบียนรถ
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ประเภทลูกค้า
                </label>
                <select
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 bg-white cursor-pointer transition-all duration-200"
                >
                  <option value="ลูกค้ารายใหญ่">ลูกค้ารายใหญ่</option>
                  <option value="ลูกค้ารายย่อย">ลูกค้ารายย่อย</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    น้ำหนักเข้า (กก.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.weightIn}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        weightIn: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    น้ำหนักออก (กก.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.weightOut}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        weightOut: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ราคาต่อกิโลกรัม (บาท)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">น้ำหนักสุทธิ:</span>
                  <span className="font-semibold text-gray-800">
                    {fmt(
                      Math.max(
                        (editForm.weightIn || 0) - (editForm.weightOut || 0),
                        0
                      )
                    )}{" "}
                    กก.
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">จำนวนเงินรวม:</span>
                  <span className="font-bold text-lg text-emerald-600">
                    {fmt(
                      Math.max(
                        (editForm.weightIn || 0) - (editForm.weightOut || 0),
                        0
                      ) * (editForm.price || 0)
                    )}{" "}
                    บาท
                  </span>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loadingId === editingItem?.id}
                className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loadingId === editingItem?.id ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>กำลังบันทึก...</span>
                  </>
                ) : (
                  <span>บันทึกการแก้ไข</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryAdmin;
