import React from "react";
import { Receipt } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  ShoppingBag,
  LineChart,
  LogOut,
} from "lucide-react";
import logo from "../../assets/logo.png";
import useAppLogout from "../../hooks/useAppLogout";

const SidebarAdmin = () => {
  const handleLogout = useAppLogout();

  const base = "px-4 py-2 flex items-center rounded-md transition-colors";
  const active = "bg-gray-900 text-white";
  const idle = "text-gray-300 hover:bg-gray-700 hover:text-white";

  return (
    <div className="bg-gray-800 w-64 text-gray-100 flex flex-col h-screen">
      <div className="h-24 bg-gray-900 flex flex-col items-center justify-center">
        <img src={logo} alt="Banklang Palm Logo" className="h-12 w-auto mb-1" />
        <span className="text-lg font-bold text-emerald-400">
          Banklang Palm
        </span>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-2">
        <NavLink
          end
          to="/admin"
          className={({ isActive }) => `${base} ${isActive ? active : idle}`}
        >
          <LayoutDashboard className="mr-2" />
          Dashboard
        </NavLink>

        <NavLink
          to="/admin/history"
          className={({ isActive }) => `${base} ${isActive ? active : idle}`}
        >
          <Receipt className="mr-2" />
          History
        </NavLink>

        <NavLink
          to="category"
          className={({ isActive }) => `${base} ${isActive ? active : idle}`}
        >
          <FolderKanban className="mr-2" />
          Manage
        </NavLink>

        <NavLink
          to="product"
          className={({ isActive }) => `${base} ${isActive ? active : idle}`}
        >
          <ShoppingBag className="mr-2" />
          Product
        </NavLink>

        <NavLink
          to="daily-price"
          className={({ isActive }) => `${base} ${isActive ? active : idle}`}
        >
          <LineChart className="mr-2" />
          Daily Price
        </NavLink>
      </nav>

      {/* ปุ่ม Logout (เรียก hook กลาง) */}
      <div className="p-2">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-gray-700 hover:text-red-300 rounded-md"
        >
          <LogOut className="mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default SidebarAdmin;
