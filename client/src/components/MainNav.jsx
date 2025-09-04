// src/components/MainNav.jsx
import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logoImg from "../assets/logo1.png";

const MainNav = () => {
  const [open, setOpen] = useState(false);

  const linkCls = ({ isActive }) =>
    `px-3 py-2 rounded hover:bg-white/30 ${isActive ? "font-semibold" : ""}`;

  return (
    <nav className="bg-green-300">
      <div className="mx-auto max-w-screen-2xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center">
              <img src={logoImg} alt="Logo" className="h-16 w-auto" />
            </Link>
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/" className={linkCls}>
                Home
              </NavLink>
              <NavLink to="/price" className={linkCls}>
                Price
              </NavLink>
              <NavLink to="/cart" className={linkCls}>
                Cart
              </NavLink>
            </div>
          </div>

          {/* Right */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/register" className="px-3 py-2">
              Register
            </Link>
            <Link to="/login" className="px-3 py-2">
              Login
            </Link>
          </div>

          {/* Hamburger */}
          <button
            className="md:hidden text-black/80"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <i className="fas fa-bars text-xl" />
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-3">
            <div className="flex flex-col gap-2">
              <NavLink
                to="/"
                className={linkCls}
                onClick={() => setOpen(false)}
              >
                Home
              </NavLink>
              <NavLink
                to="/price"
                className={linkCls}
                onClick={() => setOpen(false)}
              >
                Price
              </NavLink>
              <NavLink
                to="/cart"
                className={linkCls}
                onClick={() => setOpen(false)}
              >
                Cart
              </NavLink>

              <div className="pt-2 border-t">
                <Link to="/register" className="px-3 py-2">
                  Register
                </Link>
                <Link to="/login" className="px-3 py-2">
                  Login
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
