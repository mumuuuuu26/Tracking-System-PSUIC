import React, { useEffect, useState } from "react";
import useEcomStore from "../../store/ecom-store";
import { getPriceToday } from "../../api/palmPrice";

const fmt = (n) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const Dashboard = () => {
  const token = useEcomStore((s) => s.token);
  const getProduct = useEcomStore((s) => s.getProduct);
  const getCategory = useEcomStore((s) => s.getCategory);
  const products = useEcomStore((s) => s.products);
  const categories = useEcomStore((s) => s.categories);
  const [todayPrice, setTodayPrice] = useState(null);

  useEffect(() => {
    getProduct(token, 1000);
    getCategory(token);
    loadPrice();
  }, []);

  const loadPrice = async () => {
    try {
      const res = await getPriceToday();
      setTodayPrice(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // รวมยอดสรุปภาพรวม
  const summary = {
    totalProducts: products.length,
    totalWeight: products.reduce((s, p) => s + (p.quantity || 0), 0),
    totalAmount: products.reduce((s, p) => s + (p.price * p.quantity || 0), 0),
    largeCustomers: categories.filter((c) => c.customerType === "large").length,
    smallCustomers: categories.filter((c) => c.customerType === "retail")
      .length,
  };

  const avgPrice =
    summary.totalWeight > 0 ? summary.totalAmount / summary.totalWeight : 0;

  //ข้อมูลบิลต่อลูกค้า
  const customerStats = categories.map((c) => {
    const bills = products.filter((p) => p.categoryId === c.id);
    const totalBills = bills.length;
    const totalWeight = bills.reduce((s, p) => s + (p.quantity || 0), 0);
    return { ...c, totalBills, totalWeight };
  });

  // แยกประเภทและเรียง Top 5
  const topLarge = customerStats
    .filter((c) => c.customerType === "large")
    .sort((a, b) => b.totalWeight - a.totalWeight)
    .slice(0, 5);

  const topRetail = customerStats
    .filter((c) => c.customerType === "retail")
    .sort((a, b) => b.totalWeight - a.totalWeight)
    .slice(0, 5);

  const CircleProgress = ({ percent, title, amount, subtitle, color }) => {
    const r = 80;
    const circ = 2 * Math.PI * r;
    const offset = circ - (percent / 100) * circ;
    const theme =
      color === "cyan"
        ? { bg: "from-cyan-50 to-blue-50", stroke: "#06b6d4" }
        : { bg: "from-teal-50 to-emerald-50", stroke: "#14b8a6" };

    return (
      <div
        className={`rounded-3xl bg-gradient-to-br ${theme.bg} border p-8 shadow-xl`}
      >
        <div className="flex flex-col items-center">
          <svg className="h-48 w-48 -rotate-90 transform">
            <circle
              cx="96"
              cy="96"
              r={r}
              stroke="#e5e7eb"
              strokeWidth="16"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r={r}
              stroke={theme.stroke}
              strokeWidth="16"
              fill="none"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="mt-6 text-center">
            <div className="text-4xl font-bold text-gray-900">{amount} ราย</div>
            <div className="mt-3 text-base font-semibold text-gray-700">
              {title}
            </div>
            <div className="mt-2 text-sm text-gray-600">{subtitle}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10">
          <h1 className="text-5xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-3 text-lg text-gray-600">
            ภาพรวมการรับซื้อปาล์มน้ำมัน
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-600 p-8 text-white shadow-xl">
            <div className="text-2xl font-bold">{fmt(summary.totalAmount)}</div>
            <div className="mt-3 text-sm font-semibold opacity-90">
              ยอดเงินรวม
            </div>
            <div className="text-xs opacity-75">จากทุกบิล</div>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="text-2xl font-bold text-gray-900">
              {fmt(summary.totalWeight)}
            </div>
            <div className="mt-3 text-sm font-semibold text-gray-600">
              น้ำหนักรวม
            </div>
            <div className="text-xs text-gray-500">กิโลกรัม</div>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="text-2xl font-bold text-gray-900">
              {summary.totalProducts}
            </div>
            <div className="mt-3 text-sm font-semibold text-gray-600">
              จำนวนบิลทั้งหมด
            </div>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="text-2xl font-bold text-gray-900">
              {summary.largeCustomers + summary.smallCustomers}
            </div>
            <div className="mt-3 text-sm font-semibold text-gray-600">
              จำนวนลูกค้า
            </div>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="text-2xl font-bold text-gray-900">
              {fmt(avgPrice)}
            </div>
            <div className="mt-3 text-sm font-semibold text-gray-600">
              ราคาเฉลี่ย
            </div>
          </div>
        </div>

        {/* Circle Progress */}
        <div className="grid gap-8 sm:grid-cols-2 max-w-5xl mx-auto">
          <CircleProgress
            percent={
              (summary.largeCustomers /
                (summary.largeCustomers + summary.smallCustomers)) *
                100 || 0
            }
            title="ลูกค้ารายใหญ่"
            amount={summary.largeCustomers}
            subtitle="จากทะเบียนในระบบ"
            color="cyan"
          />
          <CircleProgress
            percent={
              (summary.smallCustomers /
                (summary.largeCustomers + summary.smallCustomers)) *
                100 || 0
            }
            title="ลูกค้ารายย่อย"
            amount={summary.smallCustomers}
            subtitle="จากทะเบียนในระบบ"
            color="teal"
          />
        </div>

        {/* Top 5 รายใหญ่ / รายย่อย */}
        <div className="mt-16 max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* รายใหญ่ */}
          <div className="bg-white rounded-3xl shadow-lg border border-yellow-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <span className="text-yellow-600 text-xl">🏢</span>
              </div>
              <h2 className="text-xl font-bold text-yellow-800">
                Top 5 ลูกค้ารายใหญ่
              </h2>
            </div>

            <ul className="divide-y divide-gray-100">
              {topLarge.length > 0 ? (
                topLarge.map((item, idx) => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center py-3 px-2 hover:bg-yellow-50 rounded-lg"
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 text-sm font-semibold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-gray-800">
                        {item.name}
                      </span>
                    </span>
                    <div className="text-right">
                      <div className="text-sm text-gray-800">
                        {item.totalBills} บิล
                      </div>
                      <div className="text-xs text-gray-500">
                        {fmt(item.totalWeight)} กก.
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="py-4 text-center text-gray-400 italic">
                  ไม่มีข้อมูลลูกค้ารายใหญ่
                </li>
              )}
            </ul>
          </div>

          {/* รายย่อย */}
          <div className="bg-white rounded-3xl shadow-lg border border-emerald-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-600 text-xl">🛒</span>
              </div>
              <h2 className="text-xl font-bold text-emerald-800">
                Top 5 ลูกค้ารายย่อย
              </h2>
            </div>

            <ul className="divide-y divide-gray-100">
              {topRetail.length > 0 ? (
                topRetail.map((item, idx) => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center py-3 px-2 hover:bg-emerald-50 rounded-lg"
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-gray-800">
                        {item.name}
                      </span>
                    </span>
                    <div className="text-right">
                      <div className="text-sm text-gray-800">
                        {item.totalBills} บิล
                      </div>
                      <div className="text-xs text-gray-500">
                        {fmt(item.totalWeight)} กก.
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <li className="py-4 text-center text-gray-400 italic">
                  ไม่มีข้อมูลลูกค้ารายย่อย
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
