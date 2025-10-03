import React, { useEffect, useState } from "react";
import useEcomStore from "../../store/ecom-store";
import { removeProduct } from "../../api/product";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const HistoryAdmin = () => {
  const token = useEcomStore((s) => s.token);
  const getProduct = useEcomStore((s) => s.getProduct);
  const products = useEcomStore((s) => s.products);

  const [filteredProducts, setFilteredProducts] = useState([]);
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [customerTypeFilter, setCustomerTypeFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    getProduct(token, 100);
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

  const handleDelete = async (id, title) => {
    if (!window.confirm(`ลบบิล "${title}"?`)) return;
    try {
      setLoadingId(id);
      await removeProduct(token, id);
      toast.success("ลบบิลสำเร็จ");
      await getProduct(token, 100);
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
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    วันที่
                  </th>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-700">
                    ทะเบียน
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
                    จำนวนเงิน
                  </th>
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
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleDelete(item.id, item.title)}
                            disabled={loadingId === item.id}
                            className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 shadow-md disabled:opacity-50"
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
    </div>
  );
};

export default HistoryAdmin;
