
import React, { useState, useEffect } from "react";
import {
    listQuickFix,
    createQuickFix,
    updateQuickFix,
    removeQuickFix,
} from "../../api/quickFix";
import { listCategories } from "../../api/category";
import { Trash2, Edit, Plus, X, ChevronDown, ChevronUp, ArrowLeft, Settings } from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import AdminWrapper from "../../components/admin/AdminWrapper";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminSelect from "../../components/admin/AdminSelect";

const QuickFixManagement = () => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    // Category Management State
    const [categories, setCategories] = useState([]);

    // Filter State
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [isFormCategoryOpen, setIsFormCategoryOpen] = useState(false);


    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "",
    });

    useEffect(() => {
        loadData();
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const res = await listCategories();
            setCategories(res.data);
        } catch {
            // Silent fail
        }
    };

    useEffect(() => {
        if (selectedCategory === "All Categories") {
            setFilteredData(data);
        } else {
            setFilteredData(data.filter(item => item.category === selectedCategory));
        }
    }, [selectedCategory, data]);

    const loadData = async () => {
        try {
            const res = await listQuickFix();
            setData(res.data);
        } catch {
            // Silent fail
        }
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await updateQuickFix(editId, form);
                toast.success("Updated successfully");
            } else {
                await createQuickFix(form);
                toast.success("Created successfully");
            }
            setIsModalOpen(false);

            // Reset Form
            setForm({ title: "", description: "", image: "", category: "" });
            setEditId(null);
            loadData();
        } catch {
            toast.error("Action failed");
        }
    };

    const handleEdit = (item) => {
        setEditId(item.id);
        setForm({
            title: item.title,
            description: item.description,
            image: item.image || "",
            category: item.category || "",
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#1e3a8a",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await removeQuickFix(id);
                    toast.success("Deleted successfully");
                    loadData();
                } catch {
                    toast.error("Delete Failed");
                }
            }
        });
    };

    const openNew = () => {
        setEditId(null);
        setForm({ title: "", description: "", image: "", category: "" });
        setIsModalOpen(true);
    }



    return (
        <AdminWrapper>
            <div className="flex flex-col h-full px-6 pt-6 pb-24 md:pb-6 space-y-6 overflow-y-auto">

                {/* Header Card */}
                <AdminHeader
                    title="Knowledge Base"
                    subtitle="Manage quick fix guides and documentation"
                    onBack={() => navigate(-1)}
                />

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-end items-center mb-6">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        {/* Add Button */}
                        <button
                            onClick={openNew}
                            className="w-full md:w-48 h-12 bg-[#1e2e4a] hover:bg-[#15233b] text-white rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg font-bold text-sm"
                        >
                            <Plus size={18} />
                            Add New Guide
                        </button>

                        {/* Filter Dropdown */}
                        <div className="w-full md:w-48">
                            <AdminSelect
                                value={selectedCategory}
                                onChange={setSelectedCategory}
                                options={["All Categories", ...categories.map(c => c.name)]}
                                placeholder="All Categories"
                                className="w-full"
                                buttonClassName="!h-12 !py-0 !rounded-xl !text-sm font-bold flex items-center"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats / Count */}
                <div className="mb-6">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Total Guides <span className="text-gray-300 ml-1">({filteredData.length})</span>
                    </h2>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredData.map(item => (
                        <div key={item.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group relative">
                            <div className="flex justify-between items-start mb-4">
                                {item.category && (
                                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide">
                                        {item.category}
                                    </span>
                                )}
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-[#1e2e4a] text-lg mb-3 line-clamp-2 min-h-[56px]">{item.title}</h3>

                            <div className="bg-gray-50 rounded-2xl p-4 min-h-[100px] mb-2">
                                <div className="space-y-2">
                                    {item.description.split('\n').filter(s => s.trim() !== "").slice(0, 3).map((step, idx) => (
                                        <div key={idx} className="flex gap-2 text-xs text-gray-600 leading-relaxed">
                                            <span className="font-bold text-gray-400 bg-white w-4 h-4 flex items-center justify-center rounded-full text-[8px] border border-gray-100 shadow-sm shrink-0">
                                                {idx + 1}
                                            </span>
                                            <span className="line-clamp-1">{step}</span>
                                        </div>
                                    ))}
                                    {item.description.split('\n').filter(s => s.trim() !== "").length > 3 && (
                                        <p className="text-[10px] text-gray-400 pl-6 italic">
                                            + {item.description.split('\n').filter(s => s.trim() !== "").length - 3} more steps
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredData.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="12" y1="18" x2="12" y2="12"></line>
                                <line x1="9" y1="15" x2="15" y2="15"></line>
                            </svg>
                        </div>
                        <h3 className="text-gray-900 font-bold text-lg mb-1">No guides found</h3>
                        <p className="text-gray-500 text-sm">
                            No guides found in this category.
                        </p>
                    </div>
                )}


                {/* Modal - Bottom Sheet feel on mobile, Modal on desktop */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2e4a]/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-xl font-bold text-[#1e2e4a]">
                                    {editId ? "Edit Guide" : "Create New Guide"}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">

                                {/* Title */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Guide Title</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={form.title}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a] outline-none transition-all placeholder-gray-400 font-medium text-gray-800"
                                        placeholder="e.g. Printer paper jam"
                                        required
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setIsFormCategoryOpen(!isFormCategoryOpen)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex justify-between items-center text-left focus:bg-white focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a] transition-all"
                                        >
                                            <span className={form.category ? "text-gray-800 font-medium" : "text-gray-400"}>
                                                {form.category || "Select a Category"}
                                            </span>
                                            <ChevronDown size={20} className="text-gray-400" />
                                        </button>

                                        {isFormCategoryOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                <div className="p-2 flex flex-col gap-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                                                    {categories.map(cat => (
                                                        <button
                                                            key={cat.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setForm({ ...form, category: cat.name });
                                                                setIsFormCategoryOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between group ${form.category === cat.name ? "bg-gray-100 text-[#1e2e4a] font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                                                        >
                                                            <span>{cat.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Description / Steps */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Troubleshooting Steps</label>
                                    <textarea
                                        name="description"
                                        value={form.description}
                                        onChange={handleChange}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 h-40 focus:bg-white focus:ring-2 focus:ring-[#1e2e4a]/20 focus:border-[#1e2e4a] outline-none transition-all resize-none placeholder-gray-400 font-medium text-gray-800 leading-relaxed"
                                        placeholder="1. Turn off device&#10;2. Wait 30 seconds..."
                                        required
                                    ></textarea>
                                    <p className="text-[10px] text-gray-400 mt-2 text-right">Separate steps with new lines</p>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        className="w-full py-4 rounded-xl bg-[#1e2e4a] hover:bg-[#15233b] text-white font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 transform active:scale-[0.98]"
                                    >
                                        {editId ? "Update Guide" : "Create Guide"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminWrapper >
    );
};

export default QuickFixManagement;
