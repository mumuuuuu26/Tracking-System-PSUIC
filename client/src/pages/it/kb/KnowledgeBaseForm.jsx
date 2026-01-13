import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, HelpCircle, Video, BookOpen, Tag, Image, Link as LinkIcon } from "lucide-react";
import useAuthStore from "../../../store/auth-store";
import { createKB, readKB, updateKB } from "../../../api/knowledgeBase";
import { toast } from "react-toastify";

const KnowledgeBaseForm = () => {
    const { token } = useAuthStore();
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        category: "Article",
        content: "",
        tags: "",
        imageUrl: "",
        videoUrl: ""
    });

    useEffect(() => {
        if (isEdit) {
            loadArticle();
        }
    }, [id, token]);

    const loadArticle = async () => {
        try {
            setLoading(true);
            const res = await readKB(token, id);
            setFormData({
                title: res.data.title,
                category: res.data.category,
                content: res.data.content,
                tags: res.data.tags || "",
                imageUrl: res.data.imageUrl || "",
                videoUrl: res.data.videoUrl || ""
            });
        } catch (err) {
            console.error(err);
            toast.error("Failed to load article");
            navigate("/it/kb");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (isEdit) {
                await updateKB(token, id, formData);
                toast.success("Article updated successfully");
            } else {
                await createKB(token, formData);
                toast.success("Article created successfully");
            }
            navigate("/it/kb");
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Failed to save article");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <button
                onClick={() => navigate("/it/kb")}
                className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium mb-6 transition-colors group"
            >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Back to List
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isEdit ? "Edit Article" : "Create New Article"}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Fill in the details below to {isEdit ? "update" : "publish"} content to the knowledge base.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Article Title</label>
                        <input
                            type="text"
                            name="title"
                            required
                            placeholder="e.g., How to reset password"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Category & Tags Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                            <div className="relative">
                                <select
                                    name="category"
                                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    value={formData.category}
                                    onChange={handleChange}
                                >
                                    <option value="Article">Article (General)</option>
                                    <option value="FAQ">FAQ (Frequently Asked)</option>
                                    <option value="Video">Video Tutorial</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    {formData.category === 'Video' ? <Video size={18} /> :
                                        formData.category === 'FAQ' ? <HelpCircle size={18} /> :
                                            <BookOpen size={18} />}
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tags</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="tags"
                                    placeholder="e.g., wifi, urgent, setup (comma separated)"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    value={formData.tags}
                                    onChange={handleChange}
                                />
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Media URLs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Image URL (Optional)</label>
                            <div className="relative">
                                <input
                                    type="url"
                                    name="imageUrl"
                                    placeholder="https://example.com/image.jpg"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                />
                                <Image className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Video URL (Optional)</label>
                            <div className="relative">
                                <input
                                    type="url"
                                    name="videoUrl"
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                    value={formData.videoUrl}
                                    onChange={handleChange}
                                />
                                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Content / Answer</label>
                        <textarea
                            name="content"
                            required
                            rows={10}
                            placeholder="Write your article content here..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium resize-y"
                            value={formData.content}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <Save size={20} />
                            {loading ? "Saving..." : (isEdit ? "Update Article" : "Publish Article")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default KnowledgeBaseForm;
