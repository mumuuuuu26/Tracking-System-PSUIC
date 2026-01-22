import React, { useState, useEffect, useCallback } from "react";
import { listQuickFix, readQuickFix } from "../../api/quickFix";
import { Search, ChevronDown, ChevronUp, BookOpen, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CATEGORIES = ["ACCOUNT & LOGIN", "COMPUTER", "PROJECTOR", "SOFTWARE", "OTHER"];

const QuickFix = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [openId, setOpenId] = useState(null);
    const navigate = useNavigate();

    const loadData = useCallback(async () => {
        try {
            const res = await listQuickFix();
            setData(res.data);
            // Initial filter will happen via useEffect
        } catch (err) {
            console.log(err);
        }
    }, []);

    const filterItems = useCallback(() => {
        let filtered = data;

        // Filter by Search
        if (search) {
            const text = search.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.title.toLowerCase().includes(text) ||
                    item.description.toLowerCase().includes(text)
            );
        }

        // Filter by Category
        if (selectedCategory !== "All") {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }

        setFilteredData(filtered);
    }, [search, selectedCategory, data]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        filterItems();
    }, [filterItems]);

    const toggleAccordion = async (id) => {
        if (openId === id) {
            setOpenId(null);
        } else {
            setOpenId(id);
            try {
                await readQuickFix(id);
            } catch (err) {
                console.log(err);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            {/* Header */}
            <div className="bg-[#193C6C] pt-8 pb-16 px-6 rounded-b-[2.5rem] shadow-lg relative">
                <div className="absolute inset-0 rounded-b-[2.5rem] overflow-hidden pointer-events-none">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                </div>

                <div className="max-w-3xl mx-auto relative z-30">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-white/80 hover:text-white mb-4 flex items-center gap-2 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Back
                    </button>

                    <h1 className="text-3xl font-bold text-white mb-2">Quick Fix Guide</h1>
                    <p className="text-blue-200">Common solutions for frequent problems.</p>

                    <div className="mt-6 flex gap-3 relative">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder="Search for problems..."
                                className="w-full py-4 pl-12 pr-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 backdrop-blur-sm focus:outline-none focus:bg-white/20 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search className="absolute left-4 top-4 text-blue-200" />
                        </div>

                        {/* Filter Button */}
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`h-full px-5 rounded-xl border border-white/20 backdrop-blur-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap ${selectedCategory !== "All"
                                    ? "bg-white text-[#193C6C] font-bold"
                                    : "bg-white/10 text-white hover:bg-white/20"
                                    }`}
                            >
                                <span>{selectedCategory === "All" ? "Filter" : selectedCategory}</span>
                                <ChevronDown size={18} />
                            </button>

                            {/* Dropdown Menu */}
                            {isFilterOpen && (
                                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/5">
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => { setSelectedCategory("All"); setIsFilterOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${selectedCategory === "All" ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                                        >
                                            All Categories
                                        </button>
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => { setSelectedCategory(cat); setIsFilterOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${selectedCategory === cat ? "bg-blue-50 text-blue-600 font-bold" : "text-gray-600 hover:bg-gray-50"}`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 -mt-8 relative z-20 space-y-4">
                {filteredData.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                        <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No guides found matching "{search}"</p>
                    </div>
                ) : (
                    filteredData.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md"
                        >
                            <button
                                onClick={() => toggleAccordion(item.id)}
                                className="w-full text-left p-5 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                                        ?
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {item.category && (
                                                <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                                                    {item.category}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="font-bold text-gray-800 text-base md:text-lg break-words pr-4">{item.title}</h3>
                                        <p className="text-xs text-gray-400 mt-1">{item.views} views</p>
                                    </div>
                                </div>
                                {openId === item.id ? (
                                    <ChevronUp className="text-blue-500 flex-shrink-0 ml-2" />
                                ) : (
                                    <ChevronDown className="text-gray-400 flex-shrink-0 ml-2" />
                                )}
                            </button>

                            <div
                                className={`transition-all duration-300 ease-in-out ${openId === item.id ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                                    } overflow-hidden`}
                            >
                                <div className="p-5 pt-0 border-t border-gray-100/50">
                                    <div className="p-4 bg-gray-50 rounded-xl text-gray-700 leading-relaxed whitespace-pre-wrap">
                                        {item.description}
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default QuickFix;
