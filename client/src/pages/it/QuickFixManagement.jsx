
import React, { useState, useEffect } from "react";
import {
    listQuickFix,
    createQuickFix,
    updateQuickFix,
    removeQuickFix,
} from "../../api/quickFix";
import useAuthStore from "../../store/auth-store";
import { Trash2, Edit, Plus, X, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["ACCOUNT & LOGIN", "COMPUTER", "PROJECTOR", "SOFTWARE", "OTHER"];

const QuickFixManagement = () => {
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editId, setEditId] = useState(null);

    // Filter State
    const [selectedCategory, setSelectedCategory] = useState("All Categories");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isFormCategoryOpen, setIsFormCategoryOpen] = useState(false);


    const [form, setForm] = useState({
        title: "",
        description: "",
        category: "",
    });

    useEffect(() => {
        loadData();
    }, []);

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
        } catch (err) {
            console.log(err);
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
                await updateQuickFix(token, editId, form);
                toast.success("Updated successfully");
            } else {
                await createQuickFix(token, form);
                toast.success("Created successfully");
            }
            setIsModalOpen(false);

            // Reset Form
            setForm({ title: "", description: "", image: "", category: "" });
            setEditId(null);
            loadData();
        } catch (err) {
            console.log(err);
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
                    await removeQuickFix(token, id);
                    toast.success("Deleted successfully");
                    loadData();
                } catch (err) {
                    console.log(err);
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

    // Helper to format description as numbered list if simple text
    const renderSteps = (desc) => {
        // Split by newline and filter empty
        const steps = desc.split('\n').filter(s => s.trim() !== "");
        return (
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 mt-2">
                {steps.map((step, idx) => (
                    <div key={idx} className="flex gap-2 text-sm text-gray-700">
                        <span className="font-bold text-gray-400 bg-white w-5 h-5 flex items-center justify-center rounded-full text-[10px] border border-gray-100 shadow-sm shrink-0">
                            {idx + 1}
                        </span>
                        <span>{step}</span>
                    </div>
                ))}
            </div>
        )
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">

            {/* Header */}
            <div className="bg-[#1B365D] text-white p-4 pt-6 pb-6 sticky top-0 z-30 shadow-md">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-white/10">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Quick Fix Management</h1>
                </div>
            </div>

            <div className="p-4 lg:p-8 w-full">

                {/* Controls */}
                <div className="flex justify-between items-center mb-6 gap-3">
                    {/* Filter Dropdown */}
                    <div className="relative flex-1">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 flex justify-between items-center text-gray-700 font-medium shadow-sm active:bg-gray-50"
                        >
                            <span className="truncate">{selectedCategory}</span>
                            <ChevronDown size={18} className="text-gray-400" />
                        </button>

                        {isFilterOpen && (
                            <div className="absolute top-full left-0 mt-2 w-full min-w-[220px] bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                                <div className="p-2 flex flex-col gap-1 max-h-[280px] overflow-y-auto custom-scrollbar">
                                    <button
                                        onClick={() => { setSelectedCategory("All Categories"); setIsFilterOpen(false); }}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between group ${selectedCategory === "All Categories" ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                                    >
                                        <span>All Categories</span>
                                    </button>
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => { setSelectedCategory(cat); setIsFilterOpen(false); }}
                                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between group ${selectedCategory === cat ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                                        >
                                            <span>{cat}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={openNew}
                        className="bg-[#1B365D] hover:bg-[#152a48] text-white px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap font-medium"
                    >
                        <Plus size={18} />
                        Add New Guide
                    </button>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredData.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
                            <div className="flex justify-between items-start mb-1">
                                {item.category && (
                                    <span className="bg-blue-100 text-[#1B365D] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                                        {item.category}
                                    </span>
                                )}
                                <div className="flex gap-3">
                                    <button onClick={() => handleEdit(item)} className="text-gray-400 hover:text-blue-600">
                                        <Edit size={20} />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600">
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>

                            {renderSteps(item.description)}
                        </div>
                    ))}

                    {filteredData.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            No guides found in this category.
                        </div>
                    )}
                </div>

            </div>

            {/* Modal - Bottom Sheet feel on mobile, Modal on desktop */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editId ? "Edit Guide" : "Create New Guide"}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 bg-white p-1 rounded-full shadow-sm border border-gray-200"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">

                            {/* Title */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Guide Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    value={form.title}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#1B365D] focus:border-transparent outline-none transition-all placeholder-gray-400"
                                    placeholder="e.g. Printer paper jam"
                                    required
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Category</label>
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsFormCategoryOpen(!isFormCategoryOpen)}
                                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 flex justify-between items-center text-left focus:ring-2 focus:ring-[#1B365D] transition-all"
                                    >
                                        <span className={form.category ? "text-gray-900" : "text-gray-400"}>
                                            {form.category || "Select a Category"}
                                        </span>
                                        <ChevronDown size={20} className="text-gray-400" />
                                    </button>

                                    {isFormCategoryOpen && (
                                        <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                            <div className="p-2 flex flex-col gap-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                                                {CATEGORIES.map(cat => (
                                                    <button
                                                        key={cat}
                                                        type="button"
                                                        onClick={() => {
                                                            setForm({ ...form, category: cat });
                                                            setIsFormCategoryOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all flex items-center justify-between group ${form.category === cat ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                                                    >
                                                        <span>{cat}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description / Steps */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">Troubleshooting Steps</label>
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-3 h-32 focus:ring-2 focus:ring-[#1B365D] focus:border-transparent outline-none transition-all resize-none placeholder-gray-400"
                                    placeholder="1. Turn off device&#10;2. Wait 30 seconds..."
                                    required
                                ></textarea>
                                <p className="text-xs text-gray-400 mt-1 text-right">Separate steps with new lines</p>
                            </div>

                            {/* Image URL (Optional) */}


                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full py-3.5 rounded-xl bg-[#1B365D] hover:bg-[#152a48] text-white font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {editId ? "Update Guide" : "Create Guide"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuickFixManagement;
