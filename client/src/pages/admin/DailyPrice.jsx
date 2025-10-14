import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import useEcomStore from "../../store/ecom-store";
import { toast } from "react-toastify";
import {
  getPriceToday,
  getPriceRange,
  refreshPrice,
  upsertPriceManual,
} from "../../api/palmPrice";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  RefreshCw,
  Save,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

const Num = ({ v }) => <span>{Number(v || 0).toFixed(2)}</span>;

const DailyPrice = () => {
  const token = useEcomStore((s) => s.token);
  const [today, setToday] = useState(null);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    priceMin: "",
    priceAvg: "",
    priceMax: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const t = await getPriceToday();
      setToday(t?.data || null);

      const from = dayjs().subtract(29, "day").format("YYYY-MM-DD");
      const to = dayjs().format("YYYY-MM-DD");
      const r = await getPriceRange(from, to);
      setRows(Array.isArray(r?.data) ? r.data : []);

      if (t?.data) {
        setForm({
          date: dayjs(t.data.date).format("YYYY-MM-DD"),
          priceMin: t.data.priceMin,
          priceAvg: t.data.priceAvg,
          priceMax: t.data.priceMax,
          note: "",
        });
      }
    } catch (e) {
      console.log(e);
      setRows([]);
      setToday(null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const chartData = useMemo(() => {
    const asc = [...rows].sort((a, b) => new Date(a.date) - new Date(b.date));
    return asc.map((d) => ({
      date: dayjs(d.date).format("DD/MM"),
      avg: Number(d.priceAvg || 0),
      min: Number(d.priceMin || 0),
      max: Number(d.priceMax || 0),
    }));
  }, [rows]);

  const stat30 = useMemo(() => {
    if (!rows.length) return { avg: 0, min: 0, max: 0, count: 0 };
    const avg =
      rows.reduce((s, r) => s + Number(r.priceAvg || 0), 0) / rows.length;
    const min = Math.min(...rows.map((r) => Number(r.priceMin || Infinity)));
    const max = Math.max(...rows.map((r) => Number(r.priceMax || 0)));
    return { avg, min, max, count: rows.length };
  }, [rows]);

  const lastUpdate =
    today?.fetchedAt && dayjs(today.fetchedAt).format("DD/MM/YYYY HH:mm");

  const pullFromSource = async () => {
    try {
      setLoading(true);
      await refreshPrice(token);
      toast.success("อัปเดตราคาจากแหล่งภายนอกสำเร็จ");
      await loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || "ดึงข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const saveManual = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const payload = {
        ...form,
        priceMin: +form.priceMin,
        priceAvg: +form.priceAvg,
        priceMax: +form.priceMax,
      };
      await upsertPriceManual(token, payload);
      toast.success("บันทึกราคาวันนี้สำเร็จ");
      await loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const priceChange = useMemo(() => {
    if (rows.length < 2) return 0;
    const sorted = [...rows].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    const todayPrice = Number(sorted[0]?.priceAvg || 0);
    const yesterdayPrice = Number(sorted[1]?.priceAvg || 0);
    return todayPrice - yesterdayPrice;
  }, [rows]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-800">
              จัดการราคาปาล์มรายวัน
            </h1>
            <p className="text-gray-600 mt-1">
              ติดตามและอัปเดตราคาปาล์มนํ้ามัน
            </p>
          </div>
        </div>

        {/* Today's Price Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                  priceChange >= 0
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {priceChange >= 0 ? (
                  <ArrowUpRight size={14} />
                ) : (
                  <ArrowDownRight size={14} />
                )}
                {Math.abs(priceChange).toFixed(2)}
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              ราคาเฉลี่ย (วันนี้)
            </div>
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              <Num v={today?.priceAvg} />
            </div>
            <div className="text-sm text-gray-500">บาท/กก.</div>
            <div className="text-xs text-gray-400 mt-3">
              อัปเดต: {lastUpdate || "-"}
            </div>
            {today?.sourceUrl && (
              <a
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 mt-2"
                href={today.sourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={12} />
                {today.sourceName || "แหล่งข้อมูล"}
              </a>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              ราคาต่ำสุด (วันนี้)
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">
              <Num v={today?.priceMin} />
            </div>
            <div className="text-sm text-gray-500">บาท/กก.</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              ราคาสูงสุด (วันนี้)
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">
              <Num v={today?.priceMax} />
            </div>
            <div className="text-sm text-gray-500">บาท/กก.</div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-md">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-2">จำนวนข้อมูล</div>
            <div className="text-3xl font-bold text-gray-800 mb-2">
              {stat30.count}
            </div>
            <div className="text-sm text-gray-500">วันย้อนหลัง</div>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Save className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              บันทึกราคาปาล์ม
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่
              </label>
              <input
                type="date"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                value={form.date}
                onChange={(e) =>
                  setForm((s) => ({ ...s, date: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ราคาต่ำสุด (บาท/กก.)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                value={form.priceMin}
                onChange={(e) =>
                  setForm((s) => ({ ...s, priceMin: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ราคาเฉลี่ย (บาท/กก.)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                value={form.priceAvg}
                onChange={(e) =>
                  setForm((s) => ({ ...s, priceAvg: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ราคาสูงสุด (บาท/กก.)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                value={form.priceMax}
                onChange={(e) =>
                  setForm((s) => ({ ...s, priceMax: e.target.value }))
                }
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                หมายเหตุ
              </label>
              <input
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                value={form.note}
                onChange={(e) =>
                  setForm((s) => ({ ...s, note: e.target.value }))
                }
                placeholder="บันทึกเพิ่มเติม..."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={pullFromSource}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-3.5 font-medium text-white shadow-lg transition-all duration-200 hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 sm:min-w-[220px]"
            >
              <RefreshCw
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
              ดึงราคา
            </button>

            <button
              type="submit"
              onClick={saveManual}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3.5 font-medium text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 sm:min-w-[180px]"
            >
              <Save className="w-5 h-5" />
              บันทึกข้อมูล
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              กราฟแนวโน้มราคา 30 วันล่าสุด
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
              />
              <YAxis
                domain={[
                  (dataMin) => Math.floor((dataMin - 0.2) * 100) / 100,
                  (dataMax) => Math.ceil((dataMax + 0.2) * 100) / 100,
                ]}
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
              />
              <Tooltip
                formatter={(v) => Number(v).toFixed(2) + " บาท/กก."}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="avg"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: "#10b981", r: 4 }}
                name="ราคาเฉลี่ย"
              />
              <Line
                type="monotone"
                dataKey="min"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={{ fill: "#3b82f6", r: 3 }}
                name="ราคาต่ำสุด"
              />
              <Line
                type="monotone"
                dataKey="max"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={{ fill: "#f59e0b", r: 3 }}
                name="ราคาสูงสุด"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Statistics */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            สถิติย้อนหลัง 30 วัน
          </h2>
          <div className="grid sm:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl">
              <div className="text-sm text-gray-600 mb-2">ราคาเฉลี่ย</div>
              <div className="text-2xl font-bold text-emerald-600">
                <Num v={stat30.avg} />
              </div>
              <div className="text-xs text-gray-500 mt-1">บาท/กก.</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <div className="text-sm text-gray-600 mb-2">ราคาต่ำสุด</div>
              <div className="text-2xl font-bold text-blue-600">
                <Num v={stat30.min} />
              </div>
              <div className="text-xs text-gray-500 mt-1">บาท/กก.</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl">
              <div className="text-sm text-gray-600 mb-2">ราคาสูงสุด</div>
              <div className="text-2xl font-bold text-amber-600">
                <Num v={stat30.max} />
              </div>
              <div className="text-xs text-gray-500 mt-1">บาท/กก.</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <div className="text-sm text-gray-600 mb-2">จำนวนข้อมูล</div>
              <div className="text-2xl font-bold text-purple-600">
                {stat30.count}
              </div>
              <div className="text-xs text-gray-500 mt-1">วัน</div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    วันที่
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    ราคาต่ำสุด
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    ราคาสูงสุด
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                    ราคาเฉลี่ย
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 text-sm text-gray-800">
                      <div className="font-medium">
                        {dayjs(r.date).format("DD/MM/YYYY")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {dayjs(r.date).format("dddd")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">
                      <Num v={r.priceMin} />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-700">
                      <Num v={r.priceMax} />
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className="font-semibold text-emerald-600">
                        <Num v={r.priceAvg} />
                      </span>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">
                          ไม่มีข้อมูลย้อนหลัง
                        </p>
                        <p className="text-gray-400 text-sm">
                          เริ่มต้นโดยการดึงข้อมูลหรือบันทึกราคาใหม่
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

export default DailyPrice;
