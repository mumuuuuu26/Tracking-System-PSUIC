// client/src/pages/admin/EquipmentManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, ChevronDown, Monitor, Printer, Wifi, Wind, Box, ArrowLeft, QrCode, Edit, Trash2, X, Save } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { listCategories, createCategory, updateCategory, removeCategory } from "../../api/category";
import { listEquipments, createEquipment, updateEquipment, removeEquipment, getEquipmentQR } from "../../api/equipment";
import { listRooms } from "../../api/room";
import AdminWrapper from "../../components/admin/AdminWrapper";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminSelect from "../../components/admin/AdminSelect";

const EquipmentManagement = () => {
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
    serialNo: "",
  });

  const loadEquipments = useCallback(async () => {
    try {
      const res = await listEquipments();
      setEquipments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRooms = useCallback(async () => {
    try {
      const res = await listRooms();
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await listCategories();
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  }, []);

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
        await updateEquipment(editingEquipment.id, form);
        toast.success("Equipment updated successfully");
      } else {
        // Create new equipment
        await createEquipment(form);
        toast.success("Equipment created successfully");
      }
      loadEquipments();
      setShowAddModal(false);
      setEditingEquipment(null);
      setForm({ name: "", type: "", roomId: "", serialNo: "" });
    } catch {
      toast.error(editingEquipment ? "Failed to update equipment" : "Failed to create equipment");
    }
  };

  const openAddModal = () => {
    setEditingEquipment(null);
    setForm({ name: "", type: "", roomId: "", serialNo: "" });
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
        await removeEquipment(id);
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
      await createCategory({ name: newCategoryName });
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
      await updateCategory(id, { name });
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
      await removeCategory(id);
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
      const res = await getEquipmentQR(equipmentId);
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
      <div className="flex flex-col h-full px-6 pt-6 pb-24 md:pb-6 space-y-6 overflow-y-auto">
        {/* Header Card */}
        <AdminHeader
          title="Equipment Management"
          subtitle="Manage items, assets, and service history"
          onBack={() => navigate(-1)}
        />

        {/* Toolbar */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center border border-gray-50">
          {/* Search */}
          <div className="flex-1 relative w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search asset ID or Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1e2e4a]/10 focus:border-[#1e2e4a]/20 transition-all border border-gray-100 font-medium text-gray-700 placeholder:text-gray-400"
            />
          </div>

          <div className="flex flex-col md:flex-row w-full md:w-auto gap-3 items-center">
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
                  buttonClassName="bg-gray-50/50 border-gray-100 px-5 py-4 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-100/50 transition-colors"
                />
              </div>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="bg-gray-50/50 text-[#1e2e4a] p-4 rounded-2xl hover:bg-gray-100/50 transition-colors border border-gray-100 group shadow-sm"
                title="Manage Categories"
              >
                <Edit size={20} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Add Button */}
            <button
              onClick={openAddModal}
              className="w-full md:w-auto whitespace-nowrap bg-[#1e2e4a] text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#15233b] transition-all shadow-lg shadow-blue-900/10 hover:shadow-blue-900/20 active:scale-[0.98]"
            >
              <Plus size={22} strokeWidth={2.5} />
              Add Equipment
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 px-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">
              Inventory Overview
            </h2>
            <div className="h-px w-8 bg-gray-200" />
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {filteredEquipments.length} {filteredEquipments.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {filteredEquipments.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-start gap-5 group relative overflow-hidden">
              {/* Subtle background decoration */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />

              <div className="relative w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 text-[#1e2e4a] shadow-inner border border-gray-100/50">
                {getCategoryIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0 py-1 relative z-10">
                <div className="mb-2.5">
                  <h3 className="font-bold text-[#1e2e4a] text-lg leading-tight truncate pr-8 group-hover:text-blue-700 transition-colors">{item.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">ID #{String(item.id).padStart(4, '0')}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded-lg border border-gray-200/50">
                    {item.room?.roomNumber || "No Room"}
                  </span>
                  {item.serialNo && (
                    <span className="text-[10px] font-mono text-gray-500 bg-white border border-gray-100 px-2.5 py-1.5 rounded-lg truncate max-w-[130px] shadow-sm">
                      SN: {item.serialNo}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Overlay */}
              <div className="absolute top-4 right-4 flex flex-col gap-1 shrink-0 z-20">
                <button
                  onClick={() => openEditModal(item)}
                  className="p-2 text-gray-300 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all hover:shadow-sm"
                  title="Edit"
                >
                  <Edit size={16} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => showQR(item.id)}
                  className="p-2 text-gray-300 hover:text-[#1e2e4a] hover:bg-gray-50 rounded-xl transition-all hover:shadow-sm"
                  title="View QR Code"
                >
                  <QrCode size={16} strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => handleDeleteEquipment(item.id)}
                  className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all hover:shadow-sm"
                  title="Delete"
                >
                  <Trash2 size={16} strokeWidth={2.5} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2e4a]/60 backdrop-blur-md p-4 transition-all duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="px-8 py-7 border-b border-gray-50 flex justify-between items-center bg-white">
              <h2 className="text-2xl font-black text-[#1e2e4a] tracking-tight">{editingEquipment ? "Edit Equipment" : "Add New Equipment"}</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-[#1e2e4a] bg-gray-50 p-2.5 rounded-full hover:bg-gray-100 transition-all group"
              >
                <X size={22} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <form onSubmit={handleEquipmentSubmit} className="p-8 space-y-7">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3 ml-1">Equipment Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-4 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 outline-none transition-all placeholder:text-gray-300 font-semibold text-gray-700"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. MacBook Pro M1"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3 ml-1">Category / Type</label>
                <AdminSelect
                  value={form.type}
                  onChange={(val) => setForm({ ...form, type: val })}
                  options={allCategories.map(cat => cat.name)}
                  placeholder="Select Category"
                  className="w-full"
                  minWidth="w-full"
                  buttonClassName="bg-gray-50/50 border-gray-100 px-6 py-4 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-100/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3 ml-1">Room / Location</label>
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
                  buttonClassName="bg-gray-50/50 border-gray-100 px-6 py-4 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-100/50 transition-colors"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#1e2e4a] text-white py-5 rounded-2xl font-bold text-lg hover:bg-[#15325b] transition-all shadow-xl shadow-blue-900/10 active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {editingEquipment ? "Update Equipment" : "Confirm & Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Categories Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2e4a]/60 backdrop-blur-md p-4 transition-all duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[85vh] flex flex-col">
            <div className="px-8 py-7 border-b border-gray-50 flex justify-between items-center bg-white">
              <h2 className="text-xl font-black text-[#1e2e4a] tracking-tight text-center uppercase tracking-widest">Manage Categories</h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-[#1e2e4a] bg-gray-50 p-2 rounded-full hover:bg-gray-100 transition-colors"><X size={20} /></button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              {/* Add New Category Section */}
              <div className="mb-10">
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 ml-1">New Category</label>
                <form onSubmit={handleAddCategory} className="flex gap-3">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Workstation"
                    className="flex-1 bg-gray-50/50 border border-gray-100 rounded-2xl px-5 py-3.5 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/20 outline-none transition-all font-semibold text-gray-700"
                  />
                  <button type="submit" className="bg-[#1e2e4a] text-white px-6 py-3.5 rounded-2xl font-bold text-sm hover:bg-[#15325b] transition-all shadow-lg shadow-blue-900/10 active:scale-95">
                    Add
                  </button>
                </form>
              </div>

              {/* Existing Categories List */}
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] mb-4 ml-1">Active Categories</label>
                <div className="space-y-3">
                  {allCategories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-4 bg-gray-50/30 border border-gray-50 rounded-2xl shadow-sm hover:bg-white hover:border-gray-100 hover:shadow-md transition-all group">
                      {editingCategory?.id === cat.id ? (
                        <div className="flex-1 flex gap-2 mr-2">
                          <input
                            type="text"
                            value={editingCategory.name}
                            onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                            className="flex-1 bg-white border-2 border-blue-500/50 rounded-xl px-3 py-2 text-sm font-bold outline-none"
                            autoFocus
                          />
                          <button onClick={() => handleUpdateCategory(cat.id, editingCategory.name)} className="text-emerald-500 hover:bg-emerald-50 p-2 rounded-xl transition-colors"><Save size={18} /></button>
                          <button onClick={() => setEditingCategory(null)} className="text-gray-400 hover:bg-gray-100 p-2 rounded-xl transition-colors"><X size={18} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500/30" />
                          <span className="font-bold text-gray-700">{cat.name}</span>
                        </div>
                      )}

                      {editingCategory?.id !== cat.id && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button
                            onClick={() => setEditingCategory({ id: cat.id, name: cat.name })}
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
                          >
                            <Edit size={16} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 size={16} strokeWidth={2.5} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2e4a]/70 p-4 backdrop-blur-md transition-all duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-300 text-center">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-[#1e2e4a] tracking-tight uppercase tracking-widest">Asset QR Code</h2>
              <button onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-[#1e2e4a] bg-gray-50 p-2 rounded-full transition-colors font-bold"><X size={20} /></button>
            </div>

            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-inner inline-block mb-8 group">
              <img
                src={selectedQR.qrCodeImage}
                alt="QR Code"
                className="w-48 h-48 object-contain mix-blend-multiply transition-transform group-hover:scale-105 duration-500"
              />
            </div>

            <div className="bg-gray-50/50 p-6 rounded-2xl mb-8 text-left border border-gray-100">
              <p className="font-black text-[#1e2e4a] text-xl leading-tight mb-4">{selectedQR.equipment.name}</p>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600 font-bold uppercase tracking-wider bg-white/50 p-2 rounded-lg">
                  <Monitor size={16} className="text-blue-500" strokeWidth={2.5} />
                  <span>Room: {selectedQR.equipment.room.roomNumber}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 font-bold uppercase tracking-wider bg-white/50 p-2 rounded-lg">
                  <Box size={16} className="text-orange-500" strokeWidth={2.5} />
                  <span>SN: {selectedQR.equipment.serialNo || "NO SERIAL"}</span>
                </div>
              </div>
            </div>

            <button
              onClick={printQR}
              className="w-full py-4 bg-[#1e2e4a] text-white rounded-2xl font-bold hover:bg-[#15325b] flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10 active:scale-95 transition-all"
            >
              <Printer size={20} strokeWidth={2.5} /> Print Asset Tag
            </button>
          </div>
        </div>
      )}
    </AdminWrapper >
  );
};

export default EquipmentManagement;
