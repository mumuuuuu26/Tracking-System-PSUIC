import React, { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Home, DollarSign, Clock, LayoutGrid, LogIn, UserPlus, User, Menu, X } from "lucide-react";
import logo from "../../assets/logo.png";
import useEcomStore from "../../store/ecom-store";

const SidebarUser = () => {
  const [open, setOpen] = useState(false);
  const user = useEcomStore((s) => s.user);

  const navLinkClass = ({ isActive }) =>
    isActive
      ? "px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg flex items-center gap-2"
      : "px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2";

  return (
    <nav className="bg-gray-800 border-b border-gray-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0">
            <img src={logo} alt="Logo" className="h-10 w-auto" />
            <span className="text-xl font-bold text-emerald-400 hidden sm:block">
              Banklang Palm
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={navLinkClass}>
              <Home size={18} />
              <span>Home</span>
            </NavLink>
            <NavLink to="/price" className={navLinkClass}>
              <DollarSign size={18} />
              <span>Price</span>
            </NavLink>
            {user && (
              <NavLink to="/history" className={navLinkClass}>
                <Clock size={18} />
                <span>History</span>
              </NavLink>
            )}
          </div>

          {/* Desktop User Section */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg">
                  <User size={16} className="text-emerald-400" />
                  <span className="text-sm text-gray-200">{user.email}</span>
                </div>
                <Link
                  to={user.role === "admin" ? "/admin" : "/user"}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <LayoutGrid size={18} />
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors font-medium"
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <LogIn size={18} />
                  Login
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {open && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <div className="flex flex-col gap-2">
              <NavLink 
                to="/" 
                className={navLinkClass}
                onClick={() => setOpen(false)}
              >
                <Home size={18} />
                <span>Home</span>
              </NavLink>
              <NavLink 
                to="/price" 
                className={navLinkClass}
                onClick={() => setOpen(false)}
              >
                <DollarSign size={18} />
                <span>Price</span>
              </NavLink>
              {user && (
                <NavLink 
                  to="/history" 
                  className={navLinkClass}
                  onClick={() => setOpen(false)}
                >
                  <Clock size={18} />
                  <span>History</span>
                </NavLink>
              )}

              <div className="pt-3 mt-3 border-t border-gray-700 space-y-2">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg">
                      <User size={16} className="text-emerald-400" />
                      <span className="text-sm text-gray-200">{user.email}</span>
                    </div>
                    <Link
                      to={user.role === "admin" ? "/admin" : "/user"}
                      className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 justify-center"
                      onClick={() => setOpen(false)}
                    >
                      <LayoutGrid size={18} />
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="w-full px-4 py-2 text-center text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors font-medium block"
                      onClick={() => setOpen(false)}
                    >
                      Register
                    </Link>
                    <Link
                      to="/login"
                      className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 justify-center"
                      onClick={() => setOpen(false)}
                    >
                      <LogIn size={18} />
                      Login
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default SidebarUser;