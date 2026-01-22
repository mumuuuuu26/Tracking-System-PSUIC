import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submitFeedback, getTicket } from '../../api/ticket';
import useAuthStore from '../../store/auth-store';
import { Star, ChevronLeft } from 'lucide-react';
import { toast } from 'react-toastify';

const Feedback = () => {
    const { ticketId } = useParams();
    const { token } = useAuthStore();
    const navigate = useNavigate();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hover, setHover] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [ticket, setTicket] = useState(null);
    const [showComment, setShowComment] = useState(false);

    const tags = ["Usability", "Performance", "Repair Process", "Service Quality"];

    useEffect(() => {
        fetchTicket();
    }, [ticketId]);

    const fetchTicket = async () => {
        try {
            const res = await getTicket(token, ticketId);
            setTicket(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load ticket details");
        }
    };

    const toggleTag = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return toast.error("Please select a rating");

        try {
            setLoading(true);
            const finalComment = selectedTags.length > 0
                ? `[Tags: ${selectedTags.join(', ')}] ${comment}`
                : comment;

            await submitFeedback(token, ticketId, { rating, comment: finalComment });
            toast.success("Thank you for your feedback!");
            navigate('/user/feedback');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Submit failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Header */}
            <div className="bg-[#193C6C] pt-14 pb-4 px-4 shadow-md sticky top-0 z-10">
                <div className="relative flex items-center justify-center max-w-2xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute left-0 text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                    >
                        <ChevronLeft size={28} strokeWidth={2} />
                    </button>
                    <h1 className="text-white text-xl font-bold tracking-wide">Satisfaction</h1>
                </div>
            </div>

            <div className="flex-1 max-w-md mx-auto w-full p-6 animate-in fade-in duration-500">
                <form onSubmit={handleSubmit} className="h-full flex flex-col">

                    {/* Rating Section */}
                    <div className="text-center mb-8 mt-4">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">How was your report?</h2>
                        <p className="text-gray-500 text-sm mb-6">Your feedback helps us get better.</p>

                        <div className="flex justify-center gap-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    type="button"
                                    key={star}
                                    className="focus:outline-none transform transition-transform active:scale-95 hover:scale-110"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHover(star)}
                                    onMouseLeave={() => setHover(0)}
                                >
                                    <Star
                                        size={42}
                                        fill={star <= (hover || rating) ? "#FBBF24" : "transparent"} // Gold fill if selected, transparent (outline) if not
                                        className={`${star <= (hover || rating) ? "text-yellow-400" : "text-gray-300"} transition-colors duration-200`}
                                        strokeWidth={1.5}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 mb-8"></div>

                    {/* Tags Section */}
                    <div className="text-center mb-8">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Compliment Your IT</h3>
                        <p className="text-gray-500 text-sm mb-5">Share your positive feedback</p>

                        <div className="flex flex-wrap justify-center gap-3 mb-6">
                            {tags.map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={`px-5 py-2.5 rounded-3xl text-sm font-semibold border transition-all shadow-sm active:scale-95 ${selectedTags.includes(tag)
                                            ? "bg-gray-800 text-white border-gray-800"
                                            : "bg-white text-gray-600 border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => document.getElementById('comment-box')?.focus()}
                                className="px-5 py-2.5 rounded-3xl text-sm font-semibold border border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100 transition-all shadow-sm active:scale-95"
                            >
                                + Add comment
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-px bg-gray-100 mb-8"></div>

                    {/* Additional Comments (Always Visible) */}
                    <div className="mb-auto">
                        <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">Additional Comments</h3>
                        <p className="text-gray-500 text-sm mb-4 text-center">Show your appreciation by leaving a tip for the IT.</p>

                        <div className="bg-white rounded-2xl border border-gray-200 p-2 focus-within:ring-2 focus-within:ring-[#193C6C] transition-shadow shadow-sm">
                            <textarea
                                id="comment-box"
                                className="w-full p-3 bg-transparent border-none rounded-xl focus:outline-none resize-none text-gray-700 placeholder-gray-400 text-sm"
                                rows="4"
                                placeholder="+ Add comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            ></textarea>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="mt-8 pb-8">
                        <button
                            type="submit"
                            disabled={loading || rating === 0}
                            className={`w-full bg-[#193C6C] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#143057] transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none`}
                        >
                            {loading ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Feedback;
