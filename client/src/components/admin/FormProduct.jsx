import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import useEcomStore from "../../store/ecom-store";
import { createProduct, removeProduct } from "../../api/product";
import { getPriceToday } from "../../api/palmPrice";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const initialState = {
  categoryId: "", // ทะเบียนรถ
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

    // เมื่อเลือกทะเบียนรถ ให้หาประเภทลูกค้า
    if (name === "categoryId") {
      const category = categories.find((c) => c.id === parseInt(value));
      setSelectedCategory(category);
    }
  };

  // คำนวณน้ำหนักสุทธิ
  const netWeight = Math.max(toNum(form.weightIn) - toNum(form.weightOut), 0);

  // คำนวณราคาตามประเภทลูกค้า
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
    <div className="container mx-auto p-4 bg-white shadow-md rounded-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="mb-4">
          <h1 className="text-xl font-semibold">สร้างบิลรับซื้อปาล์ม</h1>

          {/* แสดงราคาวันนี้ */}
          {todayPrice ? (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">
                ราคาปาล์มวันนี้ ({dayjs().format("DD/MM/YYYY")})
              </p>
              <div className="flex gap-4 mt-1">
                <span>
                  ต่ำสุด: <b>{todayPrice.priceMin}</b> บาท/กก.
                </span>
                <span className="text-emerald-600">
                  เฉลี่ย: <b>{todayPrice.priceAvg}</b> บาท/กก.
                </span>
                <span className="text-orange-600">
                  สูงสุด: <b>{todayPrice.priceMax}</b> บาท/กก.
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-3 p-3 bg-red-50 rounded-lg">
              <p className="text-red-600">
                ไม่มีข้อมูลราคาวันนี้ กรุณาอัปเดตราคาก่อน
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">
              เลือกทะเบียนรถ <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-emerald-500"
              name="categoryId"
              onChange={handleOnChange}
              required
              value={form.categoryId}
            >
              <option value="">— เลือกทะเบียนรถ —</option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} (
                  {item.customerType === "large" ? "รายใหญ่" : "รายย่อย"})
                </option>
              ))}
            </select>
          </div>

          <div>
            {selectedCategory && (
              <div
                className="mt-6 p-2 rounded-lg text-center"
                style={{
                  background:
                    selectedCategory.customerType === "large"
                      ? "#fffbeb"
                      : "#f0fdf4",
                  color:
                    selectedCategory.customerType === "large"
                      ? "#92400e"
                      : "#065f46",
                }}
              >
                <p className="text-sm">
                  ประเภท:{" "}
                  {selectedCategory.customerType === "large"
                    ? "ลูกค้ารายใหญ่"
                    : "ลูกค้ารายย่อย"}
                </p>
                <p className="font-bold">ราคา: {getPrice()} บาท/กก.</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              น้ำหนักเข้า (กก.) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-emerald-500"
              value={form.weightIn}
              onChange={handleOnChange}
              placeholder="เช่น 3970"
              name="weightIn"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              น้ำหนักออก (กก.) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-emerald-500"
              value={form.weightOut}
              onChange={handleOnChange}
              placeholder="เช่น 1770"
              name="weightOut"
              required
            />
          </div>
        </div>

        {/* แสดงผลคำนวณ */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-gray-50">
            น้ำหนักสุทธิ: <b className="text-lg">{fmt(netWeight)}</b> กก.
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            ราคา/กก.: <b className="text-lg">{fmt(getPrice())}</b> บาท
          </div>
          <div className="p-3 rounded-lg bg-emerald-50">
            จำนวนเงินรวม:{" "}
            <b className="text-lg text-emerald-600">{fmt(amount)}</b> บาท
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!todayPrice}
            className="rounded-lg bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            บันทึกบิล
          </button>
        </div>

        <hr className="my-6" />

        {/* ตารางแสดงบิลย้อนหลัง */}
        <h2 className="text-lg font-semibold mb-3">บิลย้อนหลังวันนี้</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">เลขที่</th>
                <th className="px-4 py-2 text-left">ทะเบียนรถ</th>
                <th className="px-4 py-2 text-left">ประเภท</th>
                <th className="px-4 py-2 text-center">ราคา/กก.</th>
                <th className="px-4 py-2 text-center">น้ำหนักเข้า</th>
                <th className="px-4 py-2 text-center">น้ำหนักออก</th>
                <th className="px-4 py-2 text-center">น้ำหนักสุทธิ</th>
                <th className="px-4 py-2 text-center">จำนวนเงิน</th>
                <th className="px-4 py-2 text-center">เวลา</th>
                <th className="px-4 py-2 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item, index) => {
                const net = Math.max(
                  (item.weightIn || 0) - (item.weightOut || 0),
                  0
                );
                const total = item.price * net;
                const plateNumber = item.title?.split(" - ")[0] || item.title;

                return (
                  <tr
                    key={item.id}
                    className="odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                  >
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2 font-medium">{plateNumber}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.description === "ลูกค้ารายใหญ่"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {item.description}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center">{fmt(item.price)}</td>
                    <td className="px-4 py-2 text-center">
                      {fmt(item.weightIn)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {fmt(item.weightOut)}
                    </td>
                    <td className="px-4 py-2 text-center font-medium">
                      {fmt(net)}
                    </td>
                    <td className="px-4 py-2 text-center font-bold text-emerald-600">
                      {fmt(total)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {dayjs(item.createdAt).format("HH:mm")}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        disabled={loadingId === item.id}
                        className="px-3 py-1 rounded-md text-white bg-red-500 hover:bg-red-600 disabled:opacity-50"
                      >
                        {loadingId === item.id ? "กำลังลบ..." : "ลบ"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    ยังไม่มีบิล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </form>
    </div>
  );
};

export default FormProduct;
