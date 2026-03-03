import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "../../utils/axios";
import useAuthStore from "../../store/auth-store";

const QR_QUERY_PARAM_KEYS = ["qr", "qrcode", "code", "equipment", "id"];

const buildTicketPrefill = (equipmentData) => ({
  equipmentId: equipmentData.id,
  equipmentName: equipmentData.name,
  equipmentCode: equipmentData.serialNo || equipmentData.qrCode,
  roomId: equipmentData.roomId,
  roomNumber: equipmentData.room?.roomNumber || "N/A",
  floorName: equipmentData.room?.floor || "",
  categoryId: equipmentData.categoryObj?.id || "",
  categoryName: equipmentData.categoryObj?.name || "",
  subComponents: equipmentData.categoryObj?.subComponents || [],
});

const decodeQrValue = (value) => {
  if (!value) return "";
  const normalized = String(value).trim();
  if (!normalized) return "";
  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
};

const ROLE_FALLBACK_PATH = {
  admin: "/admin",
  it_support: "/it",
  user: "/user/create-ticket",
};

const getRoleFallbackPath = (role) => ROLE_FALLBACK_PATH[role] || "/";

const getRoleErrorMessage = (role) => {
  if (role === "it_support") {
    return "คุณเป็น IT Support จึงไม่สามารถเปิดฟอร์มแจ้งปัญหาของผู้ใช้จาก QR ได้ โปรดไปที่หน้า IT Dashboard";
  }
  if (role === "admin") {
    return "บัญชี Admin ไม่สามารถเปิดฟอร์มแจ้งปัญหาผ่าน QR ได้ โปรดไปที่หน้า Admin Dashboard";
  }
  return "ไม่สามารถเปิดฟอร์มแจ้งปัญหาได้สำหรับบัญชีนี้";
};

const QRScanRedirect = () => {
  const navigate = useNavigate();
  const { qrCode: pathQrCode } = useParams();
  const [searchParams] = useSearchParams();
  const { user, hasHydrated, actionLogout } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState("");
  const [statusText, setStatusText] = useState("Preparing QR lookup...");
  const processingRef = useRef(false);

  const qrValue = useMemo(() => {
    if (pathQrCode) return decodeQrValue(pathQrCode);
    for (const key of QR_QUERY_PARAM_KEYS) {
      const value = searchParams.get(key);
      if (value) return decodeQrValue(value);
    }
    return "";
  }, [pathQrCode, searchParams]);

  useEffect(() => {
    if (!hasHydrated || processingRef.current) return;

    if (!qrValue) {
      setErrorMessage("Invalid QR link. Please scan again.");
      return;
    }

    if (!user) {
      const nextPath = `/scan?qr=${encodeURIComponent(qrValue)}`;
      navigate(`/login?next=${encodeURIComponent(nextPath)}`, { replace: true });
      return;
    }

    if (user.role !== "user") {
      setErrorMessage(getRoleErrorMessage(user.role));
      return;
    }

    processingRef.current = true;
    setStatusText("Loading equipment details...");

    api
      .get(`/equipment/qr/${encodeURIComponent(qrValue)}`)
      .then((response) => {
        navigate("/user/create-ticket", {
          replace: true,
          state: buildTicketPrefill(response.data),
        });
      })
      .catch((error) => {
        const statusCode = error?.response?.status;
        if (statusCode === 401 || statusCode === 403) {
          actionLogout();
          const nextPath = `/scan?qr=${encodeURIComponent(qrValue)}`;
          navigate(`/login?next=${encodeURIComponent(nextPath)}`, { replace: true });
          processingRef.current = false;
          return;
        }
        setErrorMessage(
          statusCode === 404
            ? "Equipment was not found for this QR code."
            : "Unable to load equipment. Please try again.",
        );
        processingRef.current = false;
      });
  }, [actionLogout, hasHydrated, navigate, qrValue, user]);

  const errorActionPath = getRoleFallbackPath(user?.role);
  const errorActionLabel =
    user?.role === "it_support"
      ? "Go to IT Dashboard"
      : user?.role === "admin"
        ? "Go to Admin Dashboard"
        : "Open Report Form";

  const handleErrorAction = () => {
    navigate(errorActionPath);
  };

  return (
    <div className="min-h-screen bg-[#f3f5f8] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-sm border border-gray-200 p-8 text-center">
        {!errorMessage ? (
          <>
            <Loader2 className="mx-auto mb-4 animate-spin text-[#1e3a8a]" size={30} />
            <h1 className="text-xl font-semibold text-[#1f2937] mb-2">Opening Ticket Form</h1>
            <p className="text-sm text-gray-500">{statusText}</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-semibold text-[#1f2937] mb-3">QR Scan Error</h1>
            <p className="text-sm text-gray-500 mb-6">{errorMessage}</p>
            <button
              type="button"
              onClick={handleErrorAction}
              className="w-full rounded-xl bg-[#1e3a8a] px-4 py-2.5 text-sm font-medium text-white"
            >
              {errorActionLabel}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default QRScanRedirect;
