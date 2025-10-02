import React, { useEffect, useState } from "react";
import useEcomStore from "../../store/ecom-store";
import { listBills, searchBills } from "../../api/bill";
import { toast } from "react-toastify";

const Bills = () => {
  const token = useEcomStore((s) => s.token);
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  const load = async () => {
    try {
      const res = await listBills(token);
      setRows(res.data);
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
    try {
      const res = await searchBills(token, q);
      setRows(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">รายการบิล</h1>
      <form onSubmit={onSearch} className="mb-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ค้นหาทะเบียน..."
          className="border px-2 py-1"
        />
        <button className="bg-emerald-600 text-white px-3 py-1 rounded">
          ค้นหา
        </button>
      </form>

      <div className="bg-white rounded p-3">
        <table className="w-full">
          <thead>
            <tr>
              <th>ทะเบียน</th>
              <th>ประเภท</th>
              <th>น้ำหนักสุทธิ</th>
              <th>ราคาต่อกก.</th>
              <th>จำนวนเงิน</th>
              <th>วันที่</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.plate}</td>
                <td>{r.customerType}</td>
                <td>{r.netWeight}</td>
                <td>{r.pricePerKg}</td>
                <td>{r.amount}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Bills;
