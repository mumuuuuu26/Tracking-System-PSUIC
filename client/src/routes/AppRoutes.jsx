import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "../layouts/Layout";
import LayoutUser from "../layouts/LayoutUser";
import LayoutAdmin from "../layouts/LayoutAdmin";
import LayoutIT from "../layouts/LayoutIT";
import PSUCallback from "../pages/auth/PSUCallback";
import ScanQR from "../pages/user/ScanQR";
import TicketDetail from "../pages/user/TicketDetail";
import EquipmentDetail from "../pages/user/EquipmentDetail";
import QuickFix from "../pages/user/QuickFix";
// Auth
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// User
import HomeUser from "../pages/user/HomeUser";
import MyTickets from "../pages/user/MyTickets";
import CreateTicket from "../pages/user/CreateTicket";

// Admin
import Dashboard from "../pages/admin/Dashboard";
import AllTickets from "../pages/admin/AllTickets";

// IT
import MyTasks from "../pages/it/MyTasks";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Login />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="auth/callback" element={<PSUCallback />} />
      </Route>

      {/* User Routes */}
      <Route path="user" element={<LayoutUser />}>
        <Route index element={<HomeUser />} />
        <Route path="my-tickets" element={<MyTickets />} />
        <Route path="create-ticket" element={<CreateTicket />} />
        <Route path="scan-qr" element={<ScanQR />} />
        <Route path="equipment/:id" element={<EquipmentDetail />} />
        <Route path="ticket/:id" element={<TicketDetail />} />
        <Route path="quick-fix" element={<QuickFix />} />
      </Route>

      {/* Admin Routes */}
      <Route path="admin" element={<LayoutAdmin />}>
        <Route index element={<Dashboard />} />
        <Route path="tickets" element={<AllTickets />} />
      </Route>

      {/* IT Support Routes */}
      <Route path="it" element={<LayoutIT />}>
        <Route index element={<MyTasks />} />
      </Route>

      <Route path="*" element={<h1>404 Not Found</h1>} />
    </Routes>
  );
};

export default AppRoutes;
