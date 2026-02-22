import React from "react";
import { X, Monitor, Box } from "lucide-react";

const QRCodeModal = ({
    isOpen,
    onClose,
    selectedQR,
    onPrint
}) => {
    if (!isOpen || !selectedQR) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl text-[#1e2e4a]">Asset QR Code</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl inline-block mb-6">
                    <img
                        src={selectedQR.qrCodeImage}
                        alt="QR Code"
                        className="w-48 h-48 object-contain mix-blend-multiply"
                    />
                </div>

                <div className="text-left mb-6">
                    <p className="font-semibold text-[#1e2e4a] text-lg mb-4">{selectedQR.equipment.name}</p>

                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Monitor size={16} className="text-blue-500" />
                            <span>Room: {selectedQR.equipment.room.roomNumber}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <Box size={16} className="text-orange-500" />
                            <span>SN: {selectedQR.equipment.serialNo || "-"}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onPrint}
                    className="w-full py-3 bg-[#1e2e4a] text-white rounded-xl hover:bg-[#15325b] transition-all"
                >
                    Print QR Code
                </button>
            </div>
        </div>
    );
};

export default QRCodeModal;
