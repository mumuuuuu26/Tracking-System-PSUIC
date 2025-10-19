import React, { useState, useEffect } from "react";
import {
  Calculator,
  TrendingUp,
  Calendar,
  DollarSign,
  Award,
  AlertCircle,
} from "lucide-react";

const fmt = (n) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const PalmCalculator = () => {
  const [weight, setWeight] = useState("");
  const [loading, setLoading] = useState(false);
  const [priceData, setPriceData] = useState([]);
  const [todayPrice, setTodayPrice] = useState(null);
  const [calculation, setCalculation] = useState(null);

  //โหลดข้อมูลราคา
  useEffect(() => {
    loadPriceData();
  }, []);

  const loadPriceData = async () => {
    try {
      setLoading(true);
      // ดึงราคาวันนี้
      const todayRes = await fetch(
        "http://localhost:5001/api/palm-prices/today"
      );
      if (todayRes.ok) {
        const today = await todayRes.json();
        setTodayPrice(today);
      }

      //ดึงราคา 30 วันย้อนหลัง
      const now = new Date();
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const to = new Date();

      const rangeRes = await fetch(
        `http://localhost:5001/api/palm-prices?from=${
          from.toISOString().split("T")[0]
        }&to=${to.toISOString().split("T")[0]}`
      );
      if (rangeRes.ok) {
        const data = await rangeRes.json();
        setPriceData(data);
      }
    } catch (err) {
      console.error("Error loading price data:", err);
    } finally {
      setLoading(false);
    }
  };

  //เพิ่มฟังก์ชันแปลงวันที่ให้เป็นรูปแบบเดียวกัน
  const normalizeDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getDate()).padStart(2, "0")}`;
  };

  //แก้ไขฟังก์ชันเปรียบเทียบวันที่
  const isToday = (date) => {
    const today = new Date();
    const checkDate = new Date(date);

    return (
      today.getFullYear() === checkDate.getFullYear() &&
      today.getMonth() === checkDate.getMonth() &&
      today.getDate() === checkDate.getDate()
    );
  };

  const calculateBestPrice = () => {
    if (!weight || Number(weight) <= 0) {
      alert("กรุณากรอกน้ำหนักที่ถูกต้อง");
      return;
    }

    const weightNum = Number(weight);
    const allPrices = [...priceData];

    if (todayPrice) {
      allPrices.unshift(todayPrice);
    }

    if (allPrices.length === 0) {
      alert("ไม่มีข้อมูลราคา");
      return;
    }

    //กรองข้อมูลซ้ำโดยใช้ Map
    const uniquePrices = Array.from(
      new Map(
        allPrices.map((price) => [
          normalizeDate(price.date), // key = วันที่ในรูปแบบ YYYY-MM-DD
          price, // value = ข้อมูลทั้งหมด
        ])
      ).values()
    );

    //คำนวณราคาเฉลี่ยสำหรับแต่ละวัน
    const calculations = uniquePrices.map((day) => ({
      date: new Date(day.date),
      priceAvg: day.priceAvg,
      priceMin: day.priceMin,
      priceMax: day.priceMax,
      amountAvg: weightNum * day.priceAvg,
      amountMin: weightNum * day.priceMin,
      amountMax: weightNum * day.priceMax,
    }));

    // หาวันที่ได้ราคาดีที่สุด (ราคาเฉลี่ย)
    const bestDay = calculations.reduce((best, current) =>
      current.priceAvg > best.priceAvg ? current : best
    );

    // หาวันที่ได้ราคาแย่ที่สุด
    const worstDay = calculations.reduce((worst, current) =>
      current.priceAvg < worst.priceAvg ? current : worst
    );

    // คำนวณราคาเฉลี่ยรวม
    const avgPrice =
      calculations.reduce((sum, day) => sum + day.priceAvg, 0) /
      calculations.length;
    const avgAmount = weightNum * avgPrice;

    // หาราคาสูงสุดและต่ำสุดในช่วง 30 วัน
    const maxPrice = Math.max(...calculations.map((d) => d.priceAvg));
    const minPrice = Math.min(...calculations.map((d) => d.priceAvg));
    const priceRange = maxPrice - minPrice;

    setCalculation({
      weight: weightNum,
      bestDay,
      worstDay,
      avgPrice,
      avgAmount,
      maxPrice,
      minPrice,
      priceRange,
      todayAmount: todayPrice ? weightNum * todayPrice.priceAvg : null,
      todayPrice: todayPrice?.priceAvg || null,
      priceDifference: todayPrice
        ? todayPrice.priceAvg - bestDay.priceAvg
        : null,
      calculations: calculations.sort((a, b) => b.date - a.date),
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Calculator className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                คำนวณราคาปาล์ม
              </h1>
              <p className="text-gray-600 mt-1">
                คำนวณว่าควรขายวันไหนจะได้ราคาดีที่สุด
              </p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              กรอกน้ำหนักปาล์ม
            </h2>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                น้ำหนักสุทธิ (กิโลกรัม)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && calculateBestPrice()}
                placeholder="เช่น 2000"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-lg outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
              />
            </div>
            <button
              onClick={calculateBestPrice}
              disabled={loading || !weight}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 font-semibold flex items-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              คำนวณ
            </button>
          </div>

          {loading && (
            <div className="mt-4 text-center text-gray-600">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
              <p className="mt-2">กำลังโหลดข้อมูล...</p>
            </div>
          )}
        </div>

        {/* Results */}
        {calculation && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Best Day Card */}
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-10 h-10" />
                  <span className="text-sm font-medium opacity-90">
                    ราคาดีที่สุด
                  </span>
                </div>
                <div className="mb-2">
                  <div className="text-3xl font-bold mb-1">
                    {fmt(calculation.bestDay.amountAvg)} บาท
                  </div>
                  <div className="text-sm opacity-90">
                    @ {calculation.bestDay.priceAvg} บาท/กก.
                  </div>
                </div>
                <div className="text-sm opacity-90 border-t border-white/30 pt-3 mt-3">
                  {formatDate(calculation.bestDay.date)}
                  {isToday(calculation.bestDay.date) && (
                    <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                      วันนี้
                    </span>
                  )}
                </div>
              </div>

              {/* Today's Price Card */}
              {calculation.todayPrice && (
                <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Calendar className="w-8 h-8 text-purple-600" />
                    <span className="text-sm font-medium text-gray-600">
                      ราคาวันนี้
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="text-3xl font-bold text-gray-800 mb-1">
                      {fmt(calculation.todayAmount)} บาท
                    </div>
                    <div className="text-sm text-gray-600">
                      @ {calculation.todayPrice} บาท/กก.
                    </div>
                  </div>
                  {calculation.priceDifference !== 0 && (
                    <div
                      className={`text-sm font-medium ${
                        calculation.priceDifference > 0
                          ? "text-red-600"
                          : "text-emerald-600"
                      } border-t border-gray-200 pt-3 mt-3`}
                    >
                      {calculation.priceDifference > 0 ? (
                        <>
                          ต่ำกว่าราคาดีที่สุด{" "}
                          {fmt(
                            Math.abs(
                              calculation.priceDifference * calculation.weight
                            )
                          )}{" "}
                          บาท
                        </>
                      ) : (
                        <>ราคาวันนี้คือราคาดีที่สุด</>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Average Price Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <span className="text-sm font-medium text-gray-600">
                    ราคาเฉลี่ย 30 วัน
                  </span>
                </div>
                <div className="mb-2">
                  <div className="text-3xl font-bold text-gray-800 mb-1">
                    {fmt(calculation.avgAmount)} บาท
                  </div>
                  <div className="text-sm text-gray-600">
                    @ {fmt(calculation.avgPrice)} บาท/กก.
                  </div>
                </div>
                <div className="text-sm text-gray-600 border-t border-gray-200 pt-3 mt-3">
                  ช่วง {fmt(calculation.minPrice)} - {fmt(calculation.maxPrice)}{" "}
                  บาท/กก.
                </div>
              </div>
            </div>

            {/* Recommendation Box */}
            <div
              className={`rounded-2xl shadow-lg border-2 p-6 mb-8 ${
                calculation.priceDifference && calculation.priceDifference > 0
                  ? "bg-amber-50 border-amber-300"
                  : "bg-emerald-50 border-emerald-300"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    calculation.priceDifference &&
                    calculation.priceDifference > 0
                      ? "bg-amber-200"
                      : "bg-emerald-200"
                  }`}
                >
                  <AlertCircle
                    className={`w-6 h-6 ${
                      calculation.priceDifference &&
                      calculation.priceDifference > 0
                        ? "text-amber-700"
                        : "text-emerald-700"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <h3
                    className={`text-lg font-semibold mb-2 ${
                      calculation.priceDifference &&
                      calculation.priceDifference > 0
                        ? "text-amber-900"
                        : "text-emerald-900"
                    }`}
                  >
                    คำแนะนำ
                  </h3>
                  {calculation.priceDifference &&
                  calculation.priceDifference > 0 ? (
                    <div className="text-amber-800">
                      <p className="mb-2">
                        ราคาวันนี้ยังไม่ใช่ราคาที่ดีที่สุด
                        หากขายในวันที่ได้ราคาดีที่สุด (
                        {formatDate(calculation.bestDay.date)})
                        คุณจะได้เงินมากกว่า{" "}
                        <span className="font-bold">
                          {fmt(
                            Math.abs(
                              calculation.priceDifference * calculation.weight
                            )
                          )}{" "}
                          บาท
                        </span>
                      </p>
                      <p className="text-sm">
                        💡
                        แต่ควรพิจารณาเรื่องต้นทุนการจัดเก็บและความเสี่ยงที่ราคาอาจลดลงด้วย
                      </p>
                    </div>
                  ) : (
                    <p className="text-emerald-800">
                      ราคาวันนี้อยู่ในช่วงที่ดี! เหมาะสำหรับการขาย
                      เนื่องจากเป็นราคาสูงสุดในช่วง 30 วันที่ผ่านมา
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Price History Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">
                  ประวัติราคา 30 วันล่าสุด
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-200">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                        วันที่
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        ราคา/กก.
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        เงินที่จะได้รับ
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        เปรียบเทียบ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {calculation.calculations.slice(0, 30).map((day, idx) => {
                      const isBestDay =
                        day.date.getTime() ===
                        calculation.bestDay.date.getTime();
                      const isWorstDay =
                        day.date.getTime() ===
                        calculation.worstDay.date.getTime();
                      const isTodayDate = isToday(day.date);
                      const diff = day.amountAvg - calculation.avgAmount;

                      return (
                        <tr
                          key={idx}
                          className={`hover:bg-gray-50 transition-colors ${
                            isBestDay
                              ? "bg-emerald-50"
                              : isWorstDay
                              ? "bg-red-50"
                              : ""
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {formatDate(day.date)}
                              {isTodayDate && (
                                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                  วันนี้
                                </span>
                              )}
                              {isBestDay && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                  ดีที่สุด
                                </span>
                              )}
                              {isWorstDay && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                  ต่ำที่สุด
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`font-semibold ${
                                isBestDay
                                  ? "text-emerald-600"
                                  : isWorstDay
                                  ? "text-red-600"
                                  : "text-gray-800"
                              }`}
                            >
                              {fmt(day.priceAvg)}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {fmt(day.priceMin)} - {fmt(day.priceMax)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`text-lg font-bold ${
                                isBestDay
                                  ? "text-emerald-600"
                                  : isWorstDay
                                  ? "text-red-600"
                                  : "text-gray-800"
                              }`}
                            >
                              {fmt(day.amountAvg)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-sm font-medium ${
                                diff > 0
                                  ? "text-emerald-600"
                                  : diff < 0
                                  ? "text-red-600"
                                  : "text-gray-600"
                              }`}
                            >
                              {diff > 0 ? "+" : ""}
                              {fmt(diff)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Info Box */}
        {!calculation && !loading && (
          <div className="bg-blue-50 rounded-2xl shadow-lg border border-blue-200 p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  วิธีใช้งาน
                </h3>
                <ul className="text-blue-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>กรอกน้ำหนักสุทธิของปาล์มที่ต้องการขาย</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>กดปุ่ม "คำนวณ" เพื่อดูการวิเคราะห์ราคา</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>
                      ระบบจะแสดงวันที่ได้ราคาดีที่สุดและเปรียบเทียบกับราคาวันนี้
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>
                      ดูประวัติราคา 30 วันย้อนหลังเพื่อประกอบการตัดสินใจ
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PalmCalculator;
