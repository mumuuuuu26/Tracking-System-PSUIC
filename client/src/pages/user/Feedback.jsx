import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { submitFeedback, getTicket } from '../../api/ticket';
import useAuthStore from '../../store/auth-store';
import { ChevronLeft, CheckCircle2, Ticket, Send, ArrowRight, ChevronRight, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';

const Feedback = () => {
    const { ticketId } = useParams();
    const { token } = useAuthStore();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1 or 2
    const [responses, setResponses] = useState(Array(10).fill(null)); // 0-9 indices
    const [comment, setComment] = useState('');
    const [ticket, setTicket] = useState(null);

    const questions = [
        "I think that I would like to use this system frequently.",
        "I found the system unnecessarily complex.",
        "I thought the system was easy to use.",
        "I think that I would need the support of a technical person to be able to use this system.",
        "I found the various functions in this system were well integrated.",
        "I thought there was too much inconsistency in this system.",
        "I would imagine that most people would learn to use this system very quickly.",
        "I found the system very cumbersome to use.",
        "I felt very confident using the system.",
        "I needed to learn a lot of things before I could get going with this system."
    ];

    const fetchTicket = useCallback(async () => {
        try {
            const res = await getTicket(token, ticketId);
            setTicket(res.data);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load ticket details");
        }
    }, [token, ticketId]);

    useEffect(() => {
        fetchTicket();
    }, [fetchTicket]);

    const handleRatingChange = (questionIndex, value) => {
        const newResponses = [...responses];
        newResponses[questionIndex] = value;
        setResponses(newResponses);
    };

    const handleNext = () => {
        // Validate Step 1 (Indices 0-4)
        const currentQuestions = responses.slice(0, 5);
        if (currentQuestions.some(r => r === null)) {
            toast.warn("Please answer all questions on this page.");
            // Scroll to top of questions
            document.getElementById('question-list-top')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBack = () => {
        setStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async () => {
        // Validate Step 2 (Indices 5-9)
        const currentQuestions = responses.slice(5, 10);
        if (currentQuestions.some(r => r === null)) {
            toast.warn("Please answer all questions before submitting.");
            return;
        }

        try {
            setLoading(true);
            await submitFeedback(token, ticketId, {
                susValues: responses,
                userFeedback: comment
            });
            toast.success("Thank you for your feedback!");
            navigate('/user/feedback');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || "Submit failed");
        } finally {
            setLoading(false);
        }
    };

    // Calculate progress percentage
    const answeredCount = responses.filter(r => r !== null).length;
    const progressPercentage = (answeredCount / 10) * 100;

    const currentQuestionsStartIndex = step === 1 ? 0 : 5;
    const currentQuestionsEndIndex = step === 1 ? 5 : 10;
    const currentQuestions = questions.slice(currentQuestionsStartIndex, currentQuestionsEndIndex);

    return (
        <div className="min-h-screen bg-gray-50 pb-32 font-sans">

            {/* Header Section */}
            {/* Standard Header */}
            <div className="bg-[#193C6C] px-4 py-4 flex items-center sticky top-0 z-50 lg:hidden shadow-sm">
                <button
                    onClick={() => step === 2 ? handleBack() : navigate(-1)}
                    className="text-white p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <span className="text-lg font-bold text-white absolute left-1/2 -translate-x-1/2">
                    Feedback
                </span>
            </div>

            {/* Main Content Container */}
            <div className="max-w-5xl mx-auto lg:mx-0 px-4 mt-6 relative z-10 space-y-8">

                {/* 1. Ticket Info Card */}
                {ticket && (
                    <div className="bg-white rounded-3xl shadow-xl p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="inline-flex items-center gap-2 bg-blue-50 text-[#193C6C] px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                            <Ticket size={14} />
                            Ticket #{String(ticket.id).padStart(4, '0')}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{ticket.title}</h2>
                        {ticket.description && (
                            <p className="text-gray-500 max-w-2xl mx-auto text-sm">{ticket.description}</p>
                        )}

                        {/* Progress Bar */}
                        <div className="mt-8 max-w-md mx-auto">
                            <div className="flex justify-between text-xs font-bold text-gray-400 mb-2 px-1 uppercase tracking-wider">
                                <span>Progress</span>
                                <span>{answeredCount} / 10 Answered</span>
                            </div>
                            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#193C6C] transition-all duration-700 ease-out rounded-full relative"
                                    style={{ width: `${progressPercentage}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div id="question-list-top"></div>

                {/* 2. Page Questions */}
                <div className="space-y-4">
                    {currentQuestions.map((q, idx) => {
                        const realIndex = currentQuestionsStartIndex + idx;
                        return (
                            <div
                                key={realIndex}
                                className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 transition-all hover:shadow-md animate-in fade-in slide-in-from-bottom-8 duration-500"
                                style={{ animationDelay: `${idx * 100}ms` }}
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-gray-800 mb-2 flex gap-3">
                                            <span className="text-gray-300 font-black text-xl min-w-[30px]">
                                                {String(realIndex + 1).padStart(2, '0')}.
                                            </span>
                                            {q}
                                        </h3>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <div className="flex flex-col items-center">
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((val) => (
                                                    <button
                                                        key={val}
                                                        onClick={() => handleRatingChange(realIndex, val)}
                                                        className={`
                                                            w-10 h-10 md:w-12 md:h-12 rounded-full border-2 font-bold text-lg transition-all duration-200 flex items-center justify-center
                                                            ${responses[realIndex] === val
                                                                ? 'bg-[#193C6C] text-white border-[#193C6C] shadow-lg scale-110'
                                                                : 'bg-white text-gray-400 border-gray-100 hover:border-[#193C6C] hover:text-[#193C6C]'}
                                                        `}
                                                    >
                                                        {val}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="w-full flex justify-between text-[10px] font-bold text-gray-300 mt-2 px-1 uppercase tracking-wider">
                                                <span>Disagree</span>
                                                <span>Agree</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* 3. Navigation / Submit Actions */}
                <div className="pt-4">
                    {step === 1 ? (
                        <div className="flex justify-center">
                            <button
                                onClick={handleNext}
                                className="bg-[#193C6C] text-white py-4 px-12 rounded-full font-bold text-lg hover:bg-[#143057] transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 flex items-center gap-3 w-full md:w-auto justify-center"
                            >
                                Next Step <ChevronRight />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8">
                            {/* Comment Section (Only on Step 2) */}
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                                <label className="flex items-center gap-2 font-bold text-gray-800 mb-4 text-lg">
                                    <CheckCircle2 className="text-[#193C6C]" size={24} />
                                    Additional Comments (Optional)
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    placeholder="Is there anything else you'd like to tell us?"
                                    className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-[#193C6C] transition-all min-h-[120px] text-gray-700 text-base"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleBack}
                                    className="flex-1 bg-white border-2 border-gray-200 text-gray-600 py-4 rounded-full font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-[0.98]"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-[2] bg-[#193C6C] text-white py-4 rounded-full font-bold text-lg hover:bg-[#143057] transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            Submit Feedback <Send size={20} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Feedback;
