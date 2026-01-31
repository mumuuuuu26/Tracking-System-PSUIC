import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "../layouts/Layout";
import LayoutUser from "../layouts/LayoutUser";
import LayoutAdmin from "../layouts/LayoutAdmin";
import LayoutIT from "../layouts/LayoutIT";
import PSUCallback from "../pages/auth/PSUCallback";
import ScanQR from "../pages/user/ScanQR";
import TicketDetail from "../pages/user/TicketDetail";
import EquipmentDetail from "../pages/user/EquipmentDetail";

// Auth
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// User
import HomeUser from "../pages/user/HomeUser";
import MyTickets from "../pages/user/MyTickets";
import CreateTicket from "../pages/user/CreateTicket";
import Profile from "../pages/user/Profile";
import ITSchedule from "../pages/user/ITSchedule"; // [NEW]

import Feedback from "../pages/user/Feedback";
import WaitingForFeedback from "../pages/user/WaitingForFeedback";
import QuickFix from "../pages/user/QuickFix";

// Admin
import Dashboard from "../pages/admin/Dashboard";
import UserManagement from "../pages/admin/UserManagement";
import ITManagement from "../pages/admin/ITManagement";
import RoomManagement from "../pages/admin/RoomManagement";
import CategoryManagement from "../pages/admin/CategoryManagement";
import EquipmentManagement from "../pages/admin/EquipmentManagement";
import ReportDashboard from "../pages/admin/reports/ReportDashboard";
import AdminProfile from "../pages/admin/Profile";
import AdminTicketDetail from "../pages/admin/TicketDetail";
import Permission from "../pages/admin/Permission";


// IT
import ITDashboard from "../pages/it/Dashboard";

import Notifications from "../pages/it/Notifications";
import ITProfile from "../pages/it/Profile";
import History from "../pages/it/History";

import Tickets from "../pages/it/Tickets";
import ITTicketDetail from "../pages/it/TicketDetail";



import QuickFixManagement from "../pages/admin/QuickFixManagement";
import ITScheduleInternal from "../pages/it/Schedule"; // [NEW] Renamed to avoid Import Conflict? No, user route is ITSchedule





const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<PSUCallback />} />

      {/* User Routes */}
      <Route path="user" element={<LayoutUser />}>
        <Route index element={<HomeUser />} />
        <Route path="my-tickets" element={<MyTickets />} />
        <Route path="create-ticket" element={<CreateTicket />} />

        <Route path="scan-qr" element={<ScanQR />} />
        <Route path="equipment/:id" element={<EquipmentDetail />} />
        <Route path="ticket/:id" element={<TicketDetail />} />

        <Route path="profile" element={<Profile />} />
        <Route path="it-schedule" element={<ITSchedule />} /> {/* [NEW] */}
        <Route path="feedback" element={<WaitingForFeedback />} />
        <Route path="feedback/:ticketId" element={<Feedback />} />
        <Route path="quick-fix" element={<QuickFix />} />
      </Route>

      {/* Admin Routes */}
      <Route path="admin" element={<LayoutAdmin />}>
        <Route index element={<Dashboard />} />

        <Route path="manage-users" element={<UserManagement />} />
        <Route path="manage-it" element={<ITManagement />} />
        <Route path="manage-rooms" element={<RoomManagement />} />
        <Route path="manage-categories" element={<CategoryManagement />} />
        <Route path="manage-equipment" element={<EquipmentManagement />} />
        <Route path="reports" element={<ReportDashboard />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="ticket/:id" element={<AdminTicketDetail />} />
        <Route path="permission" element={<Permission />} />
        <Route path="quick-fix" element={<QuickFixManagement />} />

      </Route>

      {/* IT Support Routes */}
      <Route path="it" element={<LayoutIT />}>
        <Route index element={<ITDashboard />} />

        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<ITProfile />} />
        <Route path="history" element={<History />} />

        <Route path="tickets" element={<Tickets />} />
        <Route path="ticket/:id" element={<ITTicketDetail />} />
        <Route path="schedule" element={<ITScheduleInternal />} /> {/* [NEW] */}





      </Route>

      <Route path="*" element={<h1>404 Not Found</h1>} />



    </Routes>
  );
};

export default AppRoutes;
