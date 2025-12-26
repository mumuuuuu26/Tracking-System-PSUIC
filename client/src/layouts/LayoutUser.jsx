// client/src/layouts/LayoutUser.jsx
import React, { useState } from "react";
import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Home, Plus, Clock, User, Menu, X } from "lucide-react";
import useAuthStore from "../store/auth-store";

const LayoutUser = () => {
  const { user, actionLogout } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    actionLogout();
    setMobileMenuOpen(false);
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40 md:hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">🛠️</span>
            </div>
            <span className="font-semibold text-gray-800">PSUIC Service</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X size={24} />
                </button>
              </div>
            </div>
            <nav className="p-4">
              <a
                href="/user"
                className="block py-3 px-4 rounded-lg hover:bg-gray-100"
              >
                Dashboard
              </a>
              <a
                href="/user/create-ticket"
                className="block py-3 px-4 rounded-lg hover:bg-gray-100"
              >
                Create Ticket
              </a>
              <a
                href="/user/my-tickets"
                className="block py-3 px-4 rounded-lg hover:bg-gray-100"
              >
                My Tickets
              </a>
              <hr className="my-4" />
              <button
                onClick={handleLogout}
                className="w-full text-left block py-3 px-4 text-red-600 rounded-lg hover:bg-red-50"
              >
                Logout
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-30">
        <div className="grid grid-cols-4 py-2">
          <a
            href="/user"
            className={`flex flex-col items-center py-2 ${isActive("/user") ? "text-blue-600" : "text-gray-500"
              }`}
          >
            <Home size={20} />
            <span className="text-xs mt-1">Home</span>
          </a>
          <a
            href="/user/create-ticket"
            className={`flex flex-col items-center py-2 ${isActive("/user/create-ticket")
              ? "text-blue-600"
              : "text-gray-500"
              }`}
          >
            <Plus size={20} />
            <span className="text-xs mt-1">Create</span>
          </a>
          <a
            href="/user/my-tickets"
            className={`flex flex-col items-center py-2 ${isActive("/user/my-tickets") ? "text-blue-600" : "text-gray-500"
              }`}
          >
            <Clock size={20} />
            <span className="text-xs mt-1">History</span>
          </a>
          <a
            href="/user/profile"
            className={`flex flex-col items-center py-2 ${isActive("/user/profile") ? "text-blue-600" : "text-gray-500"
              }`}
          >
            <User size={20} />
            <span className="text-xs mt-1">Profile</span>
          </a>
        </div>
      </nav>
    </div>
  );
};

export default LayoutUser;
