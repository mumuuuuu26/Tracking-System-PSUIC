import React from "react";
import { Route, Routes } from "react-router-dom";
// Layouts
import Layout from "../layouts/Layout";
import LayoutUser from "../layouts/LayoutUser";
import LayoutAdmin from "../layouts/LayoutAdmin";
// Auth Pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
// User Pages
import HomeUser from "../pages/user/HomeUser";
import MyTickets from "../pages/user/MyTickets";
import CreateTicket from "../pages/user/CreateTicket";
// Admin Pages
import Dashboard from "../pages/admin/Dashboard";
import Category from "../pages/admin/Category";
// Protect Routes
import ProtectRoteUser from "./ProtectRoteUser";
import ProtectRouteAdmin from "./ProtectRouteAdmin";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes - ใครก็เข้าได้ */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Login />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
      </Route>

      {/* User Routes - ต้อง Login เป็น User */}
      <Route
        path="user"
        element={
          <ProtectRoteUser>
            <LayoutUser />
          </ProtectRoteUser>
        }
      >
        <Route index element={<HomeUser />} />
        <Route path="my-tickets" element={<MyTickets />} />
        <Route path="create-ticket" element={<CreateTicket />} />
      </Route>

      {/* Admin Routes - ต้อง Login เป็น Admin */}
      <Route
        path="admin"
        element={
          <ProtectRouteAdmin>
            <LayoutAdmin />
          </ProtectRouteAdmin>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="category" element={<Category />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
