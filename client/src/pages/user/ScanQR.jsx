import React, { useState, useEffect, useCallback, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flashlight, FlashlightOff, Image as ImageIcon, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import Resizer from "react-image-file-resizer";

const ALLOWED_UPLOAD_EXTENSIONS = new Set(["jpg", "jpeg", "png"]);
const ALLOWED_UPLOAD_MIME = new Set(["image/jpeg", "image/png"]);

const normalizeQrText = (rawText) => {
  if (!rawText) return "";
  const trimmed = String(rawText).trim();
  if (!trimmed) return "";

  // Direct code (our generated QR format) should pass through quickly.
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const qrIndex = pathParts.findIndex((part) => part === "qr");
    if (qrIndex >= 0 && pathParts[qrIndex + 1]) {
      return decodeURIComponent(pathParts[qrIndex + 1]);
    }

    const queryCandidates = [
      url.searchParams.get("qr"),
      url.searchParams.get("qrcode"),
      url.searchParams.get("code"),
      url.searchParams.get("equipment"),
      url.searchParams.get("id"),
    ].filter(Boolean);

    if (queryCandidates.length > 0) {
      return String(queryCandidates[0]).trim();
    }

    if (pathParts.length > 0) {
      return decodeURIComponent(pathParts[pathParts.length - 1]);
    }
  } catch {
    // If parsing URL fails, fallback to original text.
  }

  return trimmed;
};

