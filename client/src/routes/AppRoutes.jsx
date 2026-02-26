import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { lazyWithRetry } from "../utils/lazyWithRetry";

const LayoutUser = lazyWithRetry(() => import("../layouts/LayoutUser"));
const LayoutAdmin = lazyWithRetry(() => import("../layouts/LayoutAdmin"));
const LayoutIT = lazyWithRetry(() => import("../layouts/LayoutIT"));

const Login = lazyWithRetry(() => import("../pages/auth/Login"));
const Register = lazyWithRetry(() => import("../pages/auth/Register"));
const PSUCallback = lazyWithRetry(() => import("../pages/auth/PSUCallback"));
const QRScanRedirect = lazyWithRetry(() => import("../pages/public/QRScanRedirect"));

const HomeUser = lazyWithRetry(() => import("../pages/user/HomeUser"));
const CreateTicket = lazyWithRetry(() => import("../pages/user/CreateTicket"));
const UserHistory = lazyWithRetry(() => import("../pages/user/History"));
const Profile = lazyWithRetry(() => import("../pages/user/Profile"));
const ITSchedule = lazyWithRetry(() => import("../pages/user/ITSchedule"));
const QuickFix = lazyWithRetry(() => import("../pages/user/QuickFix"));
const Report = lazyWithRetry(() => import("../pages/user/Report"));
const ScanQR = lazyWithRetry(() => import("../pages/user/ScanQR"));
const TicketDetail = lazyWithRetry(() => import("../pages/user/TicketDetail"));
const EquipmentDetail = lazyWithRetry(() => import("../pages/user/EquipmentDetail"));

const Dashboard = lazyWithRetry(() => import("../pages/admin/Dashboard"));
const UserManagement = lazyWithRetry(() => import("../pages/admin/UserManagement"));
const RoomManagement = lazyWithRetry(() => import("../pages/admin/RoomManagement"));
const CategoryManagement = lazyWithRetry(() => import("../pages/admin/CategoryManagement"));
const EquipmentManagement = lazyWithRetry(() => import("../pages/admin/EquipmentManagement"));
const ReportDashboard = lazyWithRetry(() => import("../pages/admin/reports/ReportDashboard"));
const AdminProfile = lazyWithRetry(() => import("../pages/admin/Profile"));
const AdminTicketDetail = lazyWithRetry(() => import("../pages/admin/TicketDetail"));
const Permission = lazyWithRetry(() => import("../pages/admin/Permission"));
const QuickFixManagement = lazyWithRetry(() => import("../pages/admin/QuickFixManagement"));

const ITDashboard = lazyWithRetry(() => import("../pages/it/Dashboard"));
const Notifications = lazyWithRetry(() => import("../pages/it/Notifications"));
const ITProfile = lazyWithRetry(() => import("../pages/it/Profile"));
const History = lazyWithRetry(() => import("../pages/it/History"));
const Tickets = lazyWithRetry(() => import("../pages/it/Tickets"));
const ITTicketDetail = lazyWithRetry(() => import("../pages/it/TicketDetail"));
const ITScheduleInternal = lazyWithRetry(() => import("../pages/it/Schedule"));

const RouteLoadingFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-500">
    Loading...
  </div>
);

const AppRoutes = () => (
  <Suspense fallback={<RouteLoadingFallback />}>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/auth/callback" element={<PSUCallback />} />
      <Route path="/scan" element={<QRScanRedirect />} />
      <Route path="/scan/:qrCode" element={<QRScanRedirect />} />

      <Route path="user" element={<LayoutUser />}>
        <Route index element={<HomeUser />} />
        <Route path="create-ticket" element={<CreateTicket />} />
        <Route path="history" element={<UserHistory />} />
        <Route path="scan-qr" element={<ScanQR />} />
        <Route path="equipment/:id" element={<EquipmentDetail />} />
        <Route path="ticket/:id" element={<TicketDetail />} />
        <Route path="profile" element={<Profile />} />
        <Route path="it-schedule" element={<ITSchedule />} />
        <Route path="quick-fix" element={<QuickFix />} />
        <Route path="report" element={<Report />} />
      </Route>

      <Route path="admin" element={<LayoutAdmin />}>
        <Route index element={<Dashboard />} />
        <Route path="manage-users" element={<UserManagement />} />
        <Route path="manage-rooms" element={<RoomManagement />} />
        <Route path="manage-categories" element={<CategoryManagement />} />
        <Route path="manage-equipment" element={<EquipmentManagement />} />
        <Route path="reports" element={<ReportDashboard />} />
        <Route path="profile" element={<AdminProfile />} />
        <Route path="ticket/:id" element={<AdminTicketDetail />} />
        <Route path="permission" element={<Permission />} />
        <Route path="quick-fix" element={<QuickFixManagement />} />
      </Route>

      <Route path="it" element={<LayoutIT />}>
        <Route index element={<ITDashboard />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<ITProfile />} />
        <Route path="history" element={<History />} />
        <Route path="tickets" element={<Tickets />} />
        <Route path="ticket/:id" element={<ITTicketDetail />} />
        <Route path="schedule" element={<ITScheduleInternal />} />
      </Route>

      <Route path="*" element={<h1>404 Not Found</h1>} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
