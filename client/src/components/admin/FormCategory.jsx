import React, { useState, useEffect } from "react";
import {
  createCategory,
  listCategory,
  removeCategory,
  updateCategory,
} from "../../api/Category";
import useEcomStore from "../../store/ecom-store";
import { toast } from "react-toastify";

const FormCategory = () => {
  const token = useEcomStore((s) => s.token);
  const categories = useEcomStore((s) => s.categories);
  const getCategory = useEcomStore((s) => s.getCategory);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // state สำหรับแก้ไข
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    getCategory(token);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.warning("กรุณากรอกชื่อหมวดหมู่");
    try {
      setLoading(true);
      const res = await createCategory(token, { name: name.trim() });
      toast.success(`เพิ่มหมวดหมู่ “${res.data.name}” สำเร็จ`);
      setName("");
      await getCategory(token);
    } catch (err) {
      toast.error(err?.response?.data?.message || "เพิ่มหมวดหมู่ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id, label) => {
    if (!confirm(`ลบหมวดหมู่ “${label}” ?`)) return;
    try {
      setLoading(true);
      await removeCategory(token, id);
      toast.success(`ลบ “${label}” แล้ว`);
      await getCategory(token);
    } catch (err) {
      toast.error(err?.response?.data?.message || "ลบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (id, label) => {
    setEditId(id);
    setEditName(label);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return toast.warning("กรุณากรอกชื่อหมวดหมู่");
    try {
      setLoading(true);
      await updateCategory(token, editId, { name: editName.trim() });
      toast.success("บันทึกการแก้ไขแล้ว");
      cancelEdit();
      await getCategory(token);
    } catch (err) {
      toast.error(err?.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* หัวข้อ */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Category Management</h1>
        <p className="text-gray-500 text-sm">
          เพิ่ม / แก้ไข / ลบหมวดหมู่สำหรับจัดกลุ่มสินค้า
        </p>
      </div>

      {/* ฟอร์มเพิ่มหมวดหมู่ */}
      <form
        onSubmit={handleCreate}
        className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row gap-3"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500"
          type="text"
          placeholder="เช่น ทะเบียนรถผู้ขายสินค้า"
        />
        <button
          disabled={loading}
          className="rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 disabled:opacity-60"
        >
          Add Category
        </button>
      </form>

      {/* รายการหมวดหมู่ */}
      <div className="mt-6 bg-white rounded-xl shadow">
        <ul className="divide-y">
          {categories.map((item) => (
            <li key={item.id} className="p-3 flex items-center gap-3">
              {/* ชื่อ (โหมดดู / แก้) */}
              <div className="flex-1">
                {editId === item.id ? (
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                    placeholder="ตั้งชื่อหมวดหมู่"
                    autoFocus
                  />
                ) : (
                  <span className="text-gray-800">{item.name}</span>
                )}
              </div>

              {/* ปุ่มแอคชัน */}
              {editId === item.id ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={loading}
                    className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3 py-1 rounded-md bg-gray-200 hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(item.id, item.name)}
                    className="px-3 py-1 rounded-md bg-yellow-400 hover:bg-yellow-500 text-black"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.id, item.name)}
                    className="px-3 py-1 rounded-md bg-red-200 hover:bg-red-300 text-red-900"
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}

          {categories.length === 0 && (
            <li className="p-6 text-center text-gray-500">
              ยังไม่มีหมวดหมู่ สร้างรายการแรกได้ด้านบน
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FormCategory;
