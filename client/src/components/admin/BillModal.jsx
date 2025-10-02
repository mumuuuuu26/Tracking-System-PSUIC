import React, { useState, useEffect } from "react";
import { createBill } from "../../api/bill";
import useEcomStore from "../../store/ecom-store";
import { toast } from "react-toastify";
import { getPriceToday } from "../../api/palmPrice";
import dayjs from "dayjs";

const BillModal = ({ isOpen, onClose, initialPlate, initialCategory }) => {
  const token = useEcomStore((s) => s.token);
  const [plate, setPlate] = useState(initialPlate || "");
  const [categoryId, setCategoryId] = useState(initialCategory?.id || null);
  const [customerType, setCustomerType] = useState(
    initialCategory?.customerType || "retail"
  );
  const [weightIn, setWeightIn] = useState("");
  const [weightOut, setWeightOut] = useState("");
  const [todayPrice, setTodayPrice] = useState(null);

  useEffect(() => {
    setPlate(initialPlate || "");
    setCategoryId(initialCategory?.id || null);
    setCustomerType(initialCategory?.customerType || "retail");

    // load today's price for estimation
    getPriceToday()
      .then((res) => {
        setTodayPrice(res?.data || null);
      })
      .catch(() => setTodayPrice(null));
  }, [initialPlate, initialCategory]);

  const net = Math.max(Number(weightIn || 0) - Number(weightOut || 0), 0);
  const pricePerKg =
    customerType === "large"
      ? todayPrice?.priceMax || 0
      : todayPrice?.priceAvg || 0;
  const estimate = +(pricePerKg * net).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!plate) return toast.error("กรุณาระบุทะเบียนรถ");
      const payload = {
        plate,
        categoryId,
        customerType,
        weightIn: Number(weightIn),
        weightOut: Number(weightOut),
      };
      const res = await createBill(token, payload);
      toast.success("บันทึกบิลเรียบร้อย");
      onClose(true); // notify parent to refresh
    } catch (err) {
      console.log(err);
      toast.error(err?.response?.data?.message || "บันทึกบิลไม่สำเร็จ");
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6">
        <h2 className="text-lg font-semibold mb-4">
          สร้างบิล - {plate || "ทะเบียน"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              ทะเบียนรถ
              <input
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="w-full border rounded px-2 py-2"
              />
            </label>

            <label className="block">
              ประเภทลูกค้า
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value)}
                className="w-full border rounded px-2 py-2"
              >
                <option value="retail">ลูกค้ารายย่อย (ราคาเฉลี่ย)</option>
                <option value="large">ลูกค้ารายใหญ่ (ราคาสูงสุด)</option>
              </select>
            </label>

            <label className="block">
              น้ำหนักเข้า (กก.)
              <input
                value={weightIn}
                onChange={(e) => setWeightIn(e.target.value)}
                type="number"
                min="0"
                className="w-full border rounded px-2 py-2"
              />
            </label>

            <label className="block">
              น้ำหนักออก (กก.)
              <input
                value={weightOut}
                onChange={(e) => setWeightOut(e.target.value)}
                type="number"
                min="0"
                className="w-full border rounded px-2 py-2"
              />
            </label>
          </div>

          <div className="p-3 bg-gray-50 rounded">
            <div>
              วันที่ราคาอ้างอิง:{" "}
              {todayPrice ? dayjs(todayPrice.date).format("DD/MM/YYYY") : "-"}
            </div>
            <div>
              ราคาที่ใช้: {pricePerKg ? pricePerKg.toFixed(2) : "-"} บ./กก.
            </div>
            <div>น้ำหนักสุทธิ: {net} กก.</div>
            <div className="font-bold">จำนวนเงินประมาณ: {estimate} บาท</div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 border rounded"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded"
            >
              บันทึกบิล
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillModal;
