import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import axios from "axios";
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

const QRScanRedirect = () => {
  const navigate = useNavigate();
  const { qrCode: pathQrCode } = useParams();
  const [searchParams] = useSearchParams();
  const { user, hasHydrated, actionLogout } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState("");
  const [errorAction, setErrorAction] = useState("scanner");
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
      setErrorAction("scanner");
      return;
    }

    if (!user) {
      const nextPath = `/scan?qr=${encodeURIComponent(qrValue)}`;
      navigate(`/login?next=${encodeURIComponent(nextPath)}`, { replace: true });
      return;
    }

    if (user.role !== "user") {
      setErrorMessage("Please continue with a user account to create a ticket from this QR code.");
      setErrorAction("switch-user");
      return;
    }

    processingRef.current = true;
    setStatusText("Loading equipment details...");

    axios
      .get(`/api/equipment/qr/${encodeURIComponent(qrValue)}`)
      .then((response) => {
        navigate("/user/create-ticket", {
          replace: true,
          state: buildTicketPrefill(response.data),
        });
      })
      .catch((error) => {
        const statusCode = error?.response?.status;
        setErrorMessage(
          statusCode === 404
            ? "Equipment was not found for this QR code."
            : "Unable to load equipment. Please try again.",
        );
        setErrorAction("scanner");
        processingRef.current = false;
      });
  }, [hasHydrated, navigate, qrValue, user]);

  const handleErrorAction = () => {
    if (errorAction === "switch-user") {
      actionLogout();
      const nextPath = `/scan?qr=${encodeURIComponent(qrValue)}`;
      navigate(`/login?next=${encodeURIComponent(nextPath)}`, { replace: true });
      return;
    }
    navigate("/user/scan-qr");
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
              {errorAction === "switch-user" ? "Continue With User Login" : "Open In-App Scanner"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default QRScanRedirect;
