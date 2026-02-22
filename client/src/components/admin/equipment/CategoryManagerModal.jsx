import React from "react";
import { X, Edit, Trash2, Save } from "lucide-react";

const CategoryManagerModal = ({
    isOpen,
    onClose,
    allCategories,
    newCategoryName,
    setNewCategoryName,
    handleAddCategory,
    editingCategory,
    setEditingCategory,
    handleUpdateCategory,
    handleDeleteCategory
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="text-xl text-[#1e2e4a]">Manage Categories</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 pr-1 custom-scrollbar">
                    {/* Add New Category Section */}
                    <div className="mb-8">
                        <label className="block text-xs text-gray-500 mb-2 uppercase">New Category</label>
                        <form onSubmit={handleAddCategory} className="flex gap-2">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="e.g. Workstation"
                                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e2e4a]/10 focus:border-[#1e2e4a] text-sm"
                            />
                            <button
                                type="submit"
                                className="bg-[#1e2e4a] text-white px-5 py-2.5 rounded-xl text-sm hover:bg-[#15325b] transition-colors"
                            >
                                Add
                            </button>
                        </form>
                    </div>

                    {/* Existing Categories List */}
                    <div>
                        <label className="block text-xs text-gray-500 mb-2 uppercase">Active Categories</label>
                        <div className="space-y-2">
                            {allCategories.map(cat => (
                                <div key={cat.id} className="bg-white border-b border-gray-100 last:border-0 p-3 flex items-center justify-between group">
                                    {editingCategory?.id === cat.id ? (
                                        <div className="flex-1 flex gap-2 mr-2" onClick={e => e.stopPropagation()}>
                                            <input
                                                type="text"
                                                value={editingCategory.name}
                                                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                                className="flex-1 px-3 py-1.5 rounded-lg border border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                                autoFocus
                                            />
                                            <button onClick={() => handleUpdateCategory(cat.id, editingCategory.name)} className="text-emerald-500 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors"><Save size={16} /></button>
                                            <button onClick={() => setEditingCategory(null)} className="text-gray-400 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><X size={16} /></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 flex-1 px-2">
                                            <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                                        </div>
                                    )}

                                    {editingCategory?.id !== cat.id && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => setEditingCategory({ id: cat.id, name: cat.name })}
                                                className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {allCategories.length === 0 && (
                            <p className="text-center text-sm text-gray-400 py-4">No categories found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryManagerModal;
