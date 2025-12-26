import React, { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import useEcomStore from "../../store/ecom-store";
import { createProduct, removeProduct } from "../../api/ticket";
import { getPriceToday } from "../../api/palmPrice";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const initialState = {
  categoryId: "",
  weightIn: "",
  weightOut: "",
};

const toNum = (v) => Number(v || 0);
const fmt = (n) =>
  Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

const FormProduct = () => {
  const token = useEcomStore((state) => state.token);
  const getCategory = useEcomStore((state) => state.getCategory);
  const categories = useEcomStore((state) => state.categories);
  const getProduct = useEcomStore((state) => state.getProduct);
  const products = useEcomStore((state) => state.products);

  const [form, setForm] = useState(initialState);
  const [todayPrice, setTodayPrice] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // เรียงทะเบียนรถตามตัวอักษรก่อน แล้วตามด้วยตัวเลข
  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => {
      const nameA = a.name || "";
      const nameB = b.name || "";

      // แยกส่วนตัวอักษรและตัวเลข
      const matchA = nameA.match(/^([^\d]*)(\d*)$/);
      const matchB = nameB.match(/^([^\d]*)(\d*)$/);

      const letterA = matchA ? matchA[1] : "";
      const letterB = matchB ? matchB[1] : "";
      const numA = matchA && matchA[2] ? parseInt(matchA[2], 10) : 0;
      const numB = matchB && matchB[2] ? parseInt(matchB[2], 10) : 0;

      // เปรียบเทียบตัวอักษรก่อน
      const letterCompare = letterA.localeCompare(letterB, "th");
      if (letterCompare !== 0) {
        return letterCompare;
      }

      // ถ้าตัวอักษรเหมือนกัน ให้เปรียบเทียบตัวเลข
      return numA - numB;
    });
  }, [categories]);

  useEffect(() => {
    getCategory(token);
    getProduct(token, 100);
    loadTodayPrice();
  }, []);

  const loadTodayPrice = async () => {
    try {
      const res = await getPriceToday();
      setTodayPrice(res.data);
    } catch (err) {
      console.log(err);
      toast.error("ไม่สามารถดึงราคาวันนี้ได้");
    }
  };

  const handleOnChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === "categoryId") {
      const category = categories.find((c) => c.id === parseInt(value));
      setSelectedCategory(category);
    }
  };

  const netWeight = Math.max(toNum(form.weightIn) - toNum(form.weightOut), 0);

  const getPrice = () => {
    if (!todayPrice || !selectedCategory) return 0;
    return selectedCategory.customerType === "large"
      ? todayPrice.priceMax
      : todayPrice.priceAvg;
  };

  const amount = getPrice() * netWeight;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.categoryId) {
      return toast.error("กรุณาเลือกทะเบียนรถ");
    }

    if (!form.weightIn || !form.weightOut) {
      return toast.error("กรุณากรอกน้ำหนักให้ครบ");
    }

    if (!todayPrice) {
      return toast.error("ไม่มีข้อมูลราคาวันนี้");
    }

    try {
      setSubmitting(true);
      const payload = {
        title: `${selectedCategory.name} - ${dayjs().format(
          "DD/MM/YYYY HH:mm"
        )}`,
        description:
          selectedCategory.customerType === "large"
            ? "ลูกค้ารายใหญ่"
            : "ลูกค้ารายย่อย",
        price: getPrice(),
        quantity: Math.round(netWeight),
        categoryId: form.categoryId,
        weightIn: toNum(form.weightIn),
        weightOut: toNum(form.weightOut),
        images: [],
      };

      const res = await createProduct(token, payload);
      toast.success(`บันทึกบิลสำเร็จ! ${selectedCategory.name}`);
      setForm(initialState);
      setSelectedCategory(null);
      await getProduct(token, 100);
    } catch (err) {
      console.log(err);
      toast.error("บันทึกบิลไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`ต้องการลบบิล "${title}" ใช่ไหม?`)) return;
    try {
      setLoadingId(id);
      await removeProduct(token, id);
      toast.success("ลบบิลเรียบร้อย");
      await getProduct(token, 100);
    } catch (err) {
      console.log(err);
      toast.error("ลบบิลไม่สำเร็จ");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
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
                สร้างบิลรับซื้อปาล์ม
              </h1>
              <p className="text-gray-600 mt-1">
                บันทึกข้อมูลการรับซื้อปาล์มนํ้ามัน
              </p>
            </div>
          </div>
        </div>

        {/* Price Info Card */}
        {todayPrice ? (
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl shadow-lg border border-blue-200 p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
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
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  ราคาปาล์มวันนี้
                </h2>
                <p className="text-sm text-gray-600">
                  {dayjs().format("DD/MM/YYYY")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">ราคาต่ำสุด</div>
                <div className="text-2xl font-bold text-gray-800">
                  {todayPrice.priceMin}
                </div>
                <div className="text-sm text-gray-500">บาท/กก.</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm border-2 border-emerald-200">
                <div className="text-sm text-gray-600 mb-1">ราคาเฉลี่ย</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {todayPrice.priceAvg}
                </div>
                <div className="text-sm text-gray-500">บาท/กก.</div>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">ราคาสูงสุด</div>
                <div className="text-2xl font-bold text-orange-600">
                  {todayPrice.priceMax}
                </div>
                <div className="text-sm text-gray-500">บาท/กก.</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 rounded-2xl shadow-lg border border-red-200 p-6 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">
                  ไม่พบข้อมูลราคา
                </h3>
                <p className="text-red-600">กรุณาอัปเดตราคาก่อนสร้างบิล</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-emerald-600"
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
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              กรอกข้อมูลบิล
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-3 mb-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกทะเบียนรถ <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-white cursor-pointer"
                name="categoryId"
                onChange={handleOnChange}
                required
                value={form.categoryId}
              >
                <option value="">— เลือกทะเบียนรถ —</option>
                {sortedCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (
                    {item.customerType === "large" ? "รายใหญ่" : "รายย่อย"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              {selectedCategory && (
                <div className="mt-7">
                  <div
                    className="p-4 rounded-xl text-center shadow-sm"
                    style={{
                      background:
                        selectedCategory.customerType === "large"
                          ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
                          : "linear-gradient(135deg, #f0fdf4 0%, #d1fae5 100%)",
                      color:
                        selectedCategory.customerType === "large"
                          ? "#92400e"
                          : "#065f46",
                    }}
                  >
                    <div className="text-sm font-medium mb-2">
                      {selectedCategory.customerType === "large"
                        ? "🏢 ลูกค้ารายใหญ่"
                        : "🛒 ลูกค้ารายย่อย"}
                    </div>
                    <div className="text-2xl font-bold">{getPrice()}</div>
                    <div className="text-xs mt-1">บาท/กก.</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                น้ำหนักเข้า (กก.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                value={form.weightIn}
                onChange={handleOnChange}
                placeholder="เช่น 3970"
                name="weightIn"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                น้ำหนักออก (กก.) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                value={form.weightOut}
                onChange={handleOnChange}
                placeholder="เช่น 1770"
                name="weightOut"
                required
              />
            </div>
          </div>

          {/* Calculation Summary */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">น้ำหนักสุทธิ</div>
              <div className="text-2xl font-bold text-blue-700">
                {fmt(netWeight)}
              </div>
              <div className="text-sm text-gray-600">กก.</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
              <div className="text-sm text-gray-600 mb-1">ราคา/กก.</div>
              <div className="text-2xl font-bold text-purple-700">
                {fmt(getPrice())}
              </div>
              <div className="text-sm text-gray-600">บาท</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border-2 border-emerald-200">
              <div className="text-sm text-gray-600 mb-1">จำนวนเงินรวม</div>
              <div className="text-2xl font-bold text-emerald-600">
                {fmt(amount)}
              </div>
              <div className="text-sm text-gray-600">บาท</div>
            </div>
          </div>

          <div className="flex justify-center pt-4 border-t border-gray-200">
            <button
              onClick={handleSubmit}
              disabled={!todayPrice || submitting}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-3.5 font-semibold text-white shadow-lg hover:from-emerald-600 hover:to-teal-700 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-0.5"
            >
              {submitting ? (
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
                  กำลังบันทึก...
                </>
              ) : (
                <>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  บันทึกบิล
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormProduct;
