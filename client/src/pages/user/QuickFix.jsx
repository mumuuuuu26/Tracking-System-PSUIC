import React, { useState, useEffect, useCallback } from "react";
import { listQuickFix, readQuickFix } from "../../api/quickFix";
import { listCategories } from "../../api/category";
import { Search, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { useRef } from "react";

import UserWrapper from "../../components/user/UserWrapper";
import UserPageHeader from "../../components/user/UserPageHeader";
import { theme } from "../../styles/userTheme";



// ─── Step formatter ──────────────────────────────────────────────────────────
const DescriptionFormatter = ({ text }) => {
    if (!text) return null;
    const lines = text.split('\n').filter(line => line.trim() !== "");

    return (
        <div className="space-y-4">
            {lines.map((line, index) => {
                const hasArrow = line.includes("→") || line.includes("->");
                const stepNumber = index + 1;

                if (hasArrow) {
                    const separator = line.includes("→") ? "→" : "->";
                    const [topic, action] = line.split(separator).map(s => s.trim());
                    return (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 text-sm">
                            <div className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-700/40 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold border border-blue-200 dark:border-blue-600/40">
                                {stepNumber}
                            </div>
                            <div className="flex-1">
                                <span className="font-bold text-gray-900 dark:text-white block sm:inline mb-1 sm:mb-0">{topic}</span>
                                <span className="hidden sm:inline mx-2 text-gray-300 dark:text-blue-500/50">|</span>
                                <span className="text-gray-600 dark:text-blue-300/70 leading-relaxed block sm:inline">{action}</span>
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={index} className="flex items-start gap-3 text-sm">
                        <div className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-700/40 text-blue-600 dark:text-blue-300 flex items-center justify-center text-xs font-bold border border-blue-200 dark:border-blue-600/40">
                            {stepNumber}
                        </div>
                        <span className="text-gray-600 dark:text-blue-300/70 leading-relaxed pt-0.5">{line}</span>
                    </div>
                );
            })}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const QuickFix = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [openId, setOpenId] = useState(null);
    const filterRef = useRef(null);

    // Close filter dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (filterRef.current && !filterRef.current.contains(e.target)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const loadData = useCallback(async () => {
        try {
            const res = await listQuickFix();
            setData(res.data);
            const catRes = await listCategories();
            setCategories(catRes.data);
        } catch {
            // Silent fail
        }
    }, []);

    const filterItems = useCallback(() => {
        let filtered = data;
        if (search) {
            const text = search.toLowerCase();
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(text) ||
                item.description.toLowerCase().includes(text)
            );
        }
        if (selectedCategory !== "All") {
            filtered = filtered.filter(item => item.category === selectedCategory);
        }
        setFilteredData(filtered);
    }, [search, selectedCategory, data]);

    useEffect(() => { loadData(); }, [loadData]);
    useEffect(() => { filterItems(); }, [filterItems]);

    const toggleAccordion = async (id) => {
        if (openId === id) {
            setOpenId(null);
        } else {
            setOpenId(id);
            try { await readQuickFix(id); } catch { /* silent */ }
        }
    };

    return (
        <UserWrapper>
            <div className={`pb-20 min-h-screen ${theme.pageBg}`}>
                <UserPageHeader title="Knowledge" />

                <div className="w-full md:max-w-2xl mx-auto mt-6 px-4 md:px-6 relative z-20 space-y-4">

                    {/* Search & Filter Row */}
                    <div className="flex gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1 shadow-sm rounded-xl">
                            <Search className="absolute left-3.5 top-3.5 text-gray-400 dark:text-blue-400/50" size={17} />
                            <input
                                type="text"
                                placeholder="Search for problems..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full py-3 pl-10 pr-4 rounded-xl bg-white dark:bg-[#1a2f4e] border border-gray-300 dark:border-blue-700/50 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-blue-400/40 focus:outline-none transition-colors"
                            />
                        </div>

                        {/* Filter Button */}
                        <div className="relative shadow-sm rounded-xl" ref={filterRef}>
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="h-full w-32 sm:w-40 px-4 rounded-xl bg-white dark:bg-[#1a2f4e] border border-gray-300 dark:border-blue-700/50 text-gray-600 dark:text-blue-200 text-sm flex items-center justify-between gap-2 transition-colors"
                            >
                                <span className="truncate">{selectedCategory === "All" ? "Filter" : selectedCategory}</span>
                                <ChevronDown size={16} className={`text-gray-400 dark:text-blue-400/60 shrink-0 transition-transform duration-200 ${isFilterOpen ? "rotate-180" : ""}`} />
                            </button>

                            {isFilterOpen && (
                                <div className="absolute top-full right-0 mt-2 w-52 bg-white dark:bg-[#152540] border border-gray-200 dark:border-blue-700/50 rounded-2xl shadow-xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] z-30 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => { setSelectedCategory("All"); setIsFilterOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all font-medium ${selectedCategory === "All" ? "bg-blue-50 dark:bg-[#193C6C] text-blue-700 dark:text-white font-bold" : "text-gray-700 dark:text-blue-200 hover:bg-gray-50 dark:hover:bg-blue-800/40"}`}
                                        >
                                            All Categories
                                        </button>
                                        {categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => { setSelectedCategory(cat.name); setIsFilterOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all font-medium ${selectedCategory === cat.name ? "bg-blue-50 dark:bg-[#193C6C] text-blue-700 dark:text-white font-bold" : "text-gray-700 dark:text-blue-200 hover:bg-gray-50 dark:hover:bg-blue-800/40"}`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Result count */}
                    {filteredData.length > 0 && (
                        <p className="text-gray-500 dark:text-blue-400/50 text-xs font-medium">
                            {filteredData.length} guide{filteredData.length !== 1 ? "s" : ""} found
                        </p>
                    )}

                    {/* Content */}
                    {filteredData.length === 0 ? (
                        <div className="bg-white dark:bg-[#1a2f4e] p-10 rounded-2xl border border-gray-200 dark:border-blue-800/30 text-center shadow-sm dark:shadow-none">
                            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/50 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="text-blue-500 dark:text-blue-600" size={24} />
                            </div>
                            <p className="text-gray-500 dark:text-blue-300/60 text-sm">No guides found {search ? `for "${search}"` : ""}</p>
                        </div>
                    ) : (
                        filteredData.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white dark:bg-[#1a2f4e] rounded-2xl border border-gray-200 dark:border-blue-800/30 overflow-hidden transition-all duration-300 shadow-sm dark:shadow-none"
                            >
                                {/* Accordion Header */}
                                <button
                                    onClick={() => toggleAccordion(item.id)}
                                    className="w-full text-left p-5 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-blue-800/20 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700/40 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold flex-shrink-0 text-sm cursor-pointer">
                                            ?
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {item.category && (
                                                <span className="bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400/80 border border-blue-200 dark:border-blue-800/40 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide inline-block mb-1.5 cursor-pointer">
                                                    {item.category}
                                                </span>
                                            )}
                                            <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base break-words pr-4 leading-snug">{item.title}</h3>
                                            <p className="text-xs text-gray-400 dark:text-blue-400/40 mt-1">{item.views} views</p>
                                        </div>
                                    </div>
                                    {openId === item.id ? (
                                        <ChevronUp className="text-blue-500 dark:text-blue-400 flex-shrink-0 ml-2" size={18} />
                                    ) : (
                                        <ChevronDown className="text-gray-400 dark:text-blue-400/50 flex-shrink-0 ml-2" size={18} />
                                    )}
                                </button>

                                {/* Accordion Body */}
                                <div className={`transition-all duration-300 ease-in-out ${openId === item.id ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}>
                                    <div className="px-5 pb-5 border-t border-gray-100 dark:border-blue-800/30">
                                        <div className="mt-4 p-4 bg-gray-50 dark:bg-[#0d1b2a] rounded-xl border border-gray-200 dark:border-blue-800/20">
                                            <DescriptionFormatter text={item.description} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </UserWrapper>
    );
};

export default QuickFix;
