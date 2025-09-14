import React from "react";
import useEcomStore from "../../store/ecom-store";
import useAppLogout from "../../hooks/useAppLogout";

const HeaderAdmin = () => {
  const user = useEcomStore((s) => s.user);
  const handleLogout = useAppLogout(); // ✅ ใช้ hook กลาง

  return (
    <header className="bg-white h-16 flex items-center justify-between px-6 shadow">
      <h1 className="text-lg font-semibold text-emerald-600">
        Banklang Palm Admin
      </h1>

      <div className="flex items-center gap-4">
        {user && (
          <span className="text-gray-700 text-sm">
            {user.email} ({user.role})
          </span>
        )}
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default HeaderAdmin;
