import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FlashlightOff, Flashlight, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const ScanQR = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  useEffect(() => {
    let scanner;
    if (!manualMode) {
      scanner = new Html5QrcodeScanner("qr-reader", {
        qrbox: { width: 250, height: 250 },
        fps: 10, // เพิ่ม FPS ให้ลื่นไหลขึ้น
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
      });

      scanner.render(onScanSuccess, onScanError);
    }

    function onScanSuccess(decodedText) {
      scanner.clear();
      fetchEquipmentData(decodedText);
    }

    function onScanError(err) {
      // ปล่อยว่างไว้เพื่อไม่ให้ขึ้น Error log ตลอดเวลาขณะสแกน
    }

    return () => {
      if (scanner) {
        scanner
          .clear()
          .catch((error) => console.error("Scanner cleanup failed", error));
      }
    };
  }, [manualMode]);

  const fetchEquipmentData = async (qrCode) => {
    setLoading(true);
    try {
      // 1. ดึงข้อมูลอุปกรณ์จาก API โดยใช้ QR Code
      // หมายเหตุ: ตรวจสอบพอร์ตและ URL ของ API ให้ถูกต้อง (เช่น http://localhost:5000/api/...)
      const res = await axios.get(`/api/equipment/qr/${qrCode}`);
      const equipmentData = res.data;

      toast.success("Equipment found");

      // 2. ส่งข้อมูลไปยังหน้า CreateTicket ผ่าน state
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
      // ถ้าไม่พบ ให้เริ่มสแกนใหม่โดยรีเฟรชหน้า หรือเปลี่ยนโหมด
      setManualMode(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin mb-4" size={48} />
        <p className="animate-pulse">Fetching equipment data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-6 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex items-center justify-between text-white">
          <button
            onClick={() => navigate("/user")}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold">Scanner</h1>
          <button
            onClick={() => setFlashOn(!flashOn)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            {flashOn ? (
              <Flashlight size={24} className="text-yellow-400" />
            ) : (
              <FlashlightOff size={24} />
            )}
          </button>
        </div>
        <p className="text-center text-white/70 text-sm mt-4">
          Place the QR Code sticker within the frame to start reporting.
        </p>
      </div>

      {/* Scanner Area */}
      <div className="h-screen flex items-center justify-center px-6">
        {!manualMode ? (
          <div className="relative w-full max-w-sm">
            <div
              id="qr-reader"
              className="rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl"
            ></div>

            {/* Scanner Frame Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-64 relative">
                <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl"></div>
                <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl"></div>
                <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl"></div>
                <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-blue-500 rounded-br-2xl"></div>

                {/* เลเซอร์ไลน์วิ่งขึ้นลง */}
                <div className="w-full h-1 bg-blue-500/50 absolute top-0 animate-scan-line"></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">
              <h2 className="text-white text-lg font-semibold mb-4 text-center">
                Enter Equipment Code
              </h2>
              <input
                type="text"
                autoFocus
                placeholder="e.g., EQUIP-001"
                className="w-full bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-center text-xl uppercase"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && e.target.value) {
                    fetchEquipmentData(e.target.value);
                  }
                }}
              />
              <button
                onClick={() => setManualMode(false)}
                className="w-full mt-6 text-blue-400 font-medium py-2"
              >
                Switch to Camera Scanner
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/90 to-transparent">
        <div className="flex gap-4">
          <button
            onClick={() => setManualMode(!manualMode)}
            className="flex-1 bg-white/10 backdrop-blur text-white py-4 rounded-2xl font-bold border border-white/10 hover:bg-white/20 transition-all"
          >
            {manualMode ? "Open Camera" : "Enter Manual Code"}
          </button>
          <button
            onClick={() => navigate("/user/create-ticket")}
            className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-900/40 hover:bg-blue-500 transition-all"
          >
            General Report
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan-line {
          0% {
            top: 0;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
        .animate-scan-line {
          animation: scan-line 2s linear infinite;
        }
      `}</style>
    </div >
  );
};

export default ScanQR;
