// client/src/pages/admin/EquipmentManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, ChevronDown, Monitor, Printer, Wifi, Wind, Box, ArrowLeft, QrCode, Edit, Trash2, X, Save } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { listCategories, createCategory, updateCategory, removeCategory } from "../../api/category"; // Updated imports
import AdminWrapper from "../../components/admin/AdminWrapper";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminSelect from "../../components/admin/AdminSelect";

const EquipmentManagement = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [equipments, setEquipments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);

  // Categories State
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null); // { id, name }

  // Form (Add/Edit Equipment)
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "", // This will now map to category name
    roomId: "",
  });

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

  // Combine fetched categories for the dropdown
  const allCategories = [...categories];

  const handleEquipmentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEquipment) {
        // Update existing equipment
        await axios.put(`/api/equipment/${editingEquipment.id}`, form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Equipment updated successfully");
      } else {
        // Create new equipment
        await axios.post("/api/equipment", form, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Equipment created successfully");
      }
      loadEquipments();
      setShowAddModal(false);
      setEditingEquipment(null);
      setForm({ name: "", type: "", roomId: "" });
    } catch {
      toast.error(editingEquipment ? "Failed to update equipment" : "Failed to create equipment");
    }
  };

  const openAddModal = () => {
    setEditingEquipment(null);
    setForm({ name: "", type: "", roomId: "" });
    setShowAddModal(true);
  };

  const openEditModal = (item) => {
    setEditingEquipment(item);
    setForm({
      name: item.name,
      type: item.type,
      serialNo: item.serialNo || "",
      roomId: item.roomId || (item.room ? item.room.id : ""),
    });
    setShowAddModal(true);
  };

  const handleDeleteEquipment = async (id) => {
    if (window.confirm("Are you sure you want to delete this equipment?")) {
      try {
        // Assuming DELETE endpoint exists as per standard REST, though not explicitly in the previous file view
        // If not, we might need to add it to equipment.js api or check routes. 
        // For now, using axios directly as seen in loadEquipments
        await axios.delete(`/api/equipment/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Equipment deleted successfully");
        loadEquipments();
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete equipment");
      }
    }
  };


  // --- Category Management Logic ---

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      await createCategory(token, { name: newCategoryName });
      toast.success("Category added");
      setNewCategoryName("");
      loadCategories();
    } catch (err) {
      console.error(err);
      toast.error("Failed to add category");
    }
  };

  const handleUpdateCategory = async (id, name) => {
    if (!name.trim()) return;
    try {
      await updateCategory(token, id, { name });
      toast.success("Category updated");
      setEditingCategory(null);
      loadCategories();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await removeCategory(token, id);
      toast.success("Category deleted");
      loadCategories();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete category");
    }
  };

  // --- QR Code Logic ---

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
                          body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                          .container { border: 2px solid #333; padding: 20px; border-radius: 10px; margin: 20px auto; width: 350px; }
                          h2 { color: #333; margin: 10px 0; }
                          .info { background: #f0f0f0; padding: 10px; border-radius: 5px; margin: 10px 0; }
                          .qr-code { margin: 20px 0; }
                          .footer { margin-top: 20px; font-size: 12px; color: #666; margin: 0; }
                      </style>
                  </head>
                  <body>
                      <div class="container">
                          <h2>PSUIC Service</h2>
                          <div class="qr-code"><img src="${selectedQR.qrCodeImage}" style="width: 250px; height: 250px;"></div>
                          <div class="info">
                              <p><strong>Equipment:</strong> ${selectedQR.equipment.name}</p>
                              <p><strong>Room:</strong> ${selectedQR.equipment.room.roomNumber}</p>
                              <p><strong>Serial:</strong> ${selectedQR.equipment.serialNo || "-"}</p>
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

    // We compare type (which is saved as category name usually)
    const matchesCategory = selectedCategory === "All Categories" || item.type === selectedCategory;

    return matchesSearch && matchesCategory;
  }) : [];

  const getCategoryIcon = (type) => {
    // Simple mapping based on name
    const lower = type?.toLowerCase() || "";
    if (lower.includes('comp') || lower.includes('pc')) return <Monitor size={24} className="text-[#1e2e4a]" />;
    if (lower.includes('print')) return <Printer size={24} className="text-[#1e2e4a]" />;
    if (lower.includes('net') || lower.includes('wifi')) return <Wifi size={24} className="text-[#1e2e4a]" />;
    if (lower.includes('air')) return <Wind size={24} className="text-[#1e2e4a]" />;
    return <Box size={24} className="text-[#1e2e4a]" />;
  };

  return (
    <AdminWrapper>
      <div className="flex flex-col h-full px-6 pt-6 pb-6 space-y-6 overflow-y-auto">
        {/* Header Card */}
        <AdminHeader
          title="Equipment Management"
          subtitle="Manage items, assets, and service history"
          onBack={() => navigate(-1)}
        />

        {/* Toolbar */}
        <div className="bg-white rounded-3xl p-4 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
          {/* Search */}
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search asset ID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a] transition-all border border-gray-100 font-medium text-gray-700"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative w-full md:w-64 flex gap-2">
            <div className="flex-1">
              <AdminSelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  "All Categories",
                  ...allCategories.map(c => c.name)
                ]}
                placeholder="All Categories"
                className="w-full"
                minWidth="w-full"
              />
            </div>
            <button
              onClick={() => setShowCategoryModal(true)}
              className="bg-gray-50 text-[#1e2e4a] px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors uppercase tracking-wider h-full border border-gray-200"
              title="Manage Categories"
            >
              <Edit size={16} />
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={openAddModal}
            className="w-full md:w-auto bg-[#1e2e4a] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#15233b] transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            Add Equipment
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 ml-1">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total Items <span className="text-gray-300 ml-1">({filteredEquipments.length})</span>
          </h2>
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipments.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-start gap-4 group">
              <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 text-[#1e2e4a]">
                {getCategoryIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0 py-1">
                <div className="mb-2">
                  <h3 className="font-bold text-[#1e2e4a] text-lg leading-tight truncate pr-2">{item.name}</h3>
                  <p className="text-gray-400 text-xs font-bold mt-0.5">ID #{String(item.id).padStart(4, '0')}</p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                    {item.room?.roomNumber || "No Room"}
                  </span>
                  {item.serialNo && (
                    <span className="text-[10px] font-mono text-gray-400 border border-gray-100 px-2 py-1 rounded-md truncate max-w-[120px]">
                      SN: {item.serialNo}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Column */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDeleteEquipment(item.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => showQR(item.id)}
                  className="p-2 text-gray-400 hover:text-[#1e2e4a] hover:bg-blue-50 rounded-lg transition-colors mt-1"
                  title="View QR Code"
                >
                  <QrCode size={18} />
                </button>
              </div>
            </div>
          ))}

          {filteredEquipments.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center text-gray-400">
              <Box size={48} className="mb-4 opacity-20" />
              <p>No equipment found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Equipment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2e4a]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-[#1e2e4a]">{editingEquipment ? "Edit Equipment" : "Add New Equipment"}</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"><X size={20} /></button>
            </div>

            <form onSubmit={handleEquipmentSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Equipment Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a] outline-none transition-all placeholder-gray-400 font-medium text-gray-800"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. MacBook Pro M1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category / Type</label>
                <AdminSelect
                  value={form.type}
                  onChange={(val) => setForm({ ...form, type: val })}
                  options={allCategories.map(cat => cat.name)}
                  placeholder="Select Category"
                  className="w-full"
                  minWidth="w-full"
                  buttonClassName="bg-gray-50 border-gray-200 px-4 py-3 rounded-xl text-sm font-medium text-gray-800"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Serial Number removed - auto-generated by backend */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Room</label>
                  <AdminSelect
                    value={form.roomId}
                    onChange={(val) => setForm({ ...form, roomId: val })}
                    options={rooms.map(room => ({
                      value: room.id,
                      label: `${room.roomNumber} - ${room.building}`
                    }))}
                    placeholder="Select Room"
                    className="w-full"
                    minWidth="w-full"
                    buttonClassName="bg-gray-50 border-gray-200 px-4 py-3 rounded-xl text-sm font-medium text-gray-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#1e2e4a] text-white py-4 rounded-xl font-bold hover:bg-[#15325b] transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98]"
              >
                {editingEquipment ? "Update Equipment" : "Confirm"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2e4a]/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-[#1e2e4a]">Manage Categories</h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"><X size={20} /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Add New Category Section */}
              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Add New Category</label>
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Server"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:bg-white focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a] outline-none transition-all font-medium text-gray-800"
                  />
                  <button type="submit" className="bg-[#1e2e4a] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#15325b] transition-colors">
                    Add
                  </button>
                </form>
              </div>

              {/* Existing Categories List */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Existing Categories</label>
                <div className="space-y-2">
                  {allCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-gray-300 transition-colors group">
                      {editingCategory?.id === cat.id ? (
                        <div className="flex-1 flex gap-2 mr-2">
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="flex-1 bg-white border border-blue-500 rounded-lg px-2 py-1 text-sm outline-none"
                            autoFocus
                          />
                          <button onClick={() => handleUpdateCategory(cat.id, editingCategory.name)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={16} /></button>
                          <button onClick={() => setEditingCategory(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded"><X size={16} /></button>
                        </div>
                      ) : (
                        <span className="font-medium text-gray-700">{cat.name}</span>
                      )}

                      {editingCategory?.id !== cat.id && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingCategory({ id: cat.id, name: cat.name })}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">QR Code</h2>
              <button onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <div className="text-center">
              <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-inner inline-block mb-4">
                <img src={selectedQR.qrCodeImage} alt="QR Code" className="w-56 h-56 object-contain" />
              </div>
              <div className="bg-gray-50 p-4 rounded-xl mb-6 text-left">
                <p className="font-bold text-gray-900 text-lg">{selectedQR.equipment.name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                  <Monitor size={16} className="text-blue-500" />
                  <span>Room: {selectedQR.equipment.room.roomNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Box size={16} className="text-orange-500" />
                  <span>SN: {selectedQR.equipment.serialNo || "-"}</span>
                </div>
              </div>
            </div>
            <button onClick={printQR} className="w-full py-3 bg-[#193C6C] text-white rounded-xl font-bold hover:bg-[#15325b] flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20">
              <Printer size={18} /> Print
            </button>
          </div>
        </div>
      )}
    </AdminWrapper >
  );
};

export default EquipmentManagement;
