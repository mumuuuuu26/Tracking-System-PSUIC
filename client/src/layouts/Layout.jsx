import React from "react";
import { Outlet } from "react-router-dom";
import MainNav from "../components/MainNav"; // ✅ ต้อง Import ให้ถูก path

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <MainNav /> {/* แสดงเมนูบาร์ด้านบน */}
      <main className="flex-1">
        <Outlet /> {/* เนื้อหาหน้าเว็บ (Login/Register) จะโผล่ตรงนี้ */}
      </main>
    </div>
  );
};

export default Layout;
