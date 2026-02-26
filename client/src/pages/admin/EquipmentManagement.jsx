// client/src/pages/admin/EquipmentManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Plus, Monitor, Printer, Wifi, Wind, Box, QrCode, Edit, Trash2, Layers, ChevronLeft, ChevronRight, CheckSquare, Square, X } from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { listCategories, createCategory, updateCategory, removeCategory, addSubComponent, removeSubComponent } from "../../api/category";
import { listEquipments, createEquipment, updateEquipment, removeEquipment, removeEquipmentsBulk, getEquipmentQR } from "../../api/equipment";
import { listRooms } from "../../api/room";
import AdminWrapper from "../../components/admin/AdminWrapper";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminSelect from "../../components/admin/AdminSelect";
import EquipmentFormModal from "../../components/admin/equipment/EquipmentFormModal";
import CategoryManagerModal from "../../components/admin/equipment/CategoryManagerModal";
import SubCategoryManagerModal from "../../components/admin/equipment/SubCategoryManagerModal";
import QRCodeModal from "../../components/admin/equipment/QRCodeModal";
import { confirmDialog } from "../../utils/sweetalert";

const EquipmentManagement = () => {
  const navigate = useNavigate();
  const [equipments, setEquipments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [selectedRoom, setSelectedRoom] = useState("All Rooms");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);

  // Categories State
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState(null); // { id, name }
  const [newSubComponentName, setNewSubComponentName] = useState("");
  const [selectedParentCategory, setSelectedParentCategory] = useState("");

  // Form (Add/Edit Equipment)
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [form, setForm] = useState({
    name: "",
    type: "", // This will now map to category name
    roomId: "",
    serialNo: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
  const [isBulkSelectMode, setIsBulkSelectMode] = useState(false);
  const [selectedEquipmentIds, setSelectedEquipmentIds] = useState([]);

  const loadEquipments = useCallback(async () => {
    try {
      const res = await listEquipments();
      setEquipments(res.data);
    } catch {
      /* console.error removed */
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRooms = useCallback(async () => {
    try {
      const res = await listRooms();
      setRooms(res.data);
    } catch {
      /* console.error removed */
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const res = await listCategories();
      setCategories(res.data);
    } catch {
      /* console.error removed */
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
    const confirmed = await confirmDialog({
      title: "Delete Equipment",
      text: "Are you sure you want to delete this equipment?",
      confirmButtonText: "Delete",
      confirmVariant: "danger",
    });
    if (!confirmed) return;

    try {
      await removeEquipment(id);
      toast.success("Equipment deleted successfully");
      loadEquipments();
    } catch {
      /* console.error removed */
      toast.error("Failed to delete equipment");
    }
  };

  const closeBulkSelectMode = useCallback(() => {
    setIsBulkSelectMode(false);
    setSelectedEquipmentIds([]);
  }, []);

  const toggleEquipmentSelection = (equipmentId) => {
    if (!isBulkSelectMode) return;
    setSelectedEquipmentIds((prev) =>
      prev.includes(equipmentId)
        ? prev.filter((id) => id !== equipmentId)
        : [...prev, equipmentId],
    );
  };

  const handleBulkDelete = async () => {
    if (!selectedEquipmentIds.length) return;

    const confirmed = await confirmDialog({
      title: "Delete Selected Equipment",
      text: `Delete ${selectedEquipmentIds.length} selected equipment item(s)?`,
      confirmButtonText: "Delete",
      confirmVariant: "danger",
    });
    if (!confirmed) return;

    try {
      const response = await removeEquipmentsBulk(selectedEquipmentIds);
      const deletedCount = Number(response?.data?.deletedCount || 0);
      const blockedIds = Array.isArray(response?.data?.blockedIds)
        ? response.data.blockedIds
        : [];

      if (deletedCount > 0) {
        toast.success(`Deleted ${deletedCount} equipment item(s)`);
      }
      if (blockedIds.length > 0) {
        toast.warn(`${blockedIds.length} item(s) were skipped (active tickets)`);
      }

      if (blockedIds.length > 0) {
        setSelectedEquipmentIds(blockedIds);
        setIsBulkSelectMode(true);
      } else {
        closeBulkSelectMode();
      }
      await loadEquipments();
    } catch (error) {
      const blockedIds = error?.response?.data?.blockedIds;
      if (Array.isArray(blockedIds) && blockedIds.length > 0) {
        toast.warn(`${blockedIds.length} item(s) cannot be deleted (active tickets)`);
        setSelectedEquipmentIds((prev) => prev.filter((id) => blockedIds.includes(id)));
        setIsBulkSelectMode(true);
      } else {
        toast.error(error?.response?.data?.message || "Failed to delete selected equipment");
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
    } catch {
      /* console.error removed */
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
    } catch {
      /* console.error removed */
      toast.error("Failed to update category");
    }
  };

  const handleDeleteCategory = async (id) => {
    const confirmed = await confirmDialog({
      title: "Delete Category",
      text: "Delete this category?",
      confirmButtonText: "Delete",
      confirmVariant: "danger",
    });
    if (!confirmed) return;
    try {
      await removeCategory(id);
      toast.success("Category deleted");
      loadCategories();
    } catch {
      /* console.error removed */
      toast.error("Failed to delete category");
    }
  };

  // --- SubComponent Management Logic ---
  const handleAddSubComponent = async (e, categoryId) => {
    e.preventDefault();
    if (!newSubComponentName.trim()) return;

    try {
      await addSubComponent(categoryId, { name: newSubComponentName });
      toast.success("Sub-component added");
      setNewSubComponentName("");
      loadCategories();
    } catch {
      /* console.error removed */
      toast.error("Failed to add sub-component");
    }
  };

  const handleDeleteSubComponent = async (subId) => {
    const confirmed = await confirmDialog({
      title: "Delete Sub-Category",
      text: "Delete this sub-category?",
      confirmButtonText: "Delete",
      confirmVariant: "danger",
    });
    if (!confirmed) return;
    try {
      await removeSubComponent(subId);
      toast.success("Sub-component deleted");
      loadCategories();
    } catch {
      /* console.error removed */
      toast.error("Failed to delete sub-component");
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
    // We compare type (which is saved as category name usually)
    const matchesCategory = selectedCategory === "All Categories" || item.type === selectedCategory;

    // We compare room id if a specific room is selected
    const matchesRoom = selectedRoom === "All Rooms" ||
      (item.roomId === selectedRoom) ||
      (item.room && item.room.id === selectedRoom);

    return matchesCategory && matchesRoom;
  }) : [];

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedRoom]);

  useEffect(() => {
    setSelectedEquipmentIds((prev) => {
      const existingIds = new Set((equipments || []).map((item) => item.id));
      return prev.filter((id) => existingIds.has(id));
    });
  }, [equipments]);

  useEffect(() => {
    if (!isBulkSelectMode && selectedEquipmentIds.length > 0) {
      setSelectedEquipmentIds([]);
    }
  }, [isBulkSelectMode, selectedEquipmentIds.length]);

  // Pagination Calculations
  const totalPages = Math.ceil(filteredEquipments.length / ITEMS_PER_PAGE);
  const paginatedEquipments = filteredEquipments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const visibleEquipmentIds = paginatedEquipments.map((item) => item.id);
  const allVisibleSelected =
    visibleEquipmentIds.length > 0 &&
    visibleEquipmentIds.every((id) => selectedEquipmentIds.includes(id));

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      // Optional: scroll to top of list
      // window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const toggleSelectVisible = () => {
    if (!isBulkSelectMode) return;
    setSelectedEquipmentIds((prev) => {
      const visibleSet = new Set(visibleEquipmentIds);
      const everyVisibleSelected = visibleEquipmentIds.length > 0 &&
        visibleEquipmentIds.every((id) => prev.includes(id));

      if (everyVisibleSelected) {
        return prev.filter((id) => !visibleSet.has(id));
      }
      return [...new Set([...prev, ...visibleEquipmentIds])];
    });
  };

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
      <div className="flex flex-col h-full bg-[#f8f9fa] px-6 pt-4 pb-6 space-y-4 overflow-hidden">
        {/* Header Card */}
        <AdminHeader
          title="Equipment Management"
          subtitle="Manage items, assets, and service history"
          onBack={() => navigate(-1)}
        />

        {/* Toolbar */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm flex flex-col gap-4 items-center border border-gray-50 shrink-0">
          <div className="flex flex-col xl:flex-row w-full xl:w-auto gap-3 items-center">
            {/* Category Dropdown & Actions */}
            <div className="relative w-full xl:w-auto flex flex-col md:flex-row gap-2">
              <div className="flex-1 md:w-36 lg:w-48">
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
                  buttonClassName="bg-gray-50/50 border-gray-100 px-4 py-4 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-100/50 transition-colors"
                />
              </div>
              <div className="flex-1 md:w-36 lg:w-48">
                <AdminSelect
                  value={selectedRoom}
                  onChange={setSelectedRoom}
                  options={[
                    { value: "All Rooms", label: "All Rooms" },
                    ...rooms.map(r => ({ value: r.id, label: `${r.roomNumber}` }))
                  ]}
                  placeholder="All Rooms"
                  className="w-full"
                  minWidth="w-full"
                  buttonClassName="bg-gray-50/50 border-gray-100 px-4 py-4 rounded-2xl text-sm font-semibold text-gray-700 hover:bg-gray-100/50 transition-colors"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="flex-1 md:flex-none bg-white text-[#1e2e4a] px-4 py-4 rounded-2xl hover:bg-gray-50 transition-colors border border-gray-200 group shadow-sm flex items-center justify-center gap-2"
                >
                  <Edit size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold whitespace-nowrap">Categories</span>
                </button>
                <button
                  onClick={() => setShowSubCategoryModal(true)}
                  className="flex-1 md:flex-none bg-white text-[#1e2e4a] px-4 py-4 rounded-2xl hover:bg-gray-50 transition-colors border border-gray-200 group shadow-sm flex items-center justify-center gap-2"
                >
                  <Layers size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-semibold whitespace-nowrap">Sub-Categories</span>
                </button>
              </div>
            </div>

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
        <div className="px-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.15em]">
              Inventory Overview
            </h2>
            <div className="h-px w-8 bg-gray-200" />
            <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {filteredEquipments.length} {filteredEquipments.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isBulkSelectMode ? (
              <button
                type="button"
                onClick={() => setIsBulkSelectMode(true)}
                className="inline-flex items-center gap-1.5 h-8 text-[11px] font-semibold text-[#1e2e4a] bg-white border border-gray-200 rounded-lg px-2.5 hover:bg-gray-50 transition-colors"
                title="Select multiple items"
              >
                <Square size={14} />
                Select
              </button>
            ) : (
              <>
                <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100">
                  {selectedEquipmentIds.length}
                </span>
                <button
                  type="button"
                  onClick={toggleSelectVisible}
                  disabled={!paginatedEquipments.length}
                  className="inline-flex items-center gap-1.5 h-8 text-[11px] font-semibold text-[#1e2e4a] bg-white border border-gray-200 rounded-lg px-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={allVisibleSelected ? "Unselect current page" : "Select current page"}
                >
                  {allVisibleSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                  {allVisibleSelected ? "Unselect Page" : "Select Page"}
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={!selectedEquipmentIds.length}
                  className="inline-flex items-center gap-1.5 h-8 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete selected items"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
                <button
                  type="button"
                  onClick={closeBulkSelectMode}
                  className="inline-flex items-center gap-1.5 h-8 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg px-2.5 hover:bg-gray-50 transition-colors"
                  title="Exit selection mode"
                >
                  <X size={12} />
                  Done
                </button>
              </>
            )}
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedEquipments.map((item) => (
              <div
                key={item.id}
                className={`bg-white p-4 rounded-2xl shadow-sm border flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group ${selectedEquipmentIds.includes(item.id) ? "border-blue-200" : "border-gray-50"}`}
              >
                {/* Subtle background decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                {isBulkSelectMode && (
                  <button
                    type="button"
                    onClick={() => toggleEquipmentSelection(item.id)}
                    className="absolute left-3 top-3 z-30 w-6 h-6 rounded-md bg-white/95 border border-gray-200 text-[#1e2e4a] flex items-center justify-center hover:bg-gray-50 transition-colors"
                    title={selectedEquipmentIds.includes(item.id) ? "Unselect item" : "Select item"}
                  >
                    {selectedEquipmentIds.includes(item.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                  </button>
                )}

                <div className="flex items-center gap-3 min-w-0 z-10">
                  {/* Icon Container (matching User Avatar size constraint) */}
                  <div className="w-16 h-16 rounded-2xl bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm text-[#1e2e4a]">
                    {getCategoryIcon(item.type)}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 pr-2">
                    <h3 className="text-[#1e2e4a] text-base leading-tight truncate group-hover:text-blue-700 transition-colors font-bold">{item.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest truncate">
                        ID #{String(item.id).padStart(4, '0')}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-nowrap overflow-hidden">
                      <span className="shrink-0 inline-block px-2.5 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600 font-bold border border-gray-200/50">
                        {item.room?.roomNumber || "No Room"}
                      </span>
                      {item.serialNo && (
                        <span className="shrink-0 inline-block px-2.5 py-0.5 rounded-full text-[10px] bg-white text-gray-500 font-mono border border-gray-100 truncate max-w-[100px]">
                          SN: {item.serialNo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 text-gray-300 ml-2 shrink-0 z-20">
                  <button
                    onClick={() => openEditModal(item)}
                    className="hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => showQR(item.id)}
                    className="hover:text-[#1e2e4a] transition-colors"
                    title="View QR Code"
                  >
                    <QrCode size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteEquipment(item.id)}
                    className="hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
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

        {/* Pagination — pinned to the bottom of the viewport */}
        {totalPages > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-100 flex justify-center items-center gap-1 py-3 flex-wrap">
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-600"
            >
              <ChevronLeft size={20} />
            </button>

            {(() => {
              const generatePages = () => {
                const pages = [];
                const addPage = (num, type = 'visible') => pages.push({ num, type });
                const addEllipsis = () => pages.push({ num: '...', type: 'visible' });

                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) addPage(i);
                } else {
                  if (currentPage <= 4) {
                    for (let i = 1; i <= 5; i++) addPage(i, i > 3 && i < 5 ? 'desktop-only' : 'visible');
                    addEllipsis();
                    addPage(totalPages);
                  } else if (currentPage >= totalPages - 3) {
                    addPage(1);
                    addEllipsis();
                    for (let i = totalPages - 4; i <= totalPages; i++) {
                      addPage(i, i > totalPages - 4 && i < totalPages - 2 ? 'desktop-only' : 'visible');
                    }
                  } else {
                    addPage(1);
                    addEllipsis();
                    addPage(currentPage - 1, 'desktop-only');
                    addPage(currentPage);
                    addPage(currentPage + 1, 'desktop-only');
                    addEllipsis();
                    addPage(totalPages);
                  }
                }
                return pages;
              };

              return generatePages().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page.num === 'number' && handlePageChange(page.num)}
                  disabled={page.num === '...'}
                  className={`flex items-center justify-center rounded-lg text-sm transition-all
                    ${page.type === 'desktop-only' ? 'hidden md:flex' : 'flex'}
                    ${page.num === '...' ? 'w-6 md:w-8 cursor-default text-gray-400' : 'w-8 h-8 md:w-9 md:h-9'}
                    ${page.num === currentPage
                      ? 'bg-[#1e2e4a] text-white shadow-md shadow-blue-900/10'
                      : page.num === '...'
                        ? ''
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {page.num}
                </button>
              ));
            })()}

            <button
              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-gray-600"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Extracted Modals */}
        <EquipmentFormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSubmit={handleEquipmentSubmit}
          isEditing={!!editingEquipment}
          form={form}
          setForm={setForm}
          allCategories={allCategories}
          rooms={rooms}
        />

        <CategoryManagerModal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          allCategories={allCategories}
          newCategoryName={newCategoryName}
          setNewCategoryName={setNewCategoryName}
          handleAddCategory={handleAddCategory}
          editingCategory={editingCategory}
          setEditingCategory={setEditingCategory}
          handleUpdateCategory={handleUpdateCategory}
          handleDeleteCategory={handleDeleteCategory}
        />

        <SubCategoryManagerModal
          isOpen={showSubCategoryModal}
          onClose={() => setShowSubCategoryModal(false)}
          allCategories={allCategories}
          selectedParentCategory={selectedParentCategory}
          setSelectedParentCategory={setSelectedParentCategory}
          newSubComponentName={newSubComponentName}
          setNewSubComponentName={setNewSubComponentName}
          handleAddSubComponent={handleAddSubComponent}
          handleDeleteSubComponent={handleDeleteSubComponent}
        />

        <QRCodeModal
          isOpen={showQRModal}
          onClose={() => setShowQRModal(false)}
          selectedQR={selectedQR}
          onPrint={printQR}
        />
      </div>
    </AdminWrapper >
  );
};

export default EquipmentManagement;
