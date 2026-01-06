import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ThumbsUp, Calendar, User, Eye, Share2 } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { readKB, voteKB } from "../../api/knowledgeBase";
import dayjs from "dayjs";

const ArticleDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [voted, setVoted] = useState(false);

    useEffect(() => {
        fetchArticle();
    }, [id, token]);

    const fetchArticle = async () => {
        try {
            setLoading(true);
            const res = await readKB(token, id);
            setArticle(res.data);
        } catch (err) {
            console.error("Failed to fetch article:", err);
            // navigate("/kb"); // Redirect if not found
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async () => {
        if (voted) return;
        try {
            await voteKB(token, id);
            setVoted(true);
            setArticle(prev => ({ ...prev, helpful: prev.helpful + 1 }));
        } catch (err) {
            console.error("Failed to vote:", err);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    if (!article) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 animate-in fade-in duration-500">
            {/* Header/Nav */}
            <div className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100 sticky top-0 z-30 transition-all">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate("/kb")}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors group"
                    >
                        <div className="p-2 rounded-full bg-gray-100 group-hover:bg-blue-50 transition-colors">
                            <ArrowLeft size={20} />
                        </div>
                        <span className="font-bold text-sm">Back to Knowledge Base</span>
                    </button>

                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-50" title="Share">
                        <Share2 size={20} />
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-10">
                <article className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 overflow-hidden border border-slate-100">
                    {/* Media Header */}
                    {article.videoUrl ? (
                        <div className="aspect-video bg-black relative">
                            <iframe
                                width="100%"
                                height="100%"
                                src={article.videoUrl.replace("watch?v=", "embed/")}
                                title={article.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    ) : article.imageUrl && (
                        <div className="h-72 md:h-96 w-full relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                            <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                            <div className="absolute bottom-6 left-6 md:left-10 z-20 text-white">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-white/20 mb-3
                                    ${article.category === 'Video' ? 'bg-red-500/80' :
                                        article.category === 'FAQ' ? 'bg-emerald-500/80' :
                                            'bg-blue-500/80'}`}>
                                    {article.category}
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="p-8 md:p-12">
                        {/* Title & Meta - If no image/video, show title here more prominently */}
                        {!article.imageUrl && !article.videoUrl && (
                            <div className="mb-6">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4
                                    ${article.category === 'Video' ? 'bg-red-50 text-red-600' :
                                        article.category === 'FAQ' ? 'bg-emerald-50 text-emerald-600' :
                                            'bg-blue-50 text-blue-600'}`}>
                                    {article.category}
                                </span>
                            </div>
                        )}

                        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
                            {article.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 mb-10 text-sm font-medium text-gray-500 border-b border-gray-100 pb-8">
                            <span className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-full">
                                    <Calendar size={16} />
                                </div>
                                {dayjs(article.createdAt).format("MMMM D, YYYY")}
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="p-1.5 bg-purple-50 text-purple-600 rounded-full">
                                    <Eye size={16} />
                                </div>
                                {article.viewCount} reads
                            </span>
                            {/* <span className="flex items-center gap-2">
                                <div className="p-1.5 bg-orange-50 text-orange-600 rounded-full">
                                    <User size={16} />
                                </div>
                                {article.updatedBy?.name || "Admin"}
                            </span> */}
                        </div>

                        {/* Content */}
                        <div className="prose prose-lg prose-slate max-w-none text-gray-600 mb-12 whitespace-pre-wrap leading-relaxed marker:text-blue-500">
                            {article.content}
                        </div>

                        {/* Feedback Section */}
                        <div className="bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-3xl p-8 border border-blue-100 flex flex-col items-center justify-center text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Was this article helpful?</h3>
                            <p className="text-gray-500 mb-6">
                                Your feedback helps us improve our support.
                            </p>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleVote}
                                    disabled={voted}
                                    className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg ${voted
                                        ? "bg-green-500 text-white shadow-green-200 cursor-default"
                                        : "bg-white text-gray-700 hover:text-blue-600 hover:shadow-xl hover:-translate-y-1 border border-gray-200"
                                        }`}
                                >
                                    <ThumbsUp size={22} className={voted ? "fill-current" : ""} />
                                    {voted ? "Thank you!" : "Yes, it helped"}
                                </button>
                            </div>

                            <p className="mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {article.helpful} found this helpful
                            </p>
                        </div>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default ArticleDetail;
