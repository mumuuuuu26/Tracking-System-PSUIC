import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import useEcomStore from "../../store/ecom-store";
import { createProduct, removeProduct } from "../../api/product";
import { toast } from "react-toastify";
import Uploadfile from "./Uploadfile";
import { Link } from "react-router-dom";

const initialState = {
  title: "",
  description: "",
  price: "",
  quantity: "",
  categoryId: "",
  images: [],
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
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    getCategory(token);
    getProduct(token, 100);
  }, []);

  const handleOnChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const netWeight = Math.max(toNum(form.weightIn) - toNum(form.weightOut), 0);
  const amount = toNum(form.price) * netWeight;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        price: toNum(form.price),
        quantity: Math.round(netWeight),
        weightIn: toNum(form.weightIn),
        weightOut: toNum(form.weightOut),
      };
      const res = await createProduct(token, payload);
      toast.success(`เพิ่มสินค้า ${res.data.title} สำเร็จ!`);
      setForm(initialState);
      await getProduct(token, 100);
    } catch (err) {
      console.log(err);
      toast.error("เพิ่มสินค้าไม่สำเร็จ");
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`ต้องการลบสินค้า “${title}” ใช่ไหม?`)) return;
    try {
      setLoadingId(id);
      await removeProduct(token, id);
      toast.success("ลบสินค้าเรียบร้อย");
      await getProduct(token, 100);
    } catch (err) {
      console.log(err);
      const msg = err?.response?.data?.message || "ลบสินค้าไม่สำเร็จ";
      toast.error(msg);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-white shadow-md rounded-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="mb-2">
          <h1 className="text-xl font-semibold">เพิ่มข้อมูลสินค้า</h1>
          <p className="text-gray-500 text-sm">
            ปาล์มทะลายเกรด A = ทะลายสุก
            <br />
            ปาล์มทะลายเกรด B = ทะลายกึ่งสุก
            <br />
            ปาล์มทะลายเกรด C = ทะลายดิบ
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              ชื่อสินค้า
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-emerald-500"
              value={form.title}
              onChange={handleOnChange}
              placeholder="เช่น ทะลายปาล์มคละเกรด"
              name="title"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              รายละเอียด
            </label>
            <input
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-emerald-500"
              value={form.description}
              onChange={handleOnChange}
              placeholder="เช่น ลูกค้ารายใหญ่,ลูกค้ารายย่อย"
              name="description"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              ราคา (บาท/กก.)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-emerald-500"
              value={form.price}
              onChange={handleOnChange}
              placeholder="เช่น 7.20"
              name="price"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              น้ำหนักเข้า (กก.)
            </label>
            <input
              type="number"
              min="0"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-emerald-500"
              value={form.weightIn}
              onChange={handleOnChange}
              placeholder="เช่น 3970"
              name="weightIn"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              น้ำหนักออก (กก.)
            </label>
            <input
              type="number"
              min="0"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-emerald-500"
              value={form.weightOut}
              onChange={handleOnChange}
              placeholder="เช่น 1770"
              name="weightOut"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">หมวดหมู่</label>
            <select
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-emerald-500"
              name="categoryId"
              onChange={handleOnChange}
              required
              value={form.categoryId}
            >
              <option value="" disabled>
                — เลือกหมวดหมู่ —
              </option>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* แสดงผลคำนวณทันที */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-gray-50">
            น้ำหนักสุทธิ: <b>{fmt(netWeight)}</b> กก.
          </div>
          <div className="p-3 rounded-lg bg-gray-50">
            จำนวนเงิน: <b>{fmt(amount)}</b> บาท
          </div>
        </div>
        <Uploadfile form={form} setForm={setForm} />

        <div className="flex justify-center">
          <button className="rounded-lg bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700">
            Add Product
          </button>
        </div>

        <hr className="my-6" />

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">No.</th>
                <th className="px-4 py-2 text-left">รูปภาพ</th>
                <th className="px-4 py-2 text-left">ชื่อสินค้า</th>
                <th className="px-4 py-2 text-left">รายละเอียด</th>
                <th className="px-4 py-2 text-center">ราคา</th>
                <th className="px-4 py-2 text-center">น้ำหนักเข้า</th>
                <th className="px-4 py-2 text-center">น้ำหนักออก</th>
                <th className="px-4 py-2 text-center">น้ำหนักสุทธิ</th>
                <th className="px-4 py-2 text-center">จำนวนเงิน</th>
                <th className="px-4 py-2 text-center">วันที่อัปเดต</th>
                <th className="px-4 py-2 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {products.map((item, index) => {
                const net = Number(
                  item.netWeight ??
                    Math.max((item.weightIn || 0) - (item.weightOut || 0), 0)
                );
                const total = Number(item.amount ?? item.price * net);
                return (
                  <tr
                    key={item.id}
                    className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <td className="px-4 py-2">{index + 1}</td>
                    <td className="px-4 py-2">
                      <div className="w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {item.Images?.length > 0 ? (
                          <img
                            src={item.Images[0].url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs text-gray-400">
                            No Image
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2">{item.title}</td>
                    <td className="px-4 py-2">{item.description}</td>
                    <td className="px-4 py-2 text-center">{fmt(item.price)}</td>
                    <td className="px-4 py-2 text-center">
                      {fmt(item.weightIn)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      {fmt(item.weightOut)}
                    </td>
                    <td className="px-4 py-2 text-center">{fmt(net)}</td>
                    <td className="px-4 py-2 text-center">{fmt(total)}</td>
                    <td className="px-4 py-2 text-center">
                      {dayjs(item.updatedAt).format("DD/MM/YYYY HH:mm")}
                    </td>
                    <td className="px-4 py-2 flex items-center gap-2 justify-center">
                      <Link
                        to={`/admin/product/${item.id}`}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-1 rounded-md shadow"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(item.id, item.title)}
                        disabled={loadingId === item.id}
                        className={
                          "px-3 py-1 rounded-md text-white " +
                          (loadingId === item.id
                            ? "bg-red-300 cursor-wait"
                            : "bg-red-500 hover:bg-red-600")
                        }
                      >
                        {loadingId === item.id ? "กำลังลบ…" : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    ยังไม่มีสินค้า
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
