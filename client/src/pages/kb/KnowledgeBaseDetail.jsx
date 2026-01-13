import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Eye, ThumbsUp, Tag, Share2, Video, BookOpen, HelpCircle, User } from "lucide-react";
import useAuthStore from "../../store/auth-store";
import { readKB, voteKB } from "../../api/knowledgeBase";
import dayjs from "dayjs";
import { toast } from "react-toastify";

const KnowledgeBaseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useAuthStore();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [voting, setVoting] = useState(false);


    const lastFetchedId = React.useRef(null);

    useEffect(() => {
        if (lastFetchedId.current === id) return;
        lastFetchedId.current = id;
        loadArticle();
    }, [id, token]);

    const loadArticle = async () => {
        try {
            setLoading(true);
            const res = await readKB(token, id);
            setArticle(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load article");
            navigate("/kb");
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async () => {
        if (voting) return;
        try {
            setVoting(true);
            await voteKB(token, id);
            setArticle(prev => ({ ...prev, helpful: (prev.helpful || 0) + 1 }));
            toast.success("Thank you for your feedback!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to submit vote");
        } finally {
            setVoting(false);
        }
    };



    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
    );

    if (!article) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 pt-24 px-4">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate("/kb")}
                    className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-medium mb-6 transition-colors group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Knowledge Base
                </button>

                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-blue-900/5 overflow-hidden border border-gray-100 relative">
                    {/* Header Image or Gradient */}
                    {article.imageUrl ? (
                        <div className="h-64 md:h-80 w-full relative">
                            <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 text-white">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md bg-white/20 border border-white/20 mb-3`}>
                                    {article.category}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className={`h-48 relative overflow-hidden flex items-center justify-center
                            ${article.category === 'Video' ? 'bg-red-50' : article.category === 'FAQ' ? 'bg-emerald-50' : 'bg-blue-50'}
                        `}>
                            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black to-transparent" />
                            {article.category === 'Video' ?
                                <Video className="w-20 h-20 text-red-200" /> :
                                article.category === 'FAQ' ?
                                    <HelpCircle className="w-20 h-20 text-emerald-200" /> :
                                    <BookOpen className="w-20 h-20 text-blue-200" />
                            }
                        </div>
                    )}

                    <div className="p-8 md:p-12">
                        {/* Title & Meta */}
                        <div className="border-b border-gray-100 pb-8 mb-8">
                            {!article.imageUrl && (
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4
                                    ${article.category === 'Video' ? 'bg-red-100 text-red-700' :
                                        article.category === 'FAQ' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-blue-100 text-blue-700'}`}>
                                    {article.category}
                                </span>
                            )}
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                                {article.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                                <span className="flex items-center gap-2">
                                    <Clock size={16} className="text-gray-400" />
                                    Updated {dayjs(article.updatedAt).fromNow()}
                                </span>
                                <span className="flex items-center gap-2">
                                    <User size={16} className="text-gray-400" />
                                    By {article.updatedBy?.role === 'it_support' ? 'IT Support' : (article.updatedBy?.name || 'Admin')}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Eye size={16} className="text-gray-400" />
                                    {article.viewCount} views
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="prose prose-lg max-w-none prose-blue prose-headings:font-bold prose-headings:text-gray-800 prose-p:text-gray-600 prose-img:rounded-2xl">
                            {article.videoUrl && (
                                <div className="aspect-video rounded-2xl overflow-hidden mb-8 shadow-lg ring-1 ring-gray-200">
                                    <iframe
                                        src={article.videoUrl.replace("watch?v=", "embed/")}
                                        title="Video player"
                                        className="w-full h-full"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            )}

                            <div className="whitespace-pre-line">
                                {article.content}
                            </div>
                        </div>

                        {/* Tags */}
                        {article.tags && (
                            <div className="mt-10 flex flex-wrap gap-2">
                                {article.tags.split(',').map((tag, i) => (
                                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium flex items-center gap-1">
                                        <Tag size={12} /> {tag.trim()}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Interaction Bar */}
                        <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-gray-700">Was this helpful?</span>
                                <button
                                    onClick={handleVote}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all active:scale-95
                                        ${voting ? 'opacity-50 cursor-wait' : ''}
                                        bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100 hover:border-blue-200 font-bold`}
                                >
                                    <ThumbsUp size={18} />
                                    <span>Yes</span>
                                    <span className="bg-white/50 px-2 py-0.5 rounded-md text-xs ml-1">{article.helpful}</span>
                                </button>
                            </div>


                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default KnowledgeBaseDetail;
