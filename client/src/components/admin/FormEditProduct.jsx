import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import useEcomStore from "../../store/ecom-store";
import { readProduct, updateProduct } from "../../api/product";
import { toast } from "react-toastify";
import Uploadfile from "./Uploadfile";
import { useParams, useNavigate } from "react-router-dom";

const initialState = {
  title: "",
  description: "",
  price: "",
  quantity: "",
  categoryId: "",
  images: [],
};

const FormEditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const token = useEcomStore((state) => state.token);
  const getCategory = useEcomStore((state) => state.getCategory);
  const categories = useEcomStore((state) => state.categories);

  const [form, setForm] = useState(initialState);

  useEffect(() => {
    getCategory(token);
    fetchProduct(token, id);
  }, []);

  const fetchProduct = async (token, id) => {
    try {
      const res = await readProduct(token, id);
      // map Images (from backend) -> images (for UI)
      setForm({
        ...initialState,
        ...res.data,
        price: String(res.data?.price ?? ""),
        quantity: String(res.data?.quantity ?? ""),
        categoryId: res.data?.categoryId ?? "",
        images: Array.isArray(res.data?.Images) ? res.data.Images : [],
      });
    } catch (err) {
      console.log("Err fetch data", err);
    }
  };

  const handleOnChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        price: Number(form.price || 0),
        quantity: Number(form.quantity || 0),
      };
      const res = await updateProduct(token, id, payload);
      toast.success(`แก้ไขสินค้า ${res.data.title} สำเร็จ!`);
      navigate("/admin/product");
    } catch (err) {
      console.log(err);
      toast.error("แก้ไขสินค้าไม่สำเร็จ");
    }
  };

  return (
    <div className="container mx-auto p-4 bg-white shadow-md rounded-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <h1 className="text-xl font-semibold">แก้ไขข้อมูลสินค้า</h1>

        <div className="grid gap-4 sm:grid-cols-2">
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
              จำนวน (กก.)
            </label>
            <input
              type="number"
              min="0"
              className="w-full rounded-lg border px-3 py-2 outline-none focus:border-emerald-500"
              value={form.quantity}
              onChange={handleOnChange}
              placeholder="เช่น 500"
              name="quantity"
            />
          </div>

          <div className="sm:col-span-2">
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

        <Uploadfile form={form} setForm={setForm} />

        <div className="flex justify-center">
          <button className="rounded-lg bg-emerald-600 px-6 py-2 font-semibold text-white hover:bg-emerald-700">
            Edit Product
          </button>
        </div>
      </form>
    </div>
  );
};

export default FormEditProduct;
