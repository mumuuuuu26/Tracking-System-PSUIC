import React, { useEffect, useState } from "react";
import {
  createCategory,
  listCategory,
  removeCategory,
  updateCategory,
} from "../../api/Category";
import useEcomStore from "../../store/ecom-store";
import { toast } from "react-toastify";
import BillModal from "./BillModal";

const FormCategory = () => {
  const token = useEcomStore((s) => s.token);
  const categories = useEcomStore((s) => s.categories);
  const getCategory = useEcomStore((s) => s.getCategory);

  const [name, setName] = useState("");
  const [customerType, setCustomerType] = useState("retail"); // default
  const [loading, setLoading] = useState(false);

  // สำหรับ BillModal
  const [openBill, setOpenBill] = useState(false);
  const [billInitial, setBillInitial] = useState(null);

  const openCreateBill = (item) => {
    setBillInitial(item);
    setOpenBill(true);
  };

  // edit state
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
    <div className="mx-auto max-w-4xl">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">Category Management</h1>
        <p className="text-gray-500 text-sm">
          เพิ่ม / แก้ไข / ลบทะเบียนรถ และระบุประเภทลูกค้า (รายใหญ่ / รายย่อย)
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="bg-white rounded-xl shadow p-4 flex flex-col sm:flex-row gap-3 items-center"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-emerald-500"
          type="text"
          placeholder="เช่น กท 1234 (ทะเบียนรถผู้ขายสินค้า)"
        />

        <select
          value={customerType}
          onChange={(e) => setCustomerType(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 outline-none"
        >
          <option value="retail">ลูกค้ารายย่อย (ราคาเฉลี่ย)</option>
          <option value="large">ลูกค้ารายใหญ่ (ราคาสูงสุด)</option>
        </select>

        <button
          disabled={loading}
          className="rounded-lg bg-emerald-600 text-white px-4 py-2 hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Processing..." : "Add Category"}
        </button>
      </form>

      <div className="mt-6 bg-white rounded-xl shadow">
        <ul className="divide-y">
          {categories.map((item) => (
            <li key={item.id} className="p-3 flex items-center gap-3">
              <div className="flex-1">
                {editId === item.id ? (
                  <div className="flex gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                      placeholder="ทะเบียนรถ"
                      autoFocus
                    />
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2"
                    >
                      <option value="retail">ลูกค้ารายย่อย</option>
                      <option value="large">ลูกค้ารายใหญ่</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-gray-800">{item.name}</span>
                    <span
                      className="text-xs px-2 py-1 rounded-full ml-3"
                      style={{
                        background:
                          item.customerType === "large" ? "#fffbeb" : "#f0fdf4",
                        color:
                          item.customerType === "large" ? "#92400e" : "#065f46",
                      }}
                    >
                      {item.customerType === "large" ? "รายใหญ่" : "รายย่อย"}
                    </span>
                  </div>
                )}
              </div>

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
                    onClick={() => openCreateBill(item)}
                    className="px-3 py-1 rounded-md bg-green-500 hover:bg-green-600 text-white"
                  >
                    Create Bill
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      startEdit(item.id, item.name, item.customerType)
                    }
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
            <li className="p-6 text-center text-gray-500">ยังไม่มีทะเบียนรถ</li>
          )}
        </ul>
      </div>

      {/* BillModal */}
      <BillModal
        isOpen={openBill}
        onClose={(refresh) => {
          setOpenBill(false);
          setBillInitial(null);
          if (refresh) {
            getCategory(token); // หรือ refresh bills list ก็ได้
          }
        }}
        initialPlate={billInitial?.name}
        initialCategory={billInitial}
      />
    </div>
  );
};

export default FormCategory;
