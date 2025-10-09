//rafce
import DailyPrice from "../pages/admin/DailyPrice";
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "../pages/Home";
import Price from "../pages/Price";
import History from "../pages/History";
import Checkout from "../pages/Checkout";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import Layout from "../layouts/Layout";
import LayoutAdmin from "../layouts/LayoutAdmin";
import Dashboard from "../pages/admin/Dashboard";
import Category from "../pages/admin/Category";
import Product from "../pages/admin/Product";
import LayoutUser from "../layouts/LayoutUser";
import HomeUser from "../pages/user/HomeUser";
import ProtectRoteUser from "./ProtectRoteUser";
import ProtectRoteAdmin from "./ProtectRouteAdmin";
import HistoryAdmin from "../pages/admin/HistoryAdmin";
import SearchBills from "../pages/user/SearchBills";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "price", element: <Price /> },
      { path: "history", element: <History /> },
      { path: "checkout", element: <Checkout /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
    ],
  },
  {
    path: "/admin",
    element: <ProtectRoteAdmin element={<LayoutAdmin />} />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "category", element: <Category /> },
      { path: "product", element: <Product /> },
      { path: "daily-price", element: <DailyPrice /> },
      { path: "history", element: <HistoryAdmin /> },
    ],
  },
  {
    path: "/user",
    //element: <LayoutUser />,
    element: <ProtectRoteUser element={<LayoutUser />} />,
    children: [
      { index: true, element: <SearchBills /> }
    ],
  },
]);

const AppRoutes = () => {
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
};

export default AppRoutes;
