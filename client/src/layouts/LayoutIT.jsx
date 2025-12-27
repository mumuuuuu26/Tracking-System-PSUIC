import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import MainNav from "../components/MainNav";
import ITBottomNav from "../components/ITBottomNav";
import useAuthStore from "../store/auth-store";

const LayoutIT = () => {
  const { user } = useAuthStore();

  // Assuming role is 'it_support' based on backend
  if (!user || user.role !== "it_support") {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <MainNav />
      <div className="flex flex-1 container mx-auto p-4 gap-4">
        <aside className="w-64 bg-white shadow rounded-lg p-4 h-fit hidden md:block">
          <h2 className="font-bold mb-4 text-slate-700">IT Support Menu</h2>
          <ul className="space-y-2">
            <li>
              <a
                href="/it"
                className="block text-slate-600 hover:text-blue-600"
              >
                My Tasks
              </a>
            </li>
            <li>
              <a
                href="/it/history"
                className="block text-slate-600 hover:text-blue-600"
              >
                History
              </a>
            </li>
          </ul>
        </aside>

        <main className="flex-1 pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      <div className="md:hidden">
        <ITBottomNav />
      </div>
    </div>
  );
};

export default LayoutIT;
