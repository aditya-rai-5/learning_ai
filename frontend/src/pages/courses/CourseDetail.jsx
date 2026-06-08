import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

// Helper function to dynamically load the Razorpay script
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
            resolve(true);
        };
        script.onerror = () => {
            resolve(false);
        };
        document.body.appendChild(script);
    });
};

export default function CourseDetail() {
    const { identifier } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [enrollError, setEnrollError] = useState('');
    const [enrolling, setEnrolling] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);

    useEffect(() => {
        const fetchCourseAndEnrollment = async () => {
            try {
                // Fetch course details
                const res = await api.get(`/courses/${identifier}`);
                setCourse(res.data);
                
                // If user is logged in, check if already enrolled
                if (user) {
                    try {
                        await api.get(`/enrollments/${res.data.id}`);
                        setIsEnrolled(true);
                    } catch (e) {
                        // 404 means not enrolled, other errors ignore for now
                        setIsEnrolled(false);
                    }
                }
            } catch (err) {
                setError('Course not found or failed to load.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourseAndEnrollment();
    }, [identifier, user]);

    const handleEnroll = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setEnrolling(true);
        setEnrollError('');
        try {
            const res = await api.post(`/payments/enroll/${course.id}`, {});
            
            if (res.data.message === "Successfully enrolled in free course") {
                setIsEnrolled(true);
                navigate('/dashboard');
                return;
            }
            
            // Handle Razorpay Payment flow
            if (res.data.paymentDetails && res.data.paymentDetails.status === "PAYMENT_REQUIRED") {
                const isLoaded = await loadRazorpayScript();
                
                if (!isLoaded) {
                    setEnrollError("Razorpay SDK failed to load. Are you online?");
                    setEnrolling(false);
                    return;
                }

                // Fetch public config key from backend
                const configRes = await api.get('/payments/config');
                const razorpayKeyId = configRes.data.keyId;

                const { razorpayOrderId, amount, currency } = res.data.paymentDetails;

                const options = {
                    key: razorpayKeyId,
                    amount: amount.toString(),
                    currency: currency,
                    name: "LearnAI",
                    description: `Enrollment for ${course.title}`,
                    order_id: razorpayOrderId,
                    handler: async function (response) {
                        try {
                            setEnrolling(true);
                            // Verify payment on the backend
                            await api.post('/payments/verify', {
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature
                            });
                            
                            setIsEnrolled(true);
                            navigate('/dashboard');
                        } catch (err) {
                            console.error(err);
                            setEnrollError("Payment verification failed. Please contact support.");
                        } finally {
                            setEnrolling(false);
                        }
                    },
                    prefill: {
                        name: user.name,
                        email: user.email,
                    },
                    theme: {
                        color: "#E97451" // Indigo 600
                    }
                };

                const paymentObject = new window.Razorpay(options);
                paymentObject.on('payment.failed', function (response) {
                    setEnrollError(`Payment failed: ${response.error.description}`);
                    setEnrolling(false);
                });
                paymentObject.open();
            }

        } catch (err) {
            console.error(err);
            setEnrollError(err.response?.data?.error || 'Failed to enroll in the course. Please try again.');
            setEnrolling(false); // Only set false here if it errored out early. If Razorpay opens, we wait for handler.
        }
    };

    if (loading) return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-gray-500">Loading course...</div>;
    if (error) return <div className="max-w-4xl mx-auto px-4 py-12 text-center text-red-500">{error}</div>;
    if (!course) return null;

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 transition-colors">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
                <div className="h-64 bg-gradient-to-r from-[#E97451] to-[#B38B6D] flex items-center justify-center p-8 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{course.title}</h1>
                </div>
                
                <div className="p-8">
                    <div className="flex flex-wrap gap-4 items-center mb-6">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#FFE0D1] text-[#A84525] dark:bg-[#8A3324]/50 dark:text-[#FFA585]">
                            {course.level}
                        </span>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {course.price > 0 ? `$${course.price}` : 'Free'}
                        </span>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 text-lg mb-8 leading-relaxed">
                        {course.description}
                    </p>

                    {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">What you'll learn</h2>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {course.learningOutcomes.map((outcome, idx) => (
                                    <li key={idx} className="flex items-start">
                                        <svg className="h-6 w-6 text-green-500 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-gray-700 dark:text-gray-300">{outcome}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8 flex items-center justify-between">
                        <div>
                            {enrollError && <p className="text-red-500 text-sm mb-2">{enrollError}</p>}
                        </div>
                        {isEnrolled ? (
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                            >
                                Go to Dashboard
                            </button>
                        ) : (
                            <button 
                                onClick={handleEnroll}
                                disabled={enrolling}
                                className="px-8 py-3 bg-[#E97451] hover:bg-[#D05D3A] disabled:bg-[#FF855C] text-white font-semibold rounded-lg shadow-sm transition-colors flex items-center"
                            >
                                {enrolling ? 'Enrolling...' : 'Enroll Now'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Syllabus / Modules */}
            {course.modules && course.modules.length > 0 ? (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Course Syllabus</h2>
                    <div className="space-y-4">
                        {course.modules.sort((a,b) => a.order - b.order).map((mod, index) => (
                            <div key={mod.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div className="flex items-center mb-2">
                                    <span className="text-[#E97451] dark:text-[#FF855C] font-bold mr-4">Module {index + 1}</span>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{mod.title}</h3>
                                </div>
                                {mod.description && <p className="text-gray-600 dark:text-gray-400 pl-16">{mod.description}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                 <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Course Syllabus</h2>
                    <p className="text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                        Syllabus is not yet available for this course.
                    </p>
                 </div>
            )}
        </div>
    );
}
