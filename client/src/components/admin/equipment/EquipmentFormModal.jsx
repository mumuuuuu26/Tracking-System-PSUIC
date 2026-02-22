import React from "react";
import { X } from "lucide-react";
import AdminSelect from "../AdminSelect";

const EquipmentFormModal = ({
    isOpen,
    onClose,
    onSubmit,
    isEditing,
    form,
    setForm,
    allCategories,
    rooms
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-300">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl text-[#1e2e4a]">{isEditing ? "Edit Equipment" : "Add New Equipment"}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1 uppercase">Equipment Name</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e2e4a]/10 focus:border-[#1e2e4a] text-sm"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g. MacBook Pro M1"
                        />
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1 uppercase">Category / Type</label>
                        <div className="relative">
                            <AdminSelect
                                value={form.type}
                                onChange={(val) => setForm({ ...form, type: val })}
                                options={allCategories.map((cat) => cat.name)}
                                placeholder="Select Category"
                                className="w-full"
                                minWidth="w-full"
                                buttonClassName="bg-white border-gray-200 px-4 py-2.5 rounded-xl text-sm font-normal text-gray-700 hover:bg-gray-50 transition-colors"
                                dropdownClassName="rounded-xl border border-gray-100 shadow-xl overflow-hidden mt-1 max-h-48 overflow-y-auto"
                                optionClassName="px-4 py-2.5 text-sm cursor-pointer transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1 uppercase">Room / Location</label>
                        <div className="relative">
                            <AdminSelect
                                value={form.roomId}
                                onChange={(val) => setForm({ ...form, roomId: val })}
                                options={rooms.map((room) => ({
                                    value: room.id,
                                    label: `${room.roomNumber} - ${room.building}`,
                                }))}
                                placeholder="Select Room"
                                className="w-full"
                                minWidth="w-full"
                                buttonClassName="bg-white border-gray-200 px-4 py-2.5 rounded-xl text-sm font-normal text-gray-700 hover:bg-gray-50 transition-colors"
                                dropdownClassName="rounded-xl border border-gray-100 shadow-xl overflow-hidden mt-1 max-h-48 overflow-y-auto"
                                optionClassName="px-4 py-2.5 text-sm cursor-pointer transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs text-gray-500 mb-1 uppercase">Serial Number <span className="text-gray-400 lowercase">(optional)</span></label>
                        <input
                            type="text"
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e2e4a]/10 focus:border-[#1e2e4a] text-sm"
                            value={form.serialNo || ""}
                            onChange={(e) => setForm({ ...form, serialNo: e.target.value })}
                            placeholder="e.g. SN-W-123"
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            className="w-full bg-[#1e2e4a] text-white py-3 rounded-xl hover:bg-[#15325b] transition-colors mt-2"
                        >
                            {isEditing ? "Update Equipment" : "Create Equipment"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EquipmentFormModal;
