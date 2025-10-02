import React, { useEffect, useState } from "react";
import useEcomStore from "../../store/ecom-store";
import { listBills, searchBills, updateBill, deleteBill } from "../../api/bill";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { Pencil, Trash2, X, Check } from "lucide-react";

const Bills = () => {
  const token = useEcomStore((s) => s.token);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = async () => {
    try {
      const res = await listBills(token);
      setRows(res.data || []);
    } catch (err) {
      console.log(err);
      toast.error("โหลดบิลไม่สำเร็จ");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSearch = async (e) => {
    e.preventDefault();
    if (!q.trim()) return load();
    try {
      const res = await searchBills(token, q);
      setRows(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const startEdit = (bill) => {
    setEditId(bill.id);
    setEditForm({
      weightIn: bill.weightIn,
      weightOut: bill.weightOut,
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditForm({});
  };

  const saveEdit = async (id) => {
    try {
      await updateBill(token, id, editForm);
      toast.success("แก้ไขบิลสำเร็จ");
      cancelEdit();
      load();
    } catch (err) {
      toast.error("แก้ไขไม่สำเร็จ");
    }
  };

  const handleDelete = async (id, plate) => {
    if (!confirm(`ลบบิล ${plate}?`)) return;
    try {
      await deleteBill(token, id);
      toast.success("ลบบิลสำเร็จ");
      load();
    } catch (err) {
      toast.error("ลบไม่สำเร็จ");
    }
  };

  const fmt = (n) =>
    Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">ประวัติบิลย้อนหลัง</h1>

      <form onSubmit={onSearch} className="mb-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาทะเบียน..."
          className="border rounded px-3 py-2 flex-1 max-w-xs"
        />
        <button className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700">
          ค้นหา
        </button>
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              load();
            }}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            ล้าง
          </button>
        )}
      </form>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">วันที่</th>
              <th className="p-3 text-left">ทะเบียน</th>
              <th className="p-3 text-center">ประเภท</th>
              <th className="p-3 text-center">น้ำหนักเข้า</th>
              <th className="p-3 text-center">น้ำหนักออก</th>
              <th className="p-3 text-center">น้ำหนักสุทธิ</th>
              <th className="p-3 text-center">ราคา/กก.</th>
              <th className="p-3 text-center">จำนวนเงิน</th>
              <th className="p-3 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isEditing = editId === r.id;
              const netWeight = isEditing
                ? Math.max(
                    (editForm.weightIn || 0) - (editForm.weightOut || 0),
                    0
                  )
                : r.netWeight;
              const amount = netWeight * r.pricePerKg;

              return (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    {dayjs(r.createdAt).format("DD/MM/YY HH:mm")}
                  </td>
                  <td className="p-3 font-medium">{r.plate}</td>
                  <td className="p-3 text-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        r.customerType === "large"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {r.customerType === "large" ? "รายใหญ่" : "รายย่อย"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.weightIn}
                        onChange={(e) =>
                          setEditForm({ ...editForm, weightIn: e.target.value })
                        }
                        className="w-20 border rounded px-2 py-1 text-center"
                      />
                    ) : (
                      fmt(r.weightIn)
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.weightOut}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            weightOut: e.target.value,
                          })
                        }
                        className="w-20 border rounded px-2 py-1 text-center"
                      />
                    ) : (
                      fmt(r.weightOut)
                    )}
                  </td>
                  <td className="p-3 text-center font-medium">
                    {fmt(netWeight)}
                  </td>
                  <td className="p-3 text-center">{fmt(r.pricePerKg)}</td>
                  <td className="p-3 text-center font-bold text-emerald-600">
                    {fmt(amount)}
                  </td>
                  <td className="p-3 text-center">
                    {isEditing ? (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => saveEdit(r.id)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => startEdit(r)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.plate)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-500">
                  ไม่พบข้อมูลบิล
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bills;
