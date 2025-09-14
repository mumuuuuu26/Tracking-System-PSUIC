import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { getPriceToday, getPriceRange } from "../api/palmPrice";

const Num = ({ v }) => <span>{Number(v || 0).toFixed(2)}</span>;

const Price = () => {
  const [today, setToday] = useState(null);
  const [rows, setRows] = useState([]);
  const [range, setRange] = useState({
    from: dayjs().subtract(29, "day").format("YYYY-MM-DD"),
    to: dayjs().format("YYYY-MM-DD"),
  });

  const load = async () => {
    try {
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

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">ราคาปาล์มน้ำมัน</h1>

      {/* สรุปราคาวันนี้ */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white shadow">
          <div className="text-gray-500">ราคาเฉลี่ย</div>
          <div className="text-2xl font-bold text-emerald-600">
            <Num v={today?.priceAvg} /> บาท/กก.
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white shadow">
          <div className="text-gray-500">ราคาต่ำสุด</div>
          <div className="text-2xl font-bold">
            <Num v={today?.priceMin} /> บาท/กก.
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white shadow">
          <div className="text-gray-500">ราคาสูงสุด</div>
          <div className="text-2xl font-bold">
            <Num v={today?.priceMax} /> บาท/กก.
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white shadow">
          <div className="text-gray-500">อัปเดตล่าสุด</div>
          <div className="text-xl font-semibold">{lastUpdate}</div>
          {today?.sourceUrl && (
            <a
              className="text-xs text-blue-600 underline"
              href={today.sourceUrl}
              target="_blank"
            >
              แหล่งข้อมูล: {today.sourceName || "external"}
            </a>
          )}
          {!today && (
            <div className="text-sm text-red-600 mt-1">
              ยังไม่มีข้อมูลของวันนี้
            </div>
          )}
        </div>
      </div>

      {/* เลือกช่วงเวลา */}
      <form onSubmit={onQuery} className="flex items-end gap-3 mb-3">
        <div>
          <label className="block text-sm text-gray-600">จากวันที่</label>
          <input
            type="date"
            value={range.from}
            onChange={(e) => setRange((s) => ({ ...s, from: e.target.value }))}
            className="border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600">ถึงวันที่</label>
          <input
            type="date"
            value={range.to}
            onChange={(e) => setRange((s) => ({ ...s, to: e.target.value }))}
            className="border rounded px-2 py-1"
          />
        </div>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded">
          แสดงผล
        </button>
      </form>

      {/* ตารางย้อนหลัง */}
      <div className="overflow-x-auto bg-white shadow rounded-xl">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">วันที่</th>
              <th className="p-3 text-center">ราคาต่ำสุด</th>
              <th className="p-3 text-center">ราคาสูงสุด</th>
              <th className="p-3 text-center">ราคาเฉลี่ย</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-3">{dayjs(r.date).format("DD/MM/YYYY")}</td>
                <td className="p-3 text-center">
                  <Num v={r.priceMin} />
                </td>
                <td className="p-3 text-center">
                  <Num v={r.priceMax} />
                </td>
                <td className="p-3 text-center">
                  <Num v={r.priceAvg} />
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="p-3" colSpan={4}>
                  ไม่มีข้อมูลในช่วงที่เลือก
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Price;
