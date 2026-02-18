import React, { useState, useEffect, useCallback, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Flashlight, FlashlightOff, Image as ImageIcon, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import Resizer from "react-image-file-resizer";

const ScanQR = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);
  const startScannerRef = useRef(null);

  const fetchEquipmentData = useCallback(async (qrCode) => {
    if (!qrCode) return;

    setLoading(true);
    try {
      const res = await axios.get(`/api/equipment/qr/${qrCode}`);
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
        },
      });
    } catch (error) {
      console.error(error);
      toast.error("Invalid QR Code or Equipment not found");
      // If it was a file upload, we might need to restart if we stopped it.
      if (!scannerRef.current?.isScanning) {
        if (startScannerRef.current) startScannerRef.current();
      }
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

      if (scannerRef.current.isScanning) return;

      const cameras = await Html5Qrcode.getCameras();
      if (cameras && cameras.length > 0) {
        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 15, // Higher FPS for smoother feel
            // REMOVED qrbox to allow scanning the ENTIRE screen as requested
            aspectRatio: window.innerWidth / window.innerHeight
          },
          (decodedText) => {
            fetchEquipmentData(decodedText);
          },
          () => { }
        );
      }
    } catch (err) {
      console.error("Error starting scanner", err);
    }
  }, [fetchEquipmentData]);

  useEffect(() => {
    startScannerRef.current = startScanner;
  }, [startScanner]);

  useEffect(() => {
    mountedRef.current = true;
    startScanner();

    return () => {
      mountedRef.current = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => { });
        }
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
    } catch {
      toast.warn("Flashlight not supported");
    }
  };

  const resizeFile = (file) =>
    new Promise((resolve) => {
      Resizer.imageFileResizer(
        file,
        800, // Max width
        800, // Max height
        "JPEG",
        100,
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

    setLoading(true);

    try {
      // 1. Resize image first for MUCH faster QR decoding
      const resizedImage = await resizeFile(file);

      // Stop camera temporarily to focus on file
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop().catch(() => { });
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("reader");
      }

      const result = await scannerRef.current.scanFile(resizedImage, true);
      await fetchEquipmentData(result);
    } catch (err) {
      console.error("File scan error", err);
      toast.error("Could not read QR code. Please ensure it's clear.");
      startScanner(); // Always restart if file scan failed
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white z-[9999] overflow-hidden font-sans">
      {/* Viewport - Full Feed */}
      <div id="reader" className="absolute inset-0 w-full h-full [&>video]:object-cover [&>video]:h-full [&>video]:w-full"></div>

      {/* Overlay Mask - Very subtle to indicate scanning */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="w-full h-full shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] bg-black/10" />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 pt-safe-top z-40">
        <div className="px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/10 transition-all active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-sm font-medium tracking-[0.2em] text-white/90 uppercase opacity-60">Scanning...</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Scan Zone Indicators (Subtle edges) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
        <div className="relative w-[80%] aspect-square max-w-[300px]">
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white/40 rounded-tl-lg"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white/40 rounded-tr-lg"></div>
          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white/40 rounded-bl-lg"></div>
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white/40 rounded-br-lg"></div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-12 left-0 right-0 px-12 flex justify-around items-center z-50 pointer-events-auto pb-safe-bottom">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={toggleFlash}
            className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all border duration-300 ${flashOn ? "bg-white text-black border-white shadow-xl scale-110" : "bg-white/10 border-white/10"
              }`}
          >
            {flashOn ? <Flashlight size={24} /> : <FlashlightOff size={24} />}
          </button>
          <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest leading-tight">Flash</span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-full bg-white/10 border border-white/10 backdrop-blur-md flex items-center justify-center hover:bg-white/20 transition-all"
          >
            <ImageIcon size={24} />
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </button>
          <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest leading-tight">Gallery</span>
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
