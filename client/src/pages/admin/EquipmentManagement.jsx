// client/src/pages/admin/EquipmentManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Plus, QrCode, Printer, Edit, Trash } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";
import axios from "axios";

const EquipmentManagement = () => {
  const { token } = useAuthStore();
  const [equipments, setEquipments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "",
    serialNo: "",
    roomId: "",
  });

  const loadEquipments = useCallback(async () => {
    try {
      const res = await axios.get("/api/equipment", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEquipments(res.data);
    } catch (err) {
      console.log(err);
    }
  }, [token]);

  const loadRooms = useCallback(async () => {
    try {
      const res = await axios.get("/api/room", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data);
    } catch (err) {
      console.log(err);
    }
  }, [token]);

  useEffect(() => {
    loadEquipments();
    loadRooms();
  }, [loadEquipments, loadRooms]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/equipment", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Equipment created with QR Code");
      loadEquipments();
      setShowAddModal(false);
      setForm({ name: "", type: "", serialNo: "", roomId: "" });
    } catch {
      toast.error("Failed to create equipment");
    }
  };

  const showQR = async (equipmentId) => {
    try {
      const res = await axios.get(`/api/equipment/${equipmentId}/qr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedQR(res.data);
      setShowQRModal(true);
    } catch {
      toast.error("Failed to generate QR Code");
    }
  };

  const printQR = () => {
    const printWindow = window.open("", "", "width=400,height=600");
    printWindow.document.write(`
            <html>
                <head>
                    <title>QR Code - ${selectedQR.equipment.name}</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            text-align: center; 
                            padding: 20px;
                        }
                        .container {
                            border: 2px solid #333;
                            padding: 20px;
                            border-radius: 10px;
                            margin: 20px auto;
                            width: 350px;
                        }
                        h2 { color: #333; margin: 10px 0; }
                        .info { 
                            background: #f0f0f0; 
                            padding: 10px; 
                            border-radius: 5px;
                            margin: 10px 0;
                        }
                        .qr-code { margin: 20px 0; }
                        .footer {
                            margin-top: 20px;
                            font-size: 12px;
                            color: #666;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>PSUIC Service</h2>
                        <div class="qr-code">
                            <img src="${selectedQR.qrCodeImage
      }" style="width: 250px; height: 250px;">
                        </div>
                        <div class="info">
                            <p><strong>อุปกรณ์:</strong> ${selectedQR.equipment.name
      }</p>
                            <p><strong>ห้อง:</strong> ${selectedQR.equipment.room.roomNumber
      }</p>
                            <p><strong>Serial:</strong> ${selectedQR.equipment.serialNo || "-"
      }</p>
                        </div>
                        <div class="footer">
                            สแกน QR Code เพื่อแจ้งปัญหา<br>
                            หรือดูประวัติการซ่อม
                        </div>
                    </div>
                </body>
            </html>
        `);
    printWindow.document.close();
    printWindow.print();
  };

  const equipmentTypes = [
    "Computer",
    "Projector",
    "Printer",
    "Network Device",
    "Air Conditioner",
    "Other",
  ];

  return (
    <div className="bg-white p-6 rounded shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Equipment Management</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Equipment
        </button>
      </div>

      {/* Equipment Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Room
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Serial No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tickets
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {equipments.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">
                  {item.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{item.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.room?.roomNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {item.serialNo || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${item.status === "Normal"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                      }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item._count?.tickets || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => showQR(item.id)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View QR Code"
                    >
                      <QrCode size={18} />
                    </button>
                    <button
                      className="text-gray-600 hover:text-gray-900"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Equipment</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border rounded px-3 py-2"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g., Computer PC-01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    required
                    className="w-full border rounded px-3 py-2"
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="">Select Type</option>
                    {equipmentTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={form.serialNo}
                    onChange={(e) =>
                      setForm({ ...form, serialNo: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room *
                  </label>
                  <select
                    required
                    className="w-full border rounded px-3 py-2"
                    value={form.roomId}
                    onChange={(e) =>
                      setForm({ ...form, roomId: e.target.value })
                    }
                  >
                    <option value="">Select Room</option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.roomNumber} - {room.building}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4 text-center">QR Code</h2>

            <div className="text-center">
              <img
                src={selectedQR.qrCodeImage}
                alt="QR Code"
                className="mx-auto mb-4"
                style={{ width: "250px", height: "250px" }}
              />

              <div className="bg-gray-50 p-3 rounded mb-4">
                <p className="font-semibold">{selectedQR.equipment.name}</p>
                <p className="text-sm text-gray-600">
                  Room: {selectedQR.equipment.room.roomNumber}
                </p>
                {selectedQR.equipment.serialNo && (
                  <p className="text-xs text-gray-500">
                    S/N: {selectedQR.equipment.serialNo}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowQRModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={printQR}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <Printer size={18} />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentManagement;
