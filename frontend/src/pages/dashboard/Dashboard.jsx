import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Clock, Loader2, PlayCircle } from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuth();

    const { data: enrollments = [], isLoading: loadingEnrollments, error: enrollmentsError } = useQuery({
        queryKey: ['dashboard-enrollments'],
        queryFn: async () => {
            const res = await api.get('/enrollments');
            return res.data;
        }
    });

    const { data: allCourses = [], isLoading: loadingCourses } = useQuery({
        queryKey: ['dashboard-all-courses'],
        queryFn: async () => {
            const res = await api.get('/courses');
            return res.data.courses || res.data; // Handle pagination structure if present
        }
    });

    const totalCourses = enrollments.length;
    const completedCourses = enrollments.filter(e => e.status === 'COMPLETED').length;
    
    const stats = [
        { label: 'Courses enrolled', value: totalCourses },
        { label: 'Courses completed', value: completedCourses },
    ];

    // Filter out courses the user is already enrolled in
    const unenrolledCourses = Array.isArray(allCourses) 
        ? allCourses.filter(course => !enrollments.some(e => e.courseId === course.id))
        : [];

    if (loadingEnrollments) {
        return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#E97451]" /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Welcome back, {user?.name || 'Student'}</h1>
            
            {enrollmentsError && <div className="text-red-500 mb-6">Failed to load your dashboard data.</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                {stats.map(({ label, value }) => (
                    <div key={label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl p-6">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                    </div>
                ))}
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Courses</h2>

            {enrollments.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm rounded-xl p-8 text-center mb-12">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">You haven't enrolled yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                        Explore our catalog and find the perfect course to start your learning journey.
                    </p>
                    <Link to="/courses" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#E97451] hover:bg-[#D05D3A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FFF0E8] transition-colors">
                        Browse courses
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                    {enrollments.map((enrollment) => {
                        const { course } = enrollment;
                        const progressArray = Array.isArray(enrollment.progress) ? enrollment.progress : [];
                        const completedModules = progressArray.filter(p => p.status === 'COMPLETED').length;
                        const isCompleted = !!enrollment.completedAt;
                        const totalModules = course?._count?.modules || Math.max(progressArray.length, 1);
                        const progress = isCompleted ? 100 : Math.min(100, Math.round((completedModules / totalModules) * 100));
                        
                        return (
                            <div key={enrollment.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
                                <div className="h-32 bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-950 dark:to-black relative p-4 flex items-end">
                                    <span className="text-white font-bold text-lg line-clamp-2">{course?.title || 'Unknown Course'}</span>
                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                                    </div>
                                    
                                    <div className="mt-auto">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Progress</span>
                                            <span className="font-bold text-[#E97451]">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-4 overflow-hidden">
                                            <div className="bg-[#E97451] h-full rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        
                                        <Link 
                                            to={`/learn/${course?.id}`}
                                            className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg font-medium text-sm transition-colors ${
                                                isCompleted 
                                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700' 
                                                : 'bg-[#FFF0E8] text-[#E97451] hover:bg-[#FFE0D1] dark:bg-[#E97451]/10 dark:hover:bg-[#E97451]/20'
                                            }`}
                                        >
                                            {isCompleted ? 'Review Course' : <><PlayCircle className="w-4 h-4" /> Continue Learning</>}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Discover More Courses</h2>
                <Link to="/courses" className="text-sm font-medium text-[#E97451] hover:text-[#D05D3A] transition-colors">View All &rarr;</Link>
            </div>

            {loadingCourses ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : unenrolledCourses.length === 0 ? (
                <div className="text-center py-10 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    You're enrolled in all available courses!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {unenrolledCourses.slice(0, 3).map(course => (
                        <div key={course.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm group">
                            <div className="h-32 bg-gray-100 dark:bg-gray-800 relative">
                                {course.thumbnailUrl ? (
                                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-[#4A5D23] to-[#E97451] flex items-center justify-center p-6">
                                        <span className="text-white font-bold text-xl text-center line-clamp-2">{course.title}</span>
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 bg-white dark:bg-gray-900 px-2 py-1 rounded text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                                    {course.level}
                                </div>
                            </div>
                            <div className="p-5 flex flex-col h-[180px]">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-[#E97451] transition-colors">{course.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">{course.description}</p>
                                <div className="mt-auto flex items-center justify-between">
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {course.price > 0 ? `$${course.price}` : 'Free'}
                                    </span>
                                    <Link 
                                        to={`/courses/${course.slug || course.id}`}
                                        className="text-sm font-bold text-[#E97451] hover:text-[#D05D3A] transition-colors"
                                    >
                                        View Details
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
