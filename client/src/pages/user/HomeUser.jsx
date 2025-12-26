import React from "react";
import { Link } from "react-router-dom";
import { Wrench, FileText, History } from "lucide-react";

const HomeUser = () => {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">สวัสดีครับ! 👋</h1>
        <p className="mt-2 opacity-90">
          มีปัญหาอุปกรณ์คอมพิวเตอร์ หรือห้องเรียน แจ้งเราได้เลย
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: แจ้งซ่อม */}
        <Link
          to="/user/create-ticket"
          className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-10 transition hover:border-blue-500 hover:bg-white hover:shadow-md"
        >
          <div className="mb-4 rounded-full bg-blue-100 p-4 text-blue-600 transition group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
            <Wrench className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-700">แจ้งซ่อมใหม่</h2>
          <p className="text-sm text-slate-500">Create New Ticket</p>
        </Link>

        {/* Card 2: ติดตามสถานะ */}
        <Link
          to="/user/my-tickets"
          className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
        >
          <div>
            <div className="mb-4 inline-block rounded-lg bg-green-100 p-3 text-green-600">
              <FileText className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">ติดตามสถานะ</h2>
            <p className="text-sm text-slate-500">
              เช็คสถานะรายการที่แจ้งไปแล้ว
            </p>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-blue-600">
            ดูรายการทั้งหมด &rarr;
          </div>
        </Link>

        {/* Card 3: ประวัติ (Optional) */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm opacity-60">
          {/* ใส่ opacity ไว้ก่อนเพราะอาจจะยังไม่ทำ */}
          <div>
            <div className="mb-4 inline-block rounded-lg bg-orange-100 p-3 text-orange-600">
              <History className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">ประวัติการซ่อม</h2>
            <p className="text-sm text-slate-500">รายการที่ซ่อมเสร็จสิ้นแล้ว</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeUser;
