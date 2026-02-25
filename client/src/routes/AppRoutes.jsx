import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

const LayoutUser = lazy(() => import("../layouts/LayoutUser"));
const LayoutAdmin = lazy(() => import("../layouts/LayoutAdmin"));
const LayoutIT = lazy(() => import("../layouts/LayoutIT"));

const Login = lazy(() => import("../pages/auth/Login"));
const Register = lazy(() => import("../pages/auth/Register"));
const PSUCallback = lazy(() => import("../pages/auth/PSUCallback"));
const QRScanRedirect = lazy(() => import("../pages/public/QRScanRedirect"));

const HomeUser = lazy(() => import("../pages/user/HomeUser"));
const CreateTicket = lazy(() => import("../pages/user/CreateTicket"));
const UserHistory = lazy(() => import("../pages/user/History"));
const Profile = lazy(() => import("../pages/user/Profile"));
const ITSchedule = lazy(() => import("../pages/user/ITSchedule"));
const QuickFix = lazy(() => import("../pages/user/QuickFix"));
const Report = lazy(() => import("../pages/user/Report"));
const ScanQR = lazy(() => import("../pages/user/ScanQR"));
const TicketDetail = lazy(() => import("../pages/user/TicketDetail"));
const EquipmentDetail = lazy(() => import("../pages/user/EquipmentDetail"));

const Dashboard = lazy(() => import("../pages/admin/Dashboard"));
const UserManagement = lazy(() => import("../pages/admin/UserManagement"));
const RoomManagement = lazy(() => import("../pages/admin/RoomManagement"));
const CategoryManagement = lazy(() => import("../pages/admin/CategoryManagement"));
const EquipmentManagement = lazy(() => import("../pages/admin/EquipmentManagement"));
const ReportDashboard = lazy(() => import("../pages/admin/reports/ReportDashboard"));
const AdminProfile = lazy(() => import("../pages/admin/Profile"));
const AdminTicketDetail = lazy(() => import("../pages/admin/TicketDetail"));
const Permission = lazy(() => import("../pages/admin/Permission"));
const QuickFixManagement = lazy(() => import("../pages/admin/QuickFixManagement"));

const ITDashboard = lazy(() => import("../pages/it/Dashboard"));
const Notifications = lazy(() => import("../pages/it/Notifications"));
const ITProfile = lazy(() => import("../pages/it/Profile"));
const History = lazy(() => import("../pages/it/History"));
const Tickets = lazy(() => import("../pages/it/Tickets"));
const ITTicketDetail = lazy(() => import("../pages/it/TicketDetail"));
const ITScheduleInternal = lazy(() => import("../pages/it/Schedule"));

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
