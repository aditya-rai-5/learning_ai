import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { X, Star, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ReviewModal({ courseId, courseTitle, isOpen, onClose }) {
    const queryClient = useQueryClient();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [body, setBody] = useState('');

    const reviewMutation = useMutation({
        mutationFn: async (payload) => {
            return api.post(`/courses/${courseId}/reviews`, payload);
        },
        onSuccess: () => {
            toast.success('Review submitted successfully!');
            queryClient.invalidateQueries(['dashboard-enrollments']);
            queryClient.invalidateQueries(['dashboard-all-courses']);
            onClose();
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Failed to submit review');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please select a star rating');
            return;
        }
        reviewMutation.mutate({ rating, body });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Rate this Course</h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 line-clamp-1">{courseTitle}</p>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="flex justify-center gap-2 mb-8">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none transition-transform hover:scale-110"
                                >
                                    <Star 
                                        className={`w-10 h-10 ${
                                            (hoverRating || rating) >= star 
                                            ? 'fill-yellow-400 text-yellow-400' 
                                            : 'text-gray-300 dark:text-gray-600'
                                        } transition-colors`} 
                                    />
                                </button>
                            ))}
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Write a review (Optional)
                            </label>
                            <textarea
                                rows={4}
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder="What did you like or dislike about this course?"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] focus:border-transparent outline-none transition-shadow resize-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={reviewMutation.isLoading}
                            className="w-full py-3.5 bg-[#E97451] hover:bg-[#D05D3A] text-white font-bold rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {reviewMutation.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Review'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
