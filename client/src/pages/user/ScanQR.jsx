import React, { useState, useEffect, useCallback, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flashlight, FlashlightOff, Image as ImageIcon, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const ScanQR = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);

  // Reuse existing logic to fetch and navigate
  const fetchEquipmentData = useCallback(async (qrCode) => {
    if (!qrCode) return;

    // Stop scanning temporarily
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn("Failed to stop scanner", err);
      }
    }

    setLoading(true);
    try {
      const res = await axios.get(`/api/equipment/qr/${qrCode}`);
      const equipmentData = res.data;

      toast.success("Equipment found");

      navigate("/user/create-ticket", {
        state: {
          equipmentId: equipmentData.id,
          equipmentName: equipmentData.name,
          equipmentCode: equipmentData.serialNo || equipmentData.qrCode,
          roomId: equipmentData.roomId,
          roomNumber: equipmentData.room?.roomNumber || "N/A",
          floorName: equipmentData.room?.floor || "",
        },
      });
    } catch (err) {
      console.error(err);
      toast.error("Equipment not found or invalid QR Code");
      // If failed, restart scanner
      startScanner();
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [navigate]);

  const startScanner = useCallback(async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader", {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
        });
      }

      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        // Prefer back camera
        const cameraId = cameras[cameras.length - 1].id;

        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: window.innerWidth / window.innerHeight
          },
          (decodedText) => {
            fetchEquipmentData(decodedText);
          },
          (errorMessage) => {
            // ignore
          }
        );

        // Check flash support (only works if camera started)
        try {
          // This API might vary based on browser support
          // For now, we assume if start is successful we can try to get capabilities
          // But Html5Qrcode doesn't expose getCapabilities easily in all versions.
          // We'll manage flash state via applyVideoConstraints if possible, 
          // or just toggle state and catch errors.
          setHasFlash(true);
        } catch (e) {
          console.log("Flash check failed", e);
        }
      }
    } catch (err) {
      console.error("Error starting scanner", err);
      toast.error("Camera permission denied or error starting camera.");
    }
  }, [fetchEquipmentData]);

  useEffect(() => {
    mountedRef.current = true;
    startScanner();

    return () => {
      mountedRef.current = false;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch(e => console.warn(e));
          }
        } catch (e) { console.warn(e); }

        try {
          scannerRef.current.clear().catch(e => console.warn(e));
        } catch (e) { console.warn(e); }
      }
    };
  }, [startScanner]);

  const toggleFlash = async () => {
    if (!scannerRef.current) return;
    try {
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: !flashOn }]
      });
      setFlashOn(!flashOn);
    } catch (err) {
      console.error("Torch toggle failed", err);
      toast.warn("Flashlight not supported on this device.");
      setHasFlash(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode("reader");
    }

    try {
      const result = await scannerRef.current.scanFile(file, true);
      fetchEquipmentData(result);
    } catch (err) {
      console.error("File scan error", err);
      toast.error("Could not read QR code from image.");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="animate-pulse">Processing...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black text-white z-[9999]">
      {/* Camera Viewport */}
      <div id="reader" className="w-full h-full object-cover"></div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-safe-top z-20 flex items-center gap-4 bg-gradient-to-b from-black/80 to-transparent pb-10">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft size={28} />
        </button>
        <h1 className="text-xl font-bold">Scanner</h1>
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">

        {/* Scan Frame */}
        <div className="relative w-[250px] h-[250px]">
          {/* Corners */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t-[5px] border-l-[5px] border-white rounded-tl-3xl shadow-sm"></div>
          <div className="absolute top-0 right-0 w-12 h-12 border-t-[5px] border-r-[5px] border-white rounded-tr-3xl shadow-sm"></div>
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b-[5px] border-l-[5px] border-white rounded-bl-3xl shadow-sm"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-[5px] border-r-[5px] border-white rounded-br-3xl shadow-sm"></div>

          {/* Scanning Line Animation */}
          <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-scan-move opacity-80"></div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-10 left-0 right-0 px-10 flex justify-between items-center z-30 pointer-events-auto pb-safe-bottom">
        {/* Flashlight Button */}
        <button
          onClick={toggleFlash}
          className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all border ${flashOn ? "bg-white text-black border-white" : "bg-white/10 border-white/20 text-white hover:bg-white/20"
            }`}
        >
          {flashOn ? <Flashlight size={24} fill="currentColor" /> : <FlashlightOff size={24} />}
        </button>

        {/* Gallery Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-14 h-14 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all text-white"
        >
          <ImageIcon size={24} />
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
        </button>
      </div>

      <style jsx>{`
                @keyframes scan-move {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .animate-scan-move {
                    animation: scan-move 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                .pt-safe-top {
                    padding-top: env(safe-area-inset-top, 24px);
                }
                .pb-safe-bottom {
                    padding-bottom: env(safe-area-inset-bottom, 24px);
                }
            `}</style>
    </div>
  );
};

export default ScanQR;
