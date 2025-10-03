import React, { useEffect, useState } from "react";
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
  const [customerType, setCustomerType] = useState("retail");
  const [loading, setLoading] = useState(false);

  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("retail");

  useEffect(() => {
    getCategory(token);
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.warning("กรุณากรอกทะเบียนรถ");
    try {
      setLoading(true);
      const res = await createCategory(token, {
        name: name.trim(),
        customerType,
      });
      toast.success(`เพิ่มทะเบียน ${res.data.name} (${res.data.customerType})`);
      setName("");
      setCustomerType("retail");
      await getCategory(token);
    } catch (err) {
      toast.error(err?.response?.data?.message || "เพิ่มไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id, label) => {
    if (!confirm(`ลบ ${label} ?`)) return;
    try {
      setLoading(true);
      await removeCategory(token, id);
      toast.success(`ลบ ${label} แล้ว`);
      await getCategory(token);
    } catch (err) {
      toast.error(err?.response?.data?.message || "ลบไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (id, label, type) => {
    setEditId(id);
    setEditName(label);
    setEditType(type || "retail");
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
    setEditType("retail");
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return toast.warning("กรุณากรอกทะเบียนรถ");
    try {
      setLoading(true);
      await updateCategory(token, editId, {
        name: editName.trim(),
        customerType: editType,
      });
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">
                จัดการทะเบียนรถ
              </h1>
              <p className="text-gray-600 mt-1">
                เพิ่ม แก้ไข และลบทะเบียนรถพร้อมระบุประเภทลูกค้า
              </p>
            </div>
          </div>
        </div>

        {/* Add Category Form */}
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800">
              เพิ่มทะเบียนรถใหม่
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ทะเบียนรถ
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleCreate(e)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200"
                type="text"
                placeholder="เช่น กท 1234"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภทลูกค้า
              </label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-200 bg-white cursor-pointer"
              >
                <option value="retail">ลูกค้ารายย่อย (ราคาเฉลี่ย)</option>
                <option value="large">ลูกค้ารายใหญ่ (ราคาสูงสุด)</option>
              </select>
            </div>

            <div className="md:col-span-3 flex items-end">
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
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
                    กำลังเพิ่ม...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    เพิ่มทะเบียน
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800">
                รายการทะเบียนรถทั้งหมด
              </h2>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                {categories.length} รายการ
              </span>
            </div>
          </div>

          <ul className="divide-y divide-gray-100">
            {categories.map((item, index) => (
              <li
                key={item.id}
                className="p-5 hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-semibold text-gray-600 text-sm shadow-sm">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    {editId === item.id ? (
                      <div className="flex flex-col sm:flex-row gap-3">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 rounded-xl border-2 border-blue-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                          placeholder="ทะเบียนรถ"
                          autoFocus
                        />
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value)}
                          className="rounded-xl border-2 border-blue-300 px-4 py-2 outline-none focus:border-blue-500 bg-white cursor-pointer"
                        >
                          <option value="retail">ลูกค้ารายย่อย</option>
                          <option value="large">ลูกค้ารายใหญ่</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-lg font-semibold text-gray-800">
                          {item.name}
                        </span>
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm"
                          style={{
                            background:
                              item.customerType === "large"
                                ? "#fef3c7"
                                : "#d1fae5",
                            color:
                              item.customerType === "large"
                                ? "#92400e"
                                : "#065f46",
                          }}
                        >
                          {item.customerType === "large"
                            ? "รายใหญ่"
                            : "รายย่อย"}
                        </span>
                      </div>
                    )}
                  </div>

                  {editId === item.id ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        <span className="flex items-center gap-1.5">
                          <svg
                            className="w-4 h-4"
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
                          บันทึก
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 shadow-md hover:shadow-lg transition-all duration-200"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          startEdit(item.id, item.name, item.customerType)
                        }
                        className="px-4 py-2 rounded-xl bg-amber-400 text-amber-900 font-medium hover:bg-amber-500 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        <span className="flex items-center gap-1.5">
                          <svg
                            className="w-4 h-4"
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
                          แก้ไข
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id, item.name)}
                        className="px-4 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                      >
                        <span className="flex items-center gap-1.5">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          ลบ
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}

            {categories.length === 0 && (
              <li className="p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium">ยังไม่มีทะเบียนรถ</p>
                  <p className="text-gray-400 text-sm">
                    เริ่มต้นโดยการเพิ่มทะเบียนรถใหม่ด้านบน
                  </p>
                </div>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FormCategory;
