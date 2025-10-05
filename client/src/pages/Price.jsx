import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { getPriceToday, getPriceRange } from "../api/palmPrice";
import { TrendingUp, TrendingDown, Calendar, ExternalLink } from "lucide-react";

const Num = ({ v }) => <span>{Number(v || 0).toFixed(2)}</span>;

const Price = () => {
  const [today, setToday] = useState(null);
  const [rows, setRows] = useState([]);
  const [range, setRange] = useState({
    from: dayjs().subtract(29, "day").format("YYYY-MM-DD"),
    to: dayjs().format("YYYY-MM-DD"),
  });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [t, r] = await Promise.all([
        getPriceToday(),
        getPriceRange(range.from, range.to),
      ]);
      setToday(t?.data || null);
      setRows(r?.data || []);
    } catch (e) {
      console.log(e);
      setToday(null);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onQuery = async (e) => {
    e.preventDefault();
    load();
  };

  const lastUpdate = today?.fetchedAt
    ? dayjs(today.fetchedAt).format("DD/MM/YYYY HH:mm")
    : "-";

  // คำนวณการเปลี่ยนแปลง
  const getPriceChange = () => {
    if (rows.length < 2) return null;
    const latest = rows[0]?.priceAvg || 0;
    const previous = rows[1]?.priceAvg || 0;
    const change = latest - previous;
    const percent = previous !== 0 ? ((change / previous) * 100).toFixed(2) : 0;
    return { change: change.toFixed(2), percent, isUp: change >= 0 };
  };

  const priceChange = getPriceChange();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8">
      <div className="mx-auto max-w-screen-xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">ราคาปาล์มน้ำมัน</h1>
          <p className="mt-2 text-gray-600">
            ข้อมูลราคาปาล์มน้ำมันอัปเดตทุกวัน
          </p>
        </div>

        {/* สรุปราคาวันนี้ */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* ราคาเฉลี่ย */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-xl transition-all hover:shadow-2xl">
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10"></div>
            <div className="relative">
              <div className="mb-2 text-sm font-medium text-emerald-100">
                ราคาเฉลี่ย
              </div>
              <div className="mb-3 text-3xl font-bold text-white">
                <Num v={today?.priceAvg} />{" "}
                <span className="text-xl">฿/กก.</span>
              </div>
              {priceChange && (
                <div
                  className={`flex items-center gap-1 text-sm ${
                    priceChange.isUp ? "text-emerald-100" : "text-red-100"
                  }`}
                >
                  {priceChange.isUp ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span>
                    {priceChange.isUp ? "+" : ""}
                    {priceChange.change} ({priceChange.isUp ? "+" : ""}
                    {priceChange.percent}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ราคาต่ำสุด */}
          <div className="rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl">
            <div className="mb-2 text-sm font-medium text-gray-500">
              ราคาต่ำสุด
            </div>
            <div className="text-3xl font-bold text-gray-900">
              <Num v={today?.priceMin} />{" "}
              <span className="text-xl text-gray-600">฿/กก.</span>
            </div>
          </div>

          {/* ราคาสูงสุด */}
          <div className="rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl">
            <div className="mb-2 text-sm font-medium text-gray-500">
              ราคาสูงสุด
            </div>
            <div className="text-3xl font-bold text-gray-900">
              <Num v={today?.priceMax} />{" "}
              <span className="text-xl text-gray-600">฿/กก.</span>
            </div>
          </div>

          {/* อัปเดตล่าสุด */}
          <div className="rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-500">
              <Calendar className="h-4 w-4" />
              อัปเดตล่าสุด
            </div>
            <div className="mb-2 text-xl font-semibold text-gray-900">
              {lastUpdate}
            </div>
            {today?.sourceUrl && (
              <a
                className="flex items-center gap-1 text-xs text-emerald-600 transition-colors hover:text-emerald-700 hover:underline"
                href={today.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3 w-3" />
                {today.sourceName || "แหล่งข้อมูล"}
              </a>
            )}
            {!today && (
              <div className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                ยังไม่มีข้อมูลของวันนี้
              </div>
            )}
          </div>
        </div>

        {/* เลือกช่วงเวลา */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            เลือกช่วงเวลา
          </h2>
          <form onSubmit={onQuery} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                จากวันที่
              </label>
              <input
                type="date"
                value={range.from}
                onChange={(e) =>
                  setRange((s) => ({ ...s, from: e.target.value }))
                }
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                ถึงวันที่
              </label>
              <input
                type="date"
                value={range.to}
                onChange={(e) =>
                  setRange((s) => ({ ...s, to: e.target.value }))
                }
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-2.5 outline-none transition-all focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 font-semibold text-white shadow-lg shadow-emerald-200 transition-all hover:shadow-xl hover:shadow-emerald-300 disabled:opacity-60"
            >
              แสดงผล
            </button>
          </form>
        </div>

        {/* ตารางย้อนหลัง */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">ประวัติราคา</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
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
                {rows.map((r, idx) => (
                  <tr
                    key={idx}
                    className="transition-colors hover:bg-emerald-50"
                  >
                    <td className="px-6 py-4 text-gray-900">
                      {dayjs(r.date).format("DD/MM/YYYY")}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-700">
                      <Num v={r.priceMin} />
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-700">
                      <Num v={r.priceMax} />
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-emerald-600">
                      <Num v={r.priceAvg} />
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-gray-500"
                      colSpan={4}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="h-12 w-12 text-gray-300" />
                        <p>ไม่มีข้อมูลในช่วงที่เลือก</p>
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

export default Price;
