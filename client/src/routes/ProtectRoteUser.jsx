import React, { useState, useEffect, use } from "react";
import useEcomStore from "../store/ecom-store";
import { currentUser } from "../api/auth";
import LoadingToRedirect from "./LoadingToRedirect";

const ALLOW_ROLES = ["user", "admin"]; // อนุญาตทั้ง user และ admin

const ProtectRoteUser = ({ element }) => {
  const [ok, setOk] = useState(false);
  const user = useEcomStore((state) => state.user);
  const token = useEcomStore((state) => state.token);

  useEffect(() => {
    if (user && token) {
      //sent to back
      currentUser(token)
        .then((res) => setOk(true))
        .catch((err) => setOk(false));
    }
  }, []);

  return ok ? element : <LoadingToRedirect />;
};

export default ProtectRoteUser;
