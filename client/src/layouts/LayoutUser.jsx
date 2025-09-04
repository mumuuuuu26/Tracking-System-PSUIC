import React from "react";
import { Outlet } from "react-router-dom";

const LayoutUser = () => {
  return (
    <div>
      <h1>Hello User</h1>
      <Outlet />
    </div>
  );
};

export default LayoutUser;
