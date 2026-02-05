// client/src/pages/admin/EquipmentManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, ChevronDown, Monitor, Printer, Wifi, Wind, Box, ArrowLeft, QrCode } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { listCategories, createCategory } from "../../api/category";
import { FolderPlus } from "lucide-react";

const EquipmentManagement = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [equipments, setEquipments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);

  // Categories
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");


  // Form
  const [form, setForm] = useState({
    name: "",
    type: "",
    serialNo: "",
    roomId: "",
  });

  const equipmentTypes = [
    "Computer",
    "Projector",
    "Printer",
    "Network Device",
    "Air Conditioner",
    "Other",
  ];

  const loadEquipments = useCallback(async () => {
    try {
      const res = await axios.get("/api/equipment", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEquipments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadRooms = useCallback(async () => {
    try {
      const res = await axios.get("/api/room", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await listCategories(token);
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    loadEquipments();
    loadRooms();
    loadCategories();
  }, [loadEquipments, loadRooms, loadCategories]);

  // Combine default types with fetched categories
  const allTypes = [...new Set([...equipmentTypes, ...categories.map((c) => c.name)])];


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/equipment", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Equipment created successfully");
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
                              margin: 0;
                          }
                      </style>
                  </head>
                  <body>
                      <div class="container">
                          <h2>PSUIC Service</h2>
                          <div class="qr-code">
                              <img src="${selectedQR.qrCodeImage}" style="width: 250px; height: 250px;">
                          </div>
                          <div class="info">
                              <p><strong>อุปกรณ์:</strong> ${selectedQR.equipment.name}</p>
                              <p><strong>ห้อง:</strong> ${selectedQR.equipment.room.roomNumber}</p>
                              <p><strong>Serial:</strong> ${selectedQR.equipment.serialNo || "-"}</p>
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

  // Filter Logic
  const filteredEquipments = Array.isArray(equipments) ? equipments.filter(item => {
    if (!item || !item.name) return false;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.id).includes(searchQuery) ||
      (item.serialNo && item.serialNo.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === "All Types" || item.type === selectedType;
    return matchesSearch && matchesType;
  }) : [];

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      await createCategory(token, { name: newCategory });
      toast.success("Category added successfully");
      setNewCategory("");
      setShowCategoryModal(false);
      loadCategories(); // Refresh categories
    } catch (err) {
      console.error(err);
      toast.error("Failed to add category");
    }
  };


  const getTypeIcon = (type) => {
    switch (type) {
      case 'Computer': return <Monitor size={24} className="text-gray-500" />;
      case 'Printer': return <Printer size={24} className="text-gray-500" />;
      case 'Network Device': return <Wifi size={24} className="text-gray-500" />;
      case 'Air Conditioner': return <Wind size={24} className="text-gray-500" />;
      default: return <Box size={24} className="text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-20">
      {/* Header */}
      <div className="bg-[#193C6C] px-6 pt-12 pb-6 shadow-lg sticky top-0 z-20">
        <div className="flex items-center gap-4 text-white">
          <button onClick={() => navigate(-1)} className="hover:bg-white/10 p-2 -ml-2 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Equipment Management</h1>
        </div>
      </div>

      <div className="px-6 py-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Searching asset ID or Name..."
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder-gray-400 text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter & Add Button */}
        <div className="flex gap-3">
          {/* Type Dropdown */}
          <div className="relative flex-1">
            <button
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 flex justify-between items-center text-sm font-medium text-gray-700"
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">TYPE</span>
                <span>{selectedType}</span>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {isTypeDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <button onClick={() => { setSelectedType("All Types"); setIsTypeDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 text-gray-700">All Types</button>
                {allTypes.map(type => (
                  <button key={type} onClick={() => { setSelectedType(type); setIsTypeDropdownOpen(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 text-gray-700">{type}</button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCategoryModal(true)}
            className="bg-white border border-gray-200 text-gray-700 px-4 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm whitespace-nowrap"
          >
            <FolderPlus size={18} /> Add Category
          </button>

          {/* Add Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-[#193C6C] text-white px-6 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#15325b] transition-colors shadow-sm whitespace-nowrap"
          >
            <Plus size={18} /> Add more
          </button>
        </div>

        {/* Equipment List */}
        <div className="space-y-3 mt-2">
          {filteredEquipments.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-xl flex items-center justify-center shrink-0">
                {getTypeIcon(item.type)}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-400 font-bold">ID #{String(item.id).padStart(4, '0')}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-nowrap max-w-[100px] truncate">{item.room?.roomNumber}</span>
                  {item.serialNo && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-nowrap max-w-[100px] truncate">SN: {item.serialNo}</span>}
                </div>
              </div>
              <button
                onClick={() => showQR(item.id)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
              >
                <QrCode size={20} />
              </button>
            </div>
          ))}

          {filteredEquipments.length === 0 && !loading && (
            <div className="text-center py-10 text-gray-400">
              <p>No equipment found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6 text-center text-gray-800">Add New Equipment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                  Equipment Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 font-semibold text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-100 outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. MacBook Pro M1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                  Type
                </label>
                <select
                  required
                  className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 font-semibold text-gray-800 focus:ring-2 focus:ring-blue-100 outline-none appearance-none"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option value="">Select Type</option>
                  {allTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                  Serial Number (Optional)
                </label>
                <input
                  type="text"
                  className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 font-semibold text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-100 outline-none"
                  value={form.serialNo}
                  onChange={(e) =>
                    setForm({ ...form, serialNo: e.target.value })
                  }
                  placeholder="S/N..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                  Room
                </label>
                <select
                  required
                  className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 font-semibold text-gray-800 focus:ring-2 focus:ring-blue-100 outline-none appearance-none"
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

              <div className="grid grid-cols-2 gap-3 mt-8 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-3 bg-[#193C6C] text-white rounded-xl font-bold hover:bg-[#15325b]"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">QR Code</h2>

            <div className="text-center">
              <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-inner inline-block mb-4">
                <img
                  src={selectedQR.qrCodeImage}
                  alt="QR Code"
                  className="w-56 h-56 object-contain"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-xl mb-6 text-left">
                <p className="font-bold text-gray-900 text-lg">{selectedQR.equipment.name}</p>
                <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  <Monitor size={14} /> Room: {selectedQR.equipment.room.roomNumber}
                </p>
                {selectedQR.equipment.serialNo && (
                  <p className="text-xs text-gray-400 font-mono mt-2 bg-white px-2 py-1 rounded border inline-block">
                    SN: {selectedQR.equipment.serialNo}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowQRModal(false)}
                className="px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={printQR}
                className="px-4 py-3 bg-[#193C6C] text-white rounded-xl font-bold hover:bg-[#15325b] flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-4 text-center text-gray-800">Add New Category</h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 font-semibold text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-100 outline-none"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Tablet"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-3 bg-[#193C6C] text-white rounded-xl font-bold hover:bg-[#15325b]"
                >
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EquipmentManagement;
