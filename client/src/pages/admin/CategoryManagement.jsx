import React, { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, X, Folder } from "lucide-react";
import { listCategories, createCategory, updateCategory, removeCategory } from "../../api/category";
import useAuthStore from "../../store/auth-store";
import { toast } from "react-toastify";

const CategoryManagement = () => {
    const { token } = useAuthStore();
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCatId, setCurrentCatId] = useState(null);
    const [formData, setFormData] = useState({
        name: ""
    });

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        const filtered = categories.filter(cat =>
            cat.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredCategories(filtered);
    }, [searchTerm, categories]);

    const loadCategories = async () => {
        try {
            const res = await listCategories(token);
            setCategories(res.data);
            setFilteredCategories(res.data);
        } catch (err) {
            console.log(err);
            toast.error("Failed to load categories");
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const openCreateModal = () => {
        setIsEditMode(false);
        setFormData({ name: "" });
        setIsModalOpen(true);
    };

    const openEditModal = (cat) => {
        setIsEditMode(true);
        setCurrentCatId(cat.id);
        setFormData({
            name: cat.name
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditMode) {
                await updateCategory(token, currentCatId, formData);
                toast.success("Category updated successfully");
            } else {
                await createCategory(token, formData);
                toast.success("Category created successfully");
            }
            setIsModalOpen(false);
            loadCategories();
        } catch (err) {
            console.log(err);
            toast.error(isEditMode ? "Failed to update category" : "Failed to create category");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            try {
                await removeCategory(token, id);
                toast.success("Category deleted successfully");
                loadCategories();
            } catch (err) {
                console.log(err);
                toast.error("Failed to delete category");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search category..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-transparent focus:bg-white"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredCategories.map((cat) => (
                    <div key={cat.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center relative group">

                        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4 text-2xl">
                            <Folder size={32} />
                        </div>

                        <h3 className="font-bold text-gray-800 text-lg mb-1">{cat.name}</h3>
                        <p className="text-gray-400 text-sm">ID: {cat.id}</p>

                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => openEditModal(cat)}
                                className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                                <Edit size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(cat.id)}
                                className="p-2 bg-gray-50 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {/* Add New Category Card */}
                <button
                    onClick={openCreateModal}
                    className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center h-60 hover:bg-gray-100 transition-colors text-gray-400 hover:text-blue-500 group"
                >
                    <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Plus size={28} />
                    </div>
                    <span className="font-semibold text-lg">Add New Category</span>
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl transform transition-all animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditMode ? "Edit Category" : "Add New Category"}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    placeholder="e.g. Hardware"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 mt-2"
                            >
                                {isEditMode ? "Update Category" : "Create Category"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryManagement;
