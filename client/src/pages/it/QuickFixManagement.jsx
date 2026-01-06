import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, X, Wrench, Save } from "lucide-react";
import { listQuickFixes, createQuickFix, updateQuickFix, removeQuickFix } from "../../api/quickFix";
import { listCategories } from "../../api/category";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";

const QuickFixManagement = () => {
    const { token } = useAuthStore();
    const [quickFixes, setQuickFixes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredFixes, setFilteredFixes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("All");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        steps: "",
        categoryId: ""
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        let filtered = quickFixes;

        if (searchTerm) {
            filtered = filtered.filter(f => f.title.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (filterCategory !== "All") {
            filtered = filtered.filter(f => f.categoryId === parseInt(filterCategory));
        }

        setFilteredFixes(filtered);
    }, [searchTerm, filterCategory, quickFixes]);

    const loadData = async () => {
        try {
            const [fixRes, catRes] = await Promise.all([
                listQuickFixes(token),
                listCategories(token)
            ]);
            setQuickFixes(fixRes.data);
            setFilteredFixes(fixRes.data);
            setCategories(catRes.data);
        } catch (err) {
            console.log(err);
            toast.error("Failed to load data");
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setFormData({ title: "", steps: "", categoryId: "" });
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setIsEditMode(true);
        setCurrentId(item.id);
        setFormData({
            title: item.title,
            steps: item.steps, // Assume simple text with newlines or JSON
            categoryId: item.categoryId
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Steps: Convert to string if array, or keep as string
            // For now, we'll store steps as a newline-separated string in the DB text field
            // and split it when displaying.

            if (isEditMode) {
                await updateQuickFix(token, currentId, formData);
                toast.success("Updated successfully");
            } else {
                await createQuickFix(token, formData);
                toast.success("Created successfully");
            }
            setIsModalOpen(false);
            loadData();
        } catch (err) {
            console.log(err);
            toast.error("Failed to save");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) {
            try {
                await removeQuickFix(token, id);
                toast.success("Deleted successfully");
                loadData();
            } catch (err) {
                console.log(err);
                toast.error("Failed to delete");
            }
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">Quick Fix Management</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage troubleshooting guides for users</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95 font-medium"
                >
                    <Plus size={20} />
                    Add New Guide
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 sticky top-20 z-10 backdrop-blur-xl bg-white/80">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search guides by title or steps..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all border"
                    />
                </div>
                <select
                    className="px-4 py-3 bg-gray-50/50 border-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-w-[200px]"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="All">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredFixes.length > 0 ? (
                    filteredFixes.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                        >
                            <div className="flex justify-between items-start gap-4">
                                <div className="space-y-3 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                                            // Dynamic color could be improved, but hardcoded for now is ok
                                            "bg-blue-50 text-blue-600"
                                            }`}>
                                            {item.category?.name}
                                        </span>
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Wrench size={12} />
                                            Guide #{item.id}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-gray-800 text-lg sm:text-xl leading-snug group-hover:text-blue-600 transition-colors">
                                        {item.title}
                                    </h3>

                                    <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100/50">
                                        {item.steps.split('\n').slice(0, 3).map((step, idx) => (
                                            <div key={idx} className="flex gap-3">
                                                <span className="flex-shrink-0 w-5 h-5 bg-white border border-gray-200 text-gray-500 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm mt-0.5">
                                                    {idx + 1}
                                                </span>
                                                <p className="text-gray-600 text-sm leading-relaxed">{step}</p>
                                            </div>
                                        ))}
                                        {item.steps.split('\n').length > 3 && (
                                            <p className="text-blue-500 text-xs font-medium pl-8 pt-1">
                                                + {item.steps.split('\n').length - 3} more steps
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => openEditModal(item)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                        title="Edit"
                                    >
                                        <Edit size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title="Delete"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Wrench size={32} />
                        </div>
                        <h3 className="text-gray-800 font-bold text-lg">No guides found</h3>
                        <p className="text-gray-500 text-sm mt-1">Try adjusting your search or add a new guide.</p>
                        <button
                            onClick={openCreateModal}
                            className="text-blue-600 font-medium text-sm mt-4 hover:underline"
                        >
                            Add New Guide
                        </button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-3xl z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {isEditMode ? "Edit Quick Fix" : "Create New Guide"}
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">Fill in the details below</p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <div className="p-6 overflow-y-auto">
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Guide Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                                        placeholder="e.g. Printer Paper Jam Solution"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                                    >
                                        <option value="">Select a Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Troubleshooting Steps
                                        <span className="text-gray-400 font-normal ml-1">(One step per line)</span>
                                    </label>
                                    <textarea
                                        name="steps"
                                        value={formData.steps}
                                        onChange={handleInputChange}
                                        required
                                        rows="6"
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 resize-none"
                                        placeholder="1. Turn off the device&#10;2. Wait for 30 seconds&#10;3. Turn it back on"
                                    />
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <Save size={20} />
                                        {isEditMode ? "Save Changes" : "Create Guide"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickFixManagement;
