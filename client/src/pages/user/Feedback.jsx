import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submitFeedback } from '../../api/ticket';
import useAuthStore from '../../store/auth-store';
import { Star } from 'lucide-react';
import { toast } from 'react-toastify';

const Feedback = () => {
    const { ticketId } = useParams();
    const { token } = useAuthStore();
    const navigate = useNavigate();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hover, setHover] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) return toast.error("Please select a rating");

        try {
            setLoading(true);
            await submitFeedback(token, ticketId, { rating, comment });
            toast.success("Thank you for your feedback!");
            navigate('/user/my-tickets');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Submit failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[80vh] bg-gray-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                    Rate Service
                </h2>
                <p className="text-gray-500 mb-6">How was your experience with Ticket #{ticketId}?</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Star Rating */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                type="button"
                                key={star}
                                className="transition-transform hover:scale-110 focus:outline-none"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHover(star)}
                                onMouseLeave={() => setHover(rating)}
                            >
                                <Star
                                    size={36}
                                    fill={star <= (hover || rating) ? "#FBBF24" : "transparent"}
                                    className={star <= (hover || rating) ? "text-yellow-400" : "text-gray-300"}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="text-sm font-medium text-yellow-500 h-4">
                        {rating === 1 && "Poor"}
                        {rating === 2 && "Fair"}
                        {rating === 3 && "Good"}
                        {rating === 4 && "Very Good"}
                        {rating === 5 && "Excellent"}
                    </p>

                    {/* Comment */}
                    <textarea
                        className="w-full p-4 border rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                        rows="4"
                        placeholder="Share your experience (optional)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    ></textarea>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? "Submitting..." : "Submit Feedback"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Feedback;
