import React from "react";
import { NavLink } from "react-router-dom";
import { Receipt, DollarSign, Calculator } from "lucide-react";

const UserNav = () => {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? "bg-emerald-600 text-white font-semibold"
        : "text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
    }`;

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 py-4">
          <NavLink to="/user" end className={linkClass}>
            <Receipt size={20} />
            <span>บันทึกการซื้อขาย</span>
          </NavLink>

          <NavLink to="/user/price" className={linkClass}>
            <DollarSign size={20} />
            <span>ราคาปาล์มวันนี้</span>
          </NavLink>

          <NavLink to="/user/calculator" className={linkClass}>
            <Calculator size={20} />
            <span>คำนวณน้ำหนักสุทธิ</span>
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default UserNav;
