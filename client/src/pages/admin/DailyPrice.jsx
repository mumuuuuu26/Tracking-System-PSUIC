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

// Recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const Num = ({ v }) => <span>{Number(v || 0).toFixed(2)}</span>;

const DailyPrice = () => {
  const token = useEcomStore((s) => s.token);

  // สรุป "วันนี้"
  const [today, setToday] = useState(null);

  // ย้อนหลัง 30 วัน
  const [rows, setRows] = useState([]);

  // ฟอร์มบันทึกด้วยมือ/ปรับแก้
  const [form, setForm] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    priceMin: "",
    priceAvg: "",
    priceMax: "",
    note: "",
  });

  // โหลดข้อมูลวันนี้ + 30 วันล่าสุดจาก DB ของเราเอง
  const loadData = async () => {
    try {
      const t = await getPriceToday(); // อาจ 204 ไม่มีข้อมูล
      setToday(t?.data || null);

      const from = dayjs().subtract(29, "day").format("YYYY-MM-DD");
      const to = dayjs().format("YYYY-MM-DD");
      const r = await getPriceRange(from, to);
      setRows(Array.isArray(r?.data) ? r.data : []);

      // sync ค่า form จาก "วันนี้" ถ้ามี
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

  // เรียงข้อมูล 30 วัน “จากเก่า → ใหม่” สำหรับกราฟให้เส้นพุ่งไปขวา
  const chartData = useMemo(() => {
    const asc = [...rows].sort((a, b) => new Date(a.date) - new Date(b.date));
    return asc.map((d) => ({
      date: dayjs(d.date).format("DD/MM"),
      avg: Number(d.priceAvg || 0),
      min: Number(d.priceMin || 0),
      max: Number(d.priceMax || 0),
    }));
  }, [rows]);

  // สถิติช่วง 30 วัน (เอาไว้แสดงการ์ดสรุปบนหัว)
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
      await refreshPrice(token);
      toast.success("อัปเดตราคาจากแหล่งภายนอกสำเร็จ");
      await loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || "ดึงข้อมูลไม่สำเร็จ");
    }
  };

  const saveManual = async (e) => {
    e.preventDefault();
    try {
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
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-bold">จัดการราคาปาล์มรายวัน</h1>

      {/* การ์ดสรุปวันนี้ */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="p-4 bg-white rounded-xl shadow">
          <div className="text-gray-500">ราคาเฉลี่ย (วันนี้)</div>
          <div className="text-2xl font-bold text-emerald-600">
            <Num v={today?.priceAvg} /> บาท/กก.
          </div>
          <div className="text-xs text-gray-500 mt-1">
            อัปเดต: {lastUpdate || "-"}
          </div>
          {today?.sourceUrl && (
            <a
              className="text-xs text-blue-600 underline"
              href={today.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              แหล่งข้อมูล: {today.sourceName || "external"}
            </a>
          )}
        </div>
        <div className="p-4 bg-white rounded-xl shadow">
          <div className="text-gray-500">ต่ำสุด (วันนี้)</div>
          <div className="text-2xl font-bold">
            <Num v={today?.priceMin} /> บาท/กก.
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl shadow">
          <div className="text-gray-500">สูงสุด (วันนี้)</div>
          <div className="text-2xl font-bold">
            <Num v={today?.priceMax} /> บาท/กก.
          </div>
        </div>
        <div className="p-4 bg-white rounded-xl shadow">
          <div className="text-gray-500">จำนวนข้อมูล (ย้อนหลัง)</div>
          <div className="text-2xl font-bold">{stat30.count} วัน</div>
        </div>
      </div>

      {/* ปุ่มดึง/ฟอร์มบันทึกด้วยมือ (เวอร์ชันปรับดีไซน์) */}
      <div className="bg-white p-5 rounded-xl shadow">
        <form onSubmit={saveManual} className="grid gap-4">
          {/* ช่องกรอกเรียงเป็นกริด */}
          <div className="grid gap-4 sm:grid-cols-5">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                วันที่
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.date}
                onChange={(e) =>
                  setForm((s) => ({ ...s, date: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                ต่ำสุด
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.priceMin}
                onChange={(e) =>
                  setForm((s) => ({ ...s, priceMin: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                เฉลี่ย
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.priceAvg}
                onChange={(e) =>
                  setForm((s) => ({ ...s, priceAvg: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                สูงสุด
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.priceMax}
                onChange={(e) =>
                  setForm((s) => ({ ...s, priceMax: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                หมายเหตุ
              </label>
              <input
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                value={form.note}
                onChange={(e) =>
                  setForm((s) => ({ ...s, note: e.target.value }))
                }
              />
            </div>
          </div>

          {/* แถบปุ่มด้านล่าง */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={pullFromSource}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:min-w-[220px]"
            >
              Fetch Price
            </button>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:min-w-[180px]"
            >
              Save
            </button>
          </div>
        </form>
      </div>

      {/* กราฟแนวโน้ม 30 วัน */}
      <div className="bg-white p-4 rounded-xl shadow">
        <h2 className="font-semibold mb-3">กราฟแสดงราคาปาล์ม 30 วันล่าสุด</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis
              domain={[
                (dataMin) => Math.floor((dataMin - 0.2) * 100) / 100,
                (dataMax) => Math.ceil((dataMax + 0.2) * 100) / 100,
              ]}
            />
            <Tooltip formatter={(v) => Number(v).toFixed(2) + " บาท/กก."} />
            {/* เส้นหลัก: ราคาเฉลี่ย */}
            <Line type="monotone" dataKey="avg" dot={true} />
            {/* ถ้าต้องการแสดงเส้นต่ำสุด/สูงสุด ให้เอาคอมเมนต์ออก */}
            {/* <Line type="monotone" dataKey="min" strokeDasharray="4 2" /> */}
            {/* <Line type="monotone" dataKey="max" strokeDasharray="4 2" /> */}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ตารางย้อนหลัง 30 วัน */}
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="grid sm:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-gray-500">เฉลี่ยย้อนหลัง (30 วัน)</div>
            <div className="text-xl font-bold text-emerald-600">
              <Num v={stat30.avg} /> บาท/กก.
            </div>
          </div>
          <div>
            <div className="text-gray-500">ต่ำสุดย้อนหลัง</div>
            <div className="text-xl font-bold">
              <Num v={stat30.min} /> บาท/กก.
            </div>
          </div>
          <div>
            <div className="text-gray-500">สูงสุดย้อนหลัง</div>
            <div className="text-xl font-bold">
              <Num v={stat30.max} /> บาท/กก.
            </div>
          </div>
          <div>
            <div className="text-gray-500">จำนวนข้อมูล</div>
            <div className="text-xl font-bold">{stat30.count} วัน</div>
          </div>
        </div>

        <div className="overflow-x-auto">
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
              {rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3">
                    {dayjs(r.date).format("DD/MM/YYYY")}{" "}
                    <span className="text-gray-400 text-xs">
                      ({dayjs(r.date).format("dddd")})
                    </span>
                  </td>
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
                    ไม่มีข้อมูลย้อนหลัง
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DailyPrice;
