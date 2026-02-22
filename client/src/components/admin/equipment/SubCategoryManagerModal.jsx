import React from "react";
import { X, Trash2 } from "lucide-react";
import AdminSelect from "../AdminSelect";

const SubCategoryManagerModal = ({
    isOpen,
    onClose,
    allCategories,
    selectedParentCategory,
    setSelectedParentCategory,
    newSubComponentName,
    setNewSubComponentName,
    handleAddSubComponent,
    handleDeleteSubComponent
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col max-h-[85vh]">
                <div className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="text-xl text-[#1e2e4a]">Manage Sub-Categories</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex flex-col flex-1 min-h-0">
                    <div className="mb-6 z-50">
                        <label className="block text-xs text-gray-500 mb-2 uppercase">Select Parent Category</label>
                        <AdminSelect
                            value={selectedParentCategory}
                            onChange={(val) => setSelectedParentCategory(val)}
                            options={allCategories.map(cat => ({ value: cat.id, label: cat.name }))}
                            placeholder="-- Choose a category --"
                            className="w-full"
                            minWidth="w-full"
                            buttonClassName="w-full bg-white border-gray-200 px-4 py-2.5 rounded-xl text-sm font-normal text-gray-700 hover:bg-gray-50 transition-colors text-left shadow-sm"
                        />
                    </div>

                    {selectedParentCategory && (
                        <div className="animate-in fade-in duration-300 flex flex-col flex-1 min-h-0">
                            <div className="shrink-0">
                                <label className="block text-xs text-gray-500 mb-2 uppercase">Add New Sub-Category</label>
                                <form onSubmit={(e) => handleAddSubComponent(e, selectedParentCategory)} className="flex gap-2 mb-6">
                                    <input
                                        type="text"
                                        value={newSubComponentName}
                                        onChange={(e) => setNewSubComponentName(e.target.value)}
                                        placeholder="e.g. Wired Mouse"
                                        className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1e2e4a]/10 focus:border-[#1e2e4a] text-sm"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-[#1e2e4a] text-white px-5 py-2.5 rounded-xl text-sm hover:bg-[#15325b] transition-colors"
                                    >
                                        Add
                                    </button>
                                </form>

                                <label className="block text-xs text-gray-500 mb-2 uppercase">Active Sub-Categories</label>
                            </div>

                            <div className="space-y-1 overflow-y-auto custom-scrollbar flex-1 min-h-0 max-h-[40vh] pr-2 pb-2">
                                {(() => {
                                    const parentCat = allCategories.find(c => c.id === selectedParentCategory);
                                    const subCategoriesList = parentCat?.subComponents || [];

                                    if (subCategoriesList.length === 0) {
                                        return (
                                            <div className="text-center bg-gray-50 py-4 rounded-xl border border-dashed border-gray-200">
                                                <p className="text-xs text-gray-400">No sub-categories yet.</p>
                                            </div>
                                        );
                                    }

                                    return subCategoriesList.map(sub => (
                                        <div key={sub.id} className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all group">
                                            <span className="text-sm font-medium text-gray-700">{sub.name}</span>
                                            <button
                                                onClick={() => handleDeleteSubComponent(sub.id)}
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                title="Delete Sub-Category"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubCategoryManagerModal;
