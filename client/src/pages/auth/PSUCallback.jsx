// client/src/pages/auth/PSUCallback.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const PSUCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    toast.info("PSU Passport ปิดใช้งานชั่วคราว กรุณาเข้าสู่ระบบด้วยอีเมลและรหัสผ่าน");
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="mt-4 text-gray-600">PSU Passport ปิดใช้งานชั่วคราว กำลังพากลับไปหน้าเข้าสู่ระบบ...</p>
      </div>
    </div>
  );
};

export default PSUCallback;
