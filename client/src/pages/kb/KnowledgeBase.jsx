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
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Hero Search Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-bold mb-4">How can we help you?</h1>
                    <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
                        Search our knowledge base for answers to common questions, troubleshooting guides, and video tutorials.
                    </p>

                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search for articles, errors, or topics..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-800 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 -mt-8">
                {/* Category Tabs */}
                <div className="bg-white rounded-xl shadow-sm p-2 flex justify-center gap-2 mb-8 overflow-x-auto">
                    {categories.map((cat) => (
                        <button
                            key={cat.name}
                            onClick={() => setCategory(cat.name)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${category === cat.name
                                    ? "bg-blue-50 text-blue-600 shadow-sm"
                                    : "text-gray-600 hover:bg-gray-50"
                                }`}
                        >
                            {cat.icon}
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No results found</h3>
                        <p className="text-gray-500">Try adjusting your search or category filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((item) => (
                            <Link
                                to={`/kb/${item.id}`}
                                key={item.id}
                                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col"
                            >
                                {/* Thumbnail for Videos or Blogs if available */}
                                {item.imageUrl && (
                                    <div className="h-40 bg-gray-200 w-full overflow-hidden">
                                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                    </div>
                                )}

                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.category === 'Video' ? 'bg-red-50 text-red-600' :
                                                item.category === 'FAQ' ? 'bg-green-50 text-green-600' :
                                                    'bg-blue-50 text-blue-600'
                                            }`}>
                                            {item.category}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {dayjs(item.createdAt).format("MMM D, YYYY")}
                                        </span>
                                    </div>

                                    <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {item.title}
                                    </h3>

                                    <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-1">
                                        {item.content.replace(/<[^>]*>?/gm, '')}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-gray-400 text-sm">
                                        <span className="flex items-center gap-1">
                                            <Eye size={16} />
                                            {item.viewCount} views
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <ThumbsUp size={16} />
                                            {item.helpful}
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
