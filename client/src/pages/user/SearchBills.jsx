import React, { useState, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";
import useEcomStore from "../../store/ecom-store";
import { toast } from "react-toastify";
import dayjs from "dayjs";

const fmt = (n) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const SearchBills = () => {
  const token = useEcomStore((s) => s.token);
  const products = useEcomStore((s) => s.products);
  const getProduct = useEcomStore((s) => s.getProduct);

  const [plateNumber, setPlateNumber] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filteredBills, setFilteredBills] = useState([]);
  const [searched, setSearched] = useState(false); // แสดงผลเฉพาะหลังจากค้นหา

  useEffect(() => {
    getProduct(token, 1000);
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

  return (
    <div className="min-h-screen bg-white px-4 py-6">
      {/* 🔍 Search Bar */}
      <div className="max-w-5xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <input
            type="text"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="ค้นหาทะเบียนรถ เช่น 1234"
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 flex items-center gap-2 font-semibold shadow transition-all"
            >
              <Search size={20} />
              ค้นหา
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-3 border-2 rounded-xl transition-all ${
                showFilters
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-gray-300 hover:bg-gray-100"
              }`}
            >
              <Filter size={20} />
            </button>

            {(plateNumber || dateFrom || dateTo) && (
              <button
                onClick={clearFilters}
                className="p-3 border-2 border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-all"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* ตัวกรองเพิ่มเติม — เหลือเฉพาะวันที่ */}
        {showFilters && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                จากวันที่
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-2">
                ถึงวันที่
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* 📋 แสดงผลเฉพาะเมื่อกดค้นหา */}
      {searched && (
        <div className="max-w-5xl mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            ผลการค้นหา ({filteredBills.length} รายการ)
          </h2>

          {filteredBills.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              ไม่มีข้อมูลที่ตรงกับเงื่อนไขการค้นหา
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">วันที่</th>
                    <th className="p-3 text-left">ทะเบียนรถ</th>
                    <th className="p-3 text-center">ประเภทลูกค้า</th>
                    <th className="p-3 text-center">น้ำหนักสุทธิ (กก.)</th>
                    <th className="p-3 text-center">ราคา/กก. (฿)</th>
                    <th className="p-3 text-center">ยอดรวม (฿)</th>
                  </tr>
                </thead>
                <tbody>
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
                        className="border-t hover:bg-gray-50 transition"
                      >
                        <td className="p-3 text-gray-700 text-sm">
                          {dayjs(bill.createdAt).format("DD/MM/YYYY HH:mm")} น.
                        </td>
                        <td className="p-3 font-medium text-gray-800">
                          {plateNumber}
                        </td>
                        <td className="p-3 text-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              bill.description === "ลูกค้ารายใหญ่"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {bill.description}
                          </span>
                        </td>
                        <td className="p-3 text-center">{fmt(net)}</td>
                        <td className="p-3 text-center">{fmt(bill.price)}</td>
                        <td className="p-3 text-center font-semibold text-emerald-600">
                          {fmt(total)}
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
    </div>
  );
};

export default SearchBills;
