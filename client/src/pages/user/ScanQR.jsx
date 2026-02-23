import React, { useState, useEffect, useCallback, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flashlight, FlashlightOff, Image as ImageIcon, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import Resizer from "react-image-file-resizer";

const ALLOWED_UPLOAD_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"]);
const ALLOWED_UPLOAD_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);
const QR_QUERY_PARAM_KEYS = ["qr", "qrcode", "code", "equipment", "id"];

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

const pushQrCandidate = (targetSet, value) => {
  if (!value) return;
  const normalized = String(value).trim();
  if (!normalized) return;

  targetSet.add(normalized);

  const withoutQuotes = normalized.replace(/^["']|["']$/g, "").trim();
  if (withoutQuotes && withoutQuotes !== normalized) {
    targetSet.add(withoutQuotes);
  }

  try {
    const decoded = decodeURIComponent(withoutQuotes);
    if (decoded && decoded !== withoutQuotes) {
      targetSet.add(decoded.trim());
    }
  } catch {
    // Keep best-effort candidates only.
  }
};

const collectQrLookupCandidates = (rawText) => {
  const candidates = new Set();
  const normalized = normalizeQrText(rawText);

  pushQrCandidate(candidates, rawText);
  pushQrCandidate(candidates, normalized);

  const text = String(rawText || "").trim();
  try {
    const parsedUrl = new URL(text);
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    const qrIndex = pathParts.findIndex((part) => part.toLowerCase() === "qr");
    const equipmentIndex = pathParts.findIndex((part) => part.toLowerCase() === "equipment");

    if (qrIndex >= 0 && pathParts[qrIndex + 1]) {
      pushQrCandidate(candidates, pathParts[qrIndex + 1]);
    }

    if (equipmentIndex >= 0 && pathParts[equipmentIndex + 1]) {
      pushQrCandidate(candidates, pathParts[equipmentIndex + 1]);
    }

    for (const key of QR_QUERY_PARAM_KEYS) {
      pushQrCandidate(candidates, parsedUrl.searchParams.get(key));
    }

    if (pathParts.length > 0) {
      pushQrCandidate(candidates, pathParts[pathParts.length - 1]);
    }
  } catch {
    // Not a URL text, ignore.
  }

  return [...candidates];
};

const loadImageFromFile = (file) =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.decoding = "async";

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };
    img.src = objectUrl;
  });

const getScaledDimensions = (width, height, maxDimension) => {
  if (!maxDimension || (width <= maxDimension && height <= maxDimension)) {
    return { width, height };
  }

  const scale = maxDimension / Math.max(width, height);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};

const renderImageToCanvas = (img, maxDimension) => {
  const widthSource = img.naturalWidth || img.width || 0;
  const heightSource = img.naturalHeight || img.height || 0;
  if (!widthSource || !heightSource) return null;

  const { width, height } = getScaledDimensions(widthSource, heightSource, maxDimension);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(img, 0, 0, width, height);
  return { canvas, context, width, height };
};

const applyImageFilter = (context, width, height, filterMode) => {
  if (filterMode === "none") return;

  const imageData = context.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const luminance = Math.round(pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114);
    let nextValue = luminance;

    if (filterMode === "contrast") {
      nextValue = Math.max(0, Math.min(255, Math.round((luminance - 128) * 1.5 + 128)));
    } else if (filterMode === "threshold") {
      nextValue = luminance > 145 ? 255 : 0;
    }

    pixels[i] = nextValue;
    pixels[i + 1] = nextValue;
    pixels[i + 2] = nextValue;
  }

  context.putImageData(imageData, 0, 0);
};

