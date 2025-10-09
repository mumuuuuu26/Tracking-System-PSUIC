import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  X,
  Receipt,
  TrendingUp,
  Calendar,
  Package,
} from "lucide-react";
import useEcomStore from "../../store/ecom-store";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import palmBg from "../../assets/palm2.jpg";

const fmt = (n) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const SearchBills = () => {
  const token = useEcomStore((s) => s.token);
  const products = useEcomStore((s) => s.products);
  const categories = useEcomStore((s) => s.categories);
  const getProduct = useEcomStore((s) => s.getProduct);
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

  // คำนวณสถิติ
  const summary = searched
    ? {
        total: filteredBills.length,
        totalWeight: filteredBills.reduce((sum, p) => {
          const net = Math.max((p.weightIn || 0) - (p.weightOut || 0), 0);
          return sum + net;
        }, 0),
        totalAmount: filteredBills.reduce((sum, p) => {
          const net = Math.max((p.weightIn || 0) - (p.weightOut || 0), 0);
          return sum + p.price * net;
        }, 0),
      }
    : null;

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed relative"
      style={{ backgroundImage: `url(${palmBg})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/60 via-teal-900/50 to-cyan-900/60 backdrop-blur-[2px]"></div>

      <div className="relative z-10 px-4 py-8">
        {/* Header Section */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-2xl mb-6">
              <Search className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">
              ค้นหาบิลการซื้อขาย
            </h1>
            <p className="text-xl text-emerald-100">
              ค้นหาประวัติการซื้อขายปาล์มน้ำมันได้ง่ายๆ
            </p>
          </div>

          {/* Search Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="พิมพ์ทะเบียนรถ เช่น 1234"
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-2xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200 outline-none transition-all text-lg shadow-sm"
                />
              </div>

              <div className="flex items-end gap-3">
                <button
                  onClick={handleSearch}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl hover:from-emerald-600 hover:to-teal-700 flex items-center gap-2 font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  <Search size={22} />
                  ค้นหา
                </button>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-4 border-2 rounded-2xl transition-all shadow-md ${
                    showFilters
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-300 bg-white hover:bg-gray-50"
                  }`}
                >
                  <Filter size={22} />
                </button>

                {(plateNumber || dateFrom || dateTo) && (
                  <button
                    onClick={clearFilters}
                    className="p-4 border-2 border-red-300 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all shadow-md"
                  >
                    <X size={22} />
                  </button>
                )}
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="pt-6 border-t-2 border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📅 จากวันที่
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200 outline-none shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      📅 ถึงวันที่
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200 outline-none shadow-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats - แสดงเฉพาะเมื่อค้นหาแล้ว */}
        {searched && summary && (
          <div className="max-w-6xl mx-auto mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 transform hover:scale-105 transition-all">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                    <Receipt className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      จำนวนบิล
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {summary.total}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">รายการทั้งหมด</p>
              </div>

              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-white/20 transform hover:scale-105 transition-all">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-medium">
                      น้ำหนักรวม
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {fmt(summary.totalWeight)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">กิโลกรัม</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 border border-white/20 transform hover:scale-105 transition-all">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/90 font-medium">
                      ยอดเงินรวม
                    </p>
                    <p className="text-3xl font-bold text-white">
                      {fmt(summary.totalAmount)}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-white/80">บาท</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        {searched && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/20">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Receipt className="w-6 h-6" />
                  ผลการค้นหา ({filteredBills.length} รายการ)
                </h2>
              </div>

              {filteredBills.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Search size={48} className="text-gray-300" />
                  </div>
                  <p className="text-xl font-semibold text-gray-600 mb-2">
                    ไม่พบข้อมูล
                  </p>
                  <p className="text-gray-400">
                    ลองค้นหาด้วยคำอื่น หรือปรับเปลี่ยนตัวกรอง
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                          วันที่/เวลา
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">
                          ทะเบียนรถ
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                          ประเภทลูกค้า
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                          น้ำหนักสุทธิ (กก.)
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                          ราคา/กก. (฿)
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                          ยอดรวม (฿)
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
                            className="hover:bg-emerald-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <Calendar size={16} className="text-gray-400" />
                                {dayjs(bill.createdAt).format("DD/MM/YYYY")}
                                <span className="text-gray-500">
                                  {dayjs(bill.createdAt).format("HH:mm")} น.
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-gray-900 text-lg">
                                {plateNumber}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span
                                className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold shadow-sm ${
                                  bill.description === "ลูกค้ารายใหญ่"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {bill.description}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center font-semibold text-gray-800">
                              {fmt(net)}
                            </td>
                            <td className="px-6 py-4 text-center font-semibold text-gray-800">
                              {fmt(bill.price)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-xl font-bold text-emerald-600">
                                {fmt(total)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchBills;
