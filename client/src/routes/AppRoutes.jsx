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
import Profile from "../pages/user/Profile";

// Admin
import Dashboard from "../pages/admin/Dashboard";
import AllTickets from "../pages/admin/AllTickets";
import UserManagement from "../pages/admin/UserManagement";
import ITManagement from "../pages/admin/ITManagement";
import RoomManagement from "../pages/admin/RoomManagement";

// IT
import ITDashboard from "../pages/it/Dashboard";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      {/* Public Routes (Standalone) */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<PSUCallback />} />

      {/* Main Layout Routes (Optional: if there are other public pages that need layout, put them here) */}
      {/* <Route element={<Layout />}> ... </Route> */}

      {/* User Routes */}
      <Route path="user" element={<LayoutUser />}>
        <Route index element={<HomeUser />} />
        <Route path="my-tickets" element={<MyTickets />} />
        <Route path="create-ticket" element={<CreateTicket />} />
        <Route path="scan-qr" element={<ScanQR />} />
        <Route path="equipment/:id" element={<EquipmentDetail />} />
        <Route path="ticket/:id" element={<TicketDetail />} />
        <Route path="quick-fix" element={<QuickFix />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Admin Routes */}
      <Route path="admin" element={<LayoutAdmin />}>
        <Route index element={<Dashboard />} />
        <Route path="tickets" element={<AllTickets />} />
        <Route path="manage-users" element={<UserManagement />} />
        <Route path="manage-it" element={<ITManagement />} />
        <Route path="manage-rooms" element={<RoomManagement />} />
      </Route>

      {/* IT Support Routes */}
      <Route path="it" element={<LayoutIT />}>
        <Route index element={<ITDashboard />} />
      </Route>

      <Route path="*" element={<h1>404 Not Found</h1>} />
    </Routes>
  );
};

export default AppRoutes;
