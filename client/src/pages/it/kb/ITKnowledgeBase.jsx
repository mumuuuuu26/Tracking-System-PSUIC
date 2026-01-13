import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Edit2, Trash2, BookOpen, Video, HelpCircle, Eye, ThumbsUp } from "lucide-react";
import useAuthStore from "../../../store/auth-store";
import { listKB, removeKB } from "../../../api/knowledgeBase";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import dayjs from "dayjs";

const ITKnowledgeBase = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadItems();
    }, [token, searchTerm]);

    const loadItems = async () => {
        try {
            setLoading(true);
            const res = await listKB(token, { search: searchTerm });
            setItems(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load items");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await removeKB(token, id);
                    toast.success("Deleted successfully");
                    loadItems();
                } catch (err) {
                    console.error(err);
                    toast.error("Failed to delete");
                }
            }
        });
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen className="text-blue-600" /> Knowledge Base Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage articles, FAQs, and video tutorials.</p>
                </div>
                <Link
                    to="/it/kb/create"
                    className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2"
                >
                    <Plus size={20} /> New Article
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                    <Search className="text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search articles..."
                        className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Article</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Stats</th>
                                <th className="px-6 py-4">Updated</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No content found.</td></tr>
                            ) : (
                                items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                                ) : (
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center
                                                        ${item.category === 'Video' ? 'bg-red-50 text-red-500' :
                                                            item.category === 'FAQ' ? 'bg-emerald-50 text-emerald-500' : 'bg-blue-50 text-blue-500'}`}>
                                                        {item.category === 'Video' ? <Video size={16} /> : item.category === 'FAQ' ? <HelpCircle size={16} /> : <BookOpen size={16} />}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-gray-800 line-clamp-1 w-64">{item.title}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                                                ${item.category === 'Video' ? 'bg-red-100 text-red-700' :
                                                    item.category === 'FAQ' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                                <span className="flex items-center gap-1" title="Views"><Eye size={14} /> {item.viewCount}</span>
                                                <span className="flex items-center gap-1" title="Helpus"><ThumbsUp size={14} /> {item.helpful || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs">
                                                <p className="text-gray-900 font-bold">{dayjs(item.updatedAt).format('D MMM YYYY')}</p>
                                                <p className="text-gray-400">by {item.updatedBy?.role === 'it_support' ? 'IT Support' : (item.updatedBy?.name || 'Admin')}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/it/kb/edit/${item.id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ITKnowledgeBase;
