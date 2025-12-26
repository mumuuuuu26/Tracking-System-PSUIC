import React from "react";
import { Link } from "react-router-dom";
import { Wrench, User } from "lucide-react";

const MainNav = () => {
  return (
    <nav className="bg-white shadow-sm border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex flex-shrink-0 items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <Wrench className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">
                PSUIC Service
              </span>
            </Link>
          </div>

          {/* Right Menu Section */}
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-all hover:shadow-md"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MainNav;
