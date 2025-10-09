import React from "react";
import { Outlet } from "react-router-dom";
import UserNav from "../components/user/UserNav";
import HomeUser from "../pages/user/HomeUser";

const LayoutAdmin = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex flex-col">
        <HomeUser />
        <UserNav />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default LayoutAdmin;
