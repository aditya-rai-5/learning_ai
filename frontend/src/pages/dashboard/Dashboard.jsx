import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();
    const [enrollments, setEnrollments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEnrollments = async () => {
            try {
                const res = await api.get('/enrollments');
                setEnrollments(res.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load your dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchEnrollments();
    }, []);

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'COMPLETED').length;
    
    // We don't have modules completed explicitly in basic enrollments unless we aggregate, but we can display what we have.
    const stats = [
        { label: 'Courses enrolled', value: totalCourses },
        { label: 'Courses completed', value: completedCourses },
    ];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Welcome back, {user?.name || 'Student'}</h1>
            
            {error && <div className="text-red-500 mb-6">{error}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                {stats.map(({ label, value }) => (
                    <div key={label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl p-6">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                    </div>
                ))}
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Courses</h2>

            {loading ? (
                <div className="text-gray-500 dark:text-gray-400 py-8">Loading your courses...</div>
            ) : enrollments.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl p-8 text-center">
                    <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">You haven't enrolled yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                        Explore our catalog and find the perfect course to start your learning journey.
                    </p>
                    <Link to="/courses" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#E97451] hover:bg-[#D05D3A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFF0E8]0 transition-colors">
                        Browse courses
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrollments.map((enrollment) => {
                        const { course } = enrollment;
                        const progressArray = Array.isArray(enrollment.progress) ? enrollment.progress : [];
                        const completedModules = progressArray.filter(p => p.status === 'COMPLETED').length;
                        // For now we mock the percentage since we don't have total modules in this query easily
                        const progress = progressArray.length > 0 ? Math.min(100, Math.round((completedModules / Math.max(progressArray.length, 1)) * 100)) : 0;
                        
                        return (
                            <div key={enrollment.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                                <div className="h-32 bg-gradient-to-r from-[#4A5D23] to-[#E97451] flex items-center justify-center p-4">
                                    <span className="text-white font-bold text-center line-clamp-2">{course?.title || 'Unknown Course'}</span>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                        {course?.title || 'Unknown Course'}
                                    </h3>
                                    
                                    <div className="mt-auto pt-4">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Progress</span>
                                            <span className="text-gray-500 dark:text-gray-400">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
                                            <div 
                                                className="bg-[#E97451] h-2 rounded-full transition-all duration-500" 
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                        
                                        <Link 
                                            to={`/learn/${course?.id}`}
                                            className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-[#D05D3A] bg-[#FFE0D1] hover:bg-[#FFC6B0] dark:bg-[#8A3324]/50 dark:text-[#FFA585] dark:hover:bg-[#A84525]/50 transition-colors"
                                        >
                                            {progress === 0 ? 'Start Course' : 'Continue Learning'}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
