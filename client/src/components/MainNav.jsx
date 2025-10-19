import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logoImg from "../assets/logo1.png";

const MainNav = () => {
  const [open, setOpen] = useState(false);

  const linkCls = ({ isActive }) =>
    `px-3 py-2 rounded hover:bg-white/30 ${isActive ? "font-semibold" : ""}`;

  return (
    <nav>
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center">
              <img src={logoImg} alt="Logo" className="h-16 w-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/" className={linkCls}>
                หน้าหลัก
              </NavLink>
              <NavLink to="/price" className={linkCls}>
                ราคาปาล์มวันนี้
              </NavLink>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/register" className="px-3 py-2">
              สมัครสมาชิก
            </Link>
            <Link to="/login" className="px-3 py-2">
              เข้าสู่ระบบ
            </Link>
          </div>

          <button
            className="md:hidden text-black/80"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <i className="fas fa-bars text-xl" />
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-3">
            <div className="flex flex-col gap-2">
              <NavLink
                to="/"
                className={linkCls}
                onClick={() => setOpen(false)}
              >
                หน้าหลัก
              </NavLink>
              <NavLink
                to="/price"
                className={linkCls}
                onClick={() => setOpen(false)}
              >
                ราคาปาล์มวันนี้
              </NavLink>

              <div className="pt-2 border-t">
                <Link to="/register" className="px-3 py-2">
                  สมัครสมาชิก
                </Link>
                <Link to="/login" className="px-3 py-2">
                  เข้าสู่ระบบ
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default MainNav;