const canvasToJpegFile = (canvas, sourceFileName, suffix, quality) =>
  new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const safeName = String(sourceFileName || "qr-upload")
          .replace(/\.[^.]+$/, "")
          .replace(/[^\w.-]/g, "_");
        resolve(new File([blob], `${safeName}-${suffix}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      quality,
    );
  });

const decodeQrWithPreprocessedImages = async (scanner, file) => {
  const image = await loadImageFromFile(file);
  const variants = [
    { maxDimension: 2200, filterMode: "none", quality: 0.98, suffix: "original" },
    { maxDimension: 1800, filterMode: "grayscale", quality: 0.97, suffix: "gray" },
    { maxDimension: 1600, filterMode: "contrast", quality: 0.97, suffix: "contrast" },
    { maxDimension: 1400, filterMode: "threshold", quality: 0.96, suffix: "threshold" },
  ];

  for (const variant of variants) {
    const rendered = renderImageToCanvas(image, variant.maxDimension);
    if (!rendered) continue;

    applyImageFilter(rendered.context, rendered.width, rendered.height, variant.filterMode);
    const transformedFile = await canvasToJpegFile(rendered.canvas, file.name, variant.suffix, variant.quality);
    if (!transformedFile) continue;

    try {
      const decoded = await scanner.scanFile(transformedFile, false);
      if (decoded) return decoded;
    } catch {
      // Keep trying with next transform variant.
    }
  }

  return "";
};

const normalizeUploadImageFile = async (file) => {
  if (!file) return file;

  const mime = String(file.type || "").toLowerCase();
  if (mime === "image/jpeg" || mime === "image/png") {
    return file;
  }

  try {
    const image = await loadImageFromFile(file);
    const rendered = renderImageToCanvas(image, 2200);
    if (!rendered) {
      return file;
    }

    const converted = await canvasToJpegFile(rendered.canvas, file.name, "normalized", 0.97);
    return converted || file;
  } catch {
    return file;
  }
};

const decodeQrWithBarcodeDetector = async (file) => {
  if (typeof window === "undefined" || typeof window.BarcodeDetector !== "function") {
    return "";
  }

  try {
    if (typeof window.BarcodeDetector.getSupportedFormats === "function") {
      const supportedFormats = await window.BarcodeDetector.getSupportedFormats();
      if (Array.isArray(supportedFormats) && supportedFormats.length > 0 && !supportedFormats.includes("qr_code")) {
        return "";
      }
    }

    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    const bitmap = await createImageBitmap(file);
    try {
      const detections = await detector.detect(bitmap);
      for (const detection of detections || []) {
        if (detection?.rawValue) {
          return String(detection.rawValue).trim();
        }
      }
    } finally {
      if (typeof bitmap?.close === "function") {
        bitmap.close();
      }
    }
  } catch {
    // Ignore and continue with next decoder.
  }

  return "";
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

  const reportCameraError = useCallback((message) => {
    setCameraError(message);
    if (!cameraToastShownRef.current) {
      toast.warn(message);
      cameraToastShownRef.current = true;
    }
  }, []);

  const fetchEquipmentData = useCallback(async (rawQrText) => {
    if (!rawQrText || isFetchingRef.current) return;

    const qrCandidates = collectQrLookupCandidates(rawQrText);
    if (qrCandidates.length === 0) return;

    isFetchingRef.current = true;
    setLoading(true);
    try {
      let equipmentData = null;
      let lastLookupError = null;

      for (const qrCandidate of qrCandidates) {
        try {
          const res = await axios.get(`/api/equipment/qr/${encodeURIComponent(qrCandidate)}`);
          equipmentData = res.data;
          break;
        } catch (error) {
          lastLookupError = error;
          const statusCode = error?.response?.status;
          if (statusCode && ![400, 404].includes(statusCode)) {
            break;
          }
        }
      }

      if (!equipmentData) {
        throw lastLookupError || new Error("QR lookup failed.");
      }

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
    } catch (error) {
      const statusCode = error?.response?.status;
      if (statusCode === 404) {
        toast.error("This QR code was not found in the system.");
      } else {
        toast.error("Unable to read QR or fetch equipment data.");
      }
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
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
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
  }, [fetchEquipmentData, reportCameraError, uploadOnlyMode]);

  useEffect(() => {
    startScannerRef.current = startScanner;
  }, [startScanner]);

  useEffect(() => {
    mountedRef.current = true;
    if (!uploadOnlyMode) {
      startScanner();
    } else {
      setCameraError("");
    }

    return () => {
      mountedRef.current = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => { });
        }
      }
    };
  }, [startScanner, uploadOnlyMode]);

  const toggleFlash = async () => {
    if (uploadOnlyMode) {
      toast.info("Camera requires HTTPS. Please use Gallery.");
      return;
    }
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
      toast.error("Supported image formats: JPG, PNG, WEBP, HEIC.");
      if (e.target) e.target.value = "";
      return;
    }

    setLoading(true);

    try {
      const normalizedFile = await normalizeUploadImageFile(file);

      // Stop camera temporarily to focus on file
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop().catch(() => { });
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader", {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          experimentalFeatures: { useBarCodeDetectorIfSupported: true },
        });
      }

      let decodedText = "";
      let scanError = null;

      // Attempt 1: decode original image first (best chance for high-quality QR).
      try {
        // Use showImage=false so decoding does not depend on a visible scanner container.
        decodedText = await scannerRef.current.scanFile(normalizedFile, false);
      } catch (error) {
        scanError = error;
      }

      // Attempt 2: fallback with resized image (helps very large photos from mobile).
      if (!decodedText) {
        try {
          const resizedImage = await resizeFile(normalizedFile, 1400, 1400, 92);
          decodedText = await scannerRef.current.scanFile(resizedImage, false);
        } catch (error) {
          scanError = error;
        }
      }

      // Attempt 3: Native BarcodeDetector (when available on browser).
      if (!decodedText) {
        try {
          decodedText = await decodeQrWithBarcodeDetector(normalizedFile);
        } catch (error) {
          scanError = error;
        }
      }

      // Attempt 4: run additional preprocess variants through html5-qrcode.
      if (!decodedText) {
        try {
          decodedText = await decodeQrWithPreprocessedImages(scannerRef.current, normalizedFile);
        } catch (error) {
          scanError = error;
        }
      }

      if (!decodedText) {
        toast.error("Could not read QR from this image. Please try a clearer image.");
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
    <div className="fixed inset-0 z-[9999] overflow-hidden font-sans text-white bg-black">
      <div
        id="reader"
        className={
          uploadOnlyMode
            ? "absolute -left-[9999px] -top-[9999px] w-[360px] h-[360px] opacity-0 pointer-events-none overflow-hidden"
            : "absolute inset-0 w-full h-full [&>video]:object-cover [&>video]:h-full [&>video]:w-full"
        }
      ></div>

      {!uploadOnlyMode && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="w-full h-full bg-black/10 shadow-[inset_0_0_120px_rgba(0,0,0,0.75)]" />
        </div>
      )}

      <div className="absolute top-0 left-0 right-0 pt-safe-top z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-full bg-[#0f121a]/70 border border-white/20 flex items-center justify-center transition-all active:scale-95"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-sm sm:text-base font-normal tracking-[0.34em] text-white/65 uppercase">
            Scanning...
          </h1>
          <div className="w-12" />
        </div>
      </div>

      {cameraError && (
        <div className="absolute top-20 left-0 right-0 z-40 px-6">
          <div className="rounded-xl border border-white/20 bg-black/65 px-4 py-3 text-center text-xs tracking-wide text-white/90">
            {cameraError}
          </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
        <div className="relative w-[78%] aspect-square max-w-[300px] mt-10">
          <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-[#8f97a8] rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-[#8f97a8] rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-[#8f97a8] rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-[#8f97a8] rounded-br-lg"></div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none bg-gradient-to-t from-black/85 via-black/25 to-transparent z-30" />

      <div
        className="absolute bottom-12 left-0 right-0 px-12 flex items-center justify-around z-50 pointer-events-auto pb-safe-bottom"
      >
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={toggleFlash}
            className={`w-16 h-16 rounded-full flex items-center justify-center border backdrop-blur-sm transition-all duration-300 ${
              uploadOnlyMode
                ? "bg-white/5 border-white/15 text-white/45"
                : flashOn
                  ? "bg-white text-black border-white shadow-xl scale-105"
                  : "bg-white/10 border-white/20 text-white"
            }`}
          >
            {flashOn && !uploadOnlyMode ? <Flashlight size={26} /> : <FlashlightOff size={26} />}
          </button>
          <span className="text-[10px] font-normal text-white/55 uppercase tracking-[0.32em] leading-tight pl-1">Flash</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all shadow-lg"
          >
            <ImageIcon size={26} />
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,.jpg,.jpeg,.png,.webp,.heic,.heif"
              onChange={handleFileUpload}
            />
          </button>
          <span className="text-[10px] font-normal text-white/55 uppercase tracking-[0.24em] leading-tight pl-1">Gallery</span>
        </div>
      </div>

      {uploadOnlyMode && (
        <div className="absolute bottom-[138px] left-0 right-0 z-40 text-center px-6">
          <p className="text-[11px] tracking-[0.06em] text-white/45">HTTP mode: camera is disabled, use Gallery.</p>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] z-[100] flex flex-col items-center justify-center transition-all">
          <Loader2 className="animate-spin text-white mb-3" size={32} strokeWidth={3} />
          <p className="text-[11px] font-normal tracking-[0.26em] uppercase opacity-70">Identifying</p>
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