const ScanQR = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);
  const startScannerRef = useRef(null);
  const cameraToastShownRef = useRef(false);
  const isFetchingRef = useRef(false);
  const isSecureContextRuntime =
    typeof window !== "undefined" ? window.isSecureContext : true;
  const uploadOnlyMode = !isSecureContextRuntime;
  const uploadOnlyMessage =
    "Camera scan is disabled on HTTP. Please upload QR image in JPG/PNG format.";

  const reportCameraError = useCallback((message) => {
    setCameraError(message);
    if (!cameraToastShownRef.current) {
      toast.warn(message);
      cameraToastShownRef.current = true;
    }
  }, []);

  const fetchEquipmentData = useCallback(async (rawQrText) => {
    if (!rawQrText || isFetchingRef.current) return;
    const qrCode = normalizeQrText(rawQrText);
    if (!qrCode) return;

    isFetchingRef.current = true;
    setLoading(true);
    try {
      // Encode to keep route param valid even when QR text contains URL chars.
      const res = await axios.get(`/api/equipment/qr/${encodeURIComponent(qrCode)}`);
      const equipmentData = res.data;

      // Stop scanning only after successful find
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop().catch(() => { });
      }

      toast.success("Equipment found");
      navigate("/user/create-ticket", {
        state: {
          equipmentId: equipmentData.id,
          equipmentName: equipmentData.name,
          equipmentCode: equipmentData.serialNo || equipmentData.qrCode,
          roomId: equipmentData.roomId,
          roomNumber: equipmentData.room?.roomNumber || "N/A",
          floorName: equipmentData.room?.floor || "",
          categoryId: equipmentData.categoryObj?.id || "",
          categoryName: equipmentData.categoryObj?.name || "",
          subComponents: equipmentData.categoryObj?.subComponents || []
        },
      });
    } catch {
      toast.error("Invalid QR Code or Equipment not found");
      // If it was a file upload, we might need to restart if we stopped it.
      if (!scannerRef.current?.isScanning) {
        if (startScannerRef.current) startScannerRef.current();
      }
    } finally {
      isFetchingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [navigate]);

  const startScanner = useCallback(async () => {
    try {
      if (uploadOnlyMode) {
        reportCameraError(uploadOnlyMessage);
        return;
      }

      if (!window.isSecureContext) {
        reportCameraError("Camera requires HTTPS (or localhost). Please use Gallery for now.");
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        reportCameraError("This browser does not support camera access for scanning.");
        return;
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader", {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        });
      }

      if (scannerRef.current.isScanning) return;

      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 15, // Higher FPS for smoother feel
            // REMOVED qrbox to allow scanning the ENTIRE screen as requested
            // aspectRatio is removed to avoid stretching the camera stream which breaks QR code recognition on mobile
          },
          (decodedText) => {
            fetchEquipmentData(decodedText);
          },
          () => { }
        );
        setCameraError("");
      } else {
        reportCameraError("No camera device was found. Please use Gallery.");
      }
    } catch (error) {
      const rawMessage = typeof error === "string" ? error : error?.message || "";
      if (rawMessage.toLowerCase().includes("secure context")) {
        reportCameraError("Camera requires HTTPS (or localhost). Please use Gallery for now.");
        return;
      }

      reportCameraError("Unable to start camera scanner. Please check browser camera permission.");
    }
  }, [fetchEquipmentData, reportCameraError, uploadOnlyMessage, uploadOnlyMode]);

  useEffect(() => {
    startScannerRef.current = startScanner;
  }, [startScanner]);

  useEffect(() => {
    mountedRef.current = true;
    if (!uploadOnlyMode) {
      startScanner();
    } else {
      setCameraError(uploadOnlyMessage);
    }

    return () => {
      mountedRef.current = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => { });
        }
      }
    };
  }, [startScanner, uploadOnlyMessage, uploadOnlyMode]);

  const toggleFlash = async () => {
    if (uploadOnlyMode) return;
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !flashOn }]
      });
      setFlashOn(!flashOn);
    } catch {
      toast.warn("Flashlight not supported");
    }
  };

  const resizeFile = (file, maxWidth = 1000, maxHeight = 1000, quality = 96) =>
    new Promise((resolve) => {
      Resizer.imageFileResizer(
        file,
        maxWidth,
        maxHeight,
        "JPEG",
        quality,
        0,
        (uri) => {
          resolve(uri);
        },
        "file"
      );
    });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = String(file.name || "")
      .split(".")
      .pop()
      ?.toLowerCase();
    const isAllowedByMime = ALLOWED_UPLOAD_MIME.has(String(file.type || "").toLowerCase());
    const isAllowedByExt = ALLOWED_UPLOAD_EXTENSIONS.has(fileExt || "");

    if (!isAllowedByMime && !isAllowedByExt) {
      toast.error("Please upload JPG/PNG image only.");
      if (e.target) e.target.value = "";
      return;
    }

    setLoading(true);

    try {
      // Stop camera temporarily to focus on file
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop().catch(() => { });
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader", {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        });
      }

      let decodedText = "";
      let scanError = null;

      // Attempt 1: decode original image first (best chance for high-quality QR).
      try {
        decodedText = await scannerRef.current.scanFile(file, true);
      } catch (error) {
        scanError = error;
      }

      // Attempt 2: fallback with resized image (helps very large photos from mobile).
      if (!decodedText) {
        try {
          const resizedImage = await resizeFile(file, 1400, 1400, 92);
          decodedText = await scannerRef.current.scanFile(resizedImage, true);
        } catch (error) {
          scanError = error;
        }
      }

      if (!decodedText) {
        const isHeicLike =
          /heic|heif/i.test(file.type || "") || /\.(heic|heif)$/i.test(file.name || "");
        if (isHeicLike) {
          toast.error("HEIC/HEIF is not supported here. Please convert to JPG/PNG.");
        } else {
          toast.error("Could not read QR code from this image. Please try a clearer JPG/PNG.");
        }
        throw scanError || new Error("Unable to decode QR from uploaded file.");
      }

      await fetchEquipmentData(decodedText);
    } catch {
      startScanner(); // Always restart if file scan failed
    } finally {
      // Allow selecting the same file again after a failed attempt.
      if (e.target) e.target.value = "";
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white z-[9999] overflow-hidden font-sans">
      {/* Viewport - Full Feed */}
      <div
        id="reader"
        className={
          uploadOnlyMode
            ? "hidden"
            : "absolute inset-0 w-full h-full [&>video]:object-cover [&>video]:h-full [&>video]:w-full"
        }
      ></div>

      {uploadOnlyMode && (
        <div className="absolute inset-0 flex items-center justify-center px-6">
          <div className="max-w-sm w-full rounded-2xl border border-white/15 bg-white/10 backdrop-blur-sm p-6 text-center">
            <p className="text-sm font-semibold tracking-wide uppercase text-white/80">Upload QR</p>
            <p className="mt-3 text-xs text-white/70 leading-relaxed">
              Temporary HTTP mode is active. Camera scan is hidden for compatibility.
            </p>
            <p className="mt-2 text-xs text-amber-200">Please use JPG/PNG images only.</p>
          </div>
        </div>
      )}

      {/* Overlay Mask - Very subtle to indicate scanning */}
      {!uploadOnlyMode && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="w-full h-full shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] bg-black/10" />
        </div>
      )}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 pt-safe-top z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10 transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-medium tracking-[0.2em] text-white/90 uppercase opacity-60">
            {uploadOnlyMode ? "Upload QR..." : "Scanning..."}
          </h1>
          <div className="w-10" />
        </div>
      </div>

      {cameraError && (
        <div className="absolute top-20 left-0 right-0 z-40 px-6">
          <div className="rounded-xl border border-amber-300/20 bg-black/65 px-4 py-3 text-center text-xs tracking-wide text-amber-200 backdrop-blur-sm">
            {cameraError}
          </div>
        </div>
      )}

      {/* Scan Zone Indicators (Subtle edges) */}
      {!uploadOnlyMode && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div className="relative w-[80%] aspect-square max-w-[300px]">
            <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/40 rounded-tl-lg"></div>
            <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/40 rounded-tr-lg"></div>
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/40 rounded-bl-lg"></div>
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/40 rounded-br-lg"></div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div
        className={`absolute bottom-12 left-0 right-0 ${
          uploadOnlyMode ? "px-6 justify-center" : "px-12 justify-around"
        } flex items-center z-50 pointer-events-auto pb-safe-bottom`}
      >
        {!uploadOnlyMode && (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={toggleFlash}
              className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all border duration-300 ${
                flashOn
                  ? "bg-white text-black border-white shadow-xl scale-110"
                  : "bg-white/10 border-white/10"
              }`}
            >
              {flashOn ? <Flashlight size={24} /> : <FlashlightOff size={24} />}
            </button>
            <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest leading-tight">Flash</span>
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-full bg-white/10 border border-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <ImageIcon size={24} />
            <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg,.png,image/jpeg,image/png" onChange={handleFileUpload} />
          </button>
          <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest leading-tight">JPG / PNG</span>
        </div>
      </div>

      {/* Subtle Loading Overlay (Doesn't block view) */}
      {loading && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-[100] flex flex-col items-center justify-center transition-all">
          <Loader2 className="animate-spin text-white mb-3" size={32} strokeWidth={3} />
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60">Identifying</p>
        </div>
      )}

      <style jsx>{`
        .pt-safe-top { padding-top: env(safe-area-inset-top, 24px); }
        .pb-safe-bottom { padding-bottom: env(safe-area-inset-bottom, 24px); }
      `}</style>
    </div>
  );
};

export default ScanQR;
