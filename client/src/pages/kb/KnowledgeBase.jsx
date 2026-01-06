import React, { useState, useEffect } from "react";
import { Search, BookOpen, Video, HelpCircle, ThumbsUp, Eye } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { listKB } from "../../api/knowledgeBase";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";

const KnowledgeBase = () => {
    const { token } = useAuthStore();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [category, setCategory] = useState("All");
    const navigate = useNavigate();

    useEffect(() => {
        fetchItems();
    }, [token, category, searchTerm]);

    const fetchItems = async () => {
        try {
            setLoading(true);
            // Debounce could be added here for search
            const res = await listKB(token, { category, search: searchTerm });
            setItems(res.data);
        } catch (err) {
            console.error("Failed to fetch KB:", err);
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { name: "All", icon: <BookOpen size={18} /> },
        { name: "Article", icon: <BookOpen size={18} /> },
        { name: "FAQ", icon: <HelpCircle size={18} /> },
        { name: "Video", icon: <Video size={18} /> },
    ];

    return (
        <div className="min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-500">
            {/* Hero Search Section */}
            <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white pt-20 pb-24 px-4 overflow-hidden rounded-b-[3rem] shadow-xl shadow-blue-900/20">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-white/20">
                        Help Center
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">How can we help?</h1>
                    <p className="text-blue-100 mb-10 max-w-2xl mx-auto text-lg leading-relaxed">
                        Find answers, troubleshooting guides, and tutorials to get the most out of our services.
                    </p>

                    <div className="relative max-w-2xl mx-auto group">
                        <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl group-hover:bg-white/40 transition-all duration-500"></div>
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" size={24} />
                        <input
                            type="text"
                            placeholder="Describe your issue or search keywords..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="relative w-full pl-16 pr-6 py-5 rounded-2xl text-gray-800 shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-400/30 font-medium text-lg placeholder:text-gray-400 bg-white/95 backdrop-blur-xl border border-white/50 transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
                {/* Category Tabs */}
                <div className="flex justify-center mb-10 overflow-x-auto py-2">
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg p-2 flex gap-2 border border-white/50">
                        {categories.map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => setCategory(cat.name)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${category === cat.name
                                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 transform scale-105"
                                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                    }`}
                            >
                                {cat.icon}
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="h-64 bg-white rounded-3xl animate-pulse shadow-sm"></div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-lg mx-auto">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
                        <p className="text-gray-500 max-w-xs mx-auto">We couldn't find any articles matching your search. Try different keywords.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                        {items.map((item) => (
                            <Link
                                to={`/kb/${item.id}`}
                                key={item.id}
                                className="group bg-white rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 flex flex-col overflow-hidden border border-gray-100"
                            >
                                {/* Thumbnail */}
                                {item.imageUrl ? (
                                    <div className="h-48 bg-gray-100 overflow-hidden relative">
                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors z-10" />
                                        <img
                                            src={item.imageUrl}
                                            alt={item.title}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                        />
                                        <div className="absolute top-4 left-4 z-20">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm backdrop-blur-md border border-white/20
                                                ${item.category === 'Video' ? 'bg-red-500/90 text-white' :
                                                    item.category === 'FAQ' ? 'bg-emerald-500/90 text-white' :
                                                        'bg-blue-500/90 text-white'}`}>
                                                {item.category === 'Video' ? <Video size={10} /> : item.category === 'FAQ' ? <HelpCircle size={10} /> : <BookOpen size={10} />}
                                                {item.category}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={`h-48 flex items-center justify-center relative overflow-hidden
                                        ${item.category === 'Video' ? 'bg-red-50' : item.category === 'FAQ' ? 'bg-emerald-50' : 'bg-blue-50'}
                                    `}>
                                        <div className={`absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent`} />
                                        {item.category === 'Video' ?
                                            <Video className="w-16 h-16 text-red-300 transform -rotate-12 group-hover:scale-110 transition-transform duration-500" /> :
                                            item.category === 'FAQ' ?
                                                <HelpCircle className="w-16 h-16 text-emerald-300 transform rotate-12 group-hover:scale-110 transition-transform duration-500" /> :
                                                <BookOpen className="w-16 h-16 text-blue-300 group-hover:scale-110 transition-transform duration-500" />
                                        }
                                        <div className="absolute top-4 left-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/80 backdrop-blur-sm shadow-sm
                                                ${item.category === 'Video' ? 'text-red-600' : item.category === 'FAQ' ? 'text-emerald-600' : 'text-blue-600'}`}>
                                                {item.category}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="p-6 flex-1 flex flex-col relative">
                                    <h3 className="font-bold text-gray-800 text-xl mb-3 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                                        {item.title}
                                    </h3>

                                    <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed">
                                        {item.content.replace(/<[^>]*>?/gm, '')}
                                    </p>

                                    <div className="mt-auto pt-5 border-t border-gray-50 flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                        <span className="flex items-center gap-1.5">
                                            <Eye size={14} /> {item.viewCount}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-blue-400">
                                            Read More
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeBase;
