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
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header/Nav */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate("/kb")}
                        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to Knowledge Base</span>
                    </button>

                    <div className="flex gap-2">
                        {/* Placeholder for Edit button specific to admins */}
                        {/* <button className="text-sm font-medium text-blue-600 hover:underline">Edit Article</button> */}
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8">
                <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Media Header */}
                    {article.videoUrl ? (
                        <div className="aspect-video bg-black">
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
                        <div className="h-64 md:h-80 w-full">
                            <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                        </div>
                    )}

                    <div className="p-6 md:p-10">
                        {/* Meta Tags */}
                        <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
                            <span className={`px-3 py-1 rounded-full font-medium ${article.category === 'Video' ? 'bg-red-50 text-red-600' :
                                    article.category === 'FAQ' ? 'bg-green-50 text-green-600' :
                                        'bg-blue-50 text-blue-600'
                                }`}>
                                {article.category}
                            </span>
                            <span className="flex items-center gap-1">
                                <Calendar size={16} />
                                {dayjs(article.createdAt).format("MMMM D, YYYY")}
                            </span>
                            <span className="flex items-center gap-1">
                                <Eye size={16} />
                                {article.viewCount} views
                            </span>
                            {/* <span className="flex items-center gap-1">
                                <User size={16} />
                                {article.updatedBy?.name || "Admin"}
                            </span> */}
                        </div>

                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                            {article.title}
                        </h1>

                        {/* Content */}
                        <div className="prose prose-blue max-w-none text-gray-600 mb-10 whitespace-pre-wrap">
                            {article.content}
                        </div>

                        {/* Feedback Section */}
                        <div className="border-t border-gray-100 pt-8 flex flex-col items-center justify-center text-center">
                            <h3 className="font-semibold text-gray-900 mb-2">Was this article helpful?</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                {article.helpful} people found this helpful
                            </p>
                            <button
                                onClick={handleVote}
                                disabled={voted}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${voted
                                        ? "bg-green-100 text-green-700 cursor-default"
                                        : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                                    }`}
                            >
                                <ThumbsUp size={20} className={voted ? "fill-current" : ""} />
                                {voted ? "Thanks for your feedback!" : "Yes, it helped"}
                            </button>
                        </div>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default ArticleDetail;
