// client/src/pages/auth/PSUCallback.jsx
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import useAuthStore from "../../store/auth-store";

const PSUCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { actionLogin } = useAuthStore();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      toast.error("Authentication failed: " + error);
      navigate("/login");
      return;
    }

    if (code) {
      try {
        // TODO: Exchange code for token with backend
        // const response = await exchangeCodeForToken(code)
        // await actionLogin(response.data)

        toast.info("PSU Passport integration in progress");
        navigate("/login");
      } catch (err) {
        toast.error("Authentication failed");
        navigate("/login");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">กำลังยืนยันตัวตน...</p>
      </div>
    </div>
  );
};

export default PSUCallback;
