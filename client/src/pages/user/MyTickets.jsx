import React, { useEffect, useState } from "react";
import axios from "axios";
import useEcomStore from "../../store/ecom-store";
import { Link } from "react-router-dom";

const MyTickets = () => {
  const token = useEcomStore((s) => s.token);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMyTickets();
  }, []);

  const fetchMyTickets = async () => {
    try {
      setLoading(true);
      // ดึงข้อมูลจาก API แจ้งซ่อม (ไม่ใช่ Product)
      const res = await axios.get("http://localhost:5001/api/ticket", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTickets(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-600";
      case "In Progress":
        return "bg-blue-100 text-blue-600";
      case "Resolved":
        return "bg-green-100 text-green-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">
          รายการแจ้งซ่อมของฉัน
        </h1>
        <Link
          to="/user/create-ticket"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + แจ้งเรื่องใหม่
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-6 py-4 font-semibold">หัวข้อปัญหา</th>
              <th className="px-6 py-4 font-semibold">หมวดหมู่</th>
              <th className="px-6 py-4 font-semibold">วันที่แจ้ง</th>
              <th className="px-6 py-4 font-semibold">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-4 text-center">
                  กำลังโหลด...
                </td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-4 text-center text-slate-400">
                  ยังไม่มีรายการแจ้งซ่อม
                </td>
              </tr>
            ) : (
              tickets.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {item.title}
                  </td>
                  <td className="px-6 py-4">{item.category?.name || "-"}</td>
                  <td className="px-6 py-4">
                    {new Date(item.createdAt).toLocaleDateString("th-TH")}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyTickets;
