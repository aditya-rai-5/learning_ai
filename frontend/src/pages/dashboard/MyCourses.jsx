import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { BookOpen, CheckCircle2, Clock, Loader2, PlayCircle, Search } from 'lucide-react';

export default function MyCourses() {
    const [filter, setFilter] = useState('ALL'); // ALL, IN_PROGRESS, COMPLETED
    const [searchQuery, setSearchQuery] = useState('');

    const { data: enrollments, isLoading, error } = useQuery({
        queryKey: ['my-courses'],
        queryFn: async () => {
            const res = await api.get('/enrollments');
            return res.data;
        }
    });

    const filteredCourses = useMemo(() => {
        if (!enrollments) return [];
        let filtered = enrollments;

        // Apply tab filter
        if (filter === 'COMPLETED') {
            filtered = filtered.filter(e => e.completedAt != null);
        } else if (filter === 'IN_PROGRESS') {
            filtered = filtered.filter(e => !e.completedAt);
        }

        // Apply search filter
        if (searchQuery.trim()) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(e => 
                e.course.title.toLowerCase().includes(lowerQuery) ||
                e.course.description?.toLowerCase().includes(lowerQuery)
            );
        }

        return filtered;
    }, [enrollments, filter, searchQuery]);

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#E97451]" /></div>;
    if (error) return <div className="p-8 text-red-500 text-center">Failed to load courses.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and track your active learning journey.</p>
                </div>
                
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="Search your courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E97451] transition-shadow"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-800">
                <button 
                    onClick={() => setFilter('ALL')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'ALL' ? 'border-[#E97451] text-[#E97451]' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    All Courses
                </button>
                <button 
                    onClick={() => setFilter('IN_PROGRESS')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'IN_PROGRESS' ? 'border-[#E97451] text-[#E97451]' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    In Progress
                </button>
                <button 
                    onClick={() => setFilter('COMPLETED')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${filter === 'COMPLETED' ? 'border-[#E97451] text-[#E97451]' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Completed
                </button>
            </div>

            {filteredCourses.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
                    <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No courses found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">You don't have any courses matching this filter.</p>
                    <Link to="/courses" className="bg-[#E97451] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[#D05D3A] transition-colors">
                        Browse Catalog
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredCourses.map((enrollment) => {
                        const { course, progress } = enrollment;
                        const isCompleted = !!enrollment.completedAt;
                        
                        // Calculate basic progress metric
                        const completedCount = progress?.filter(p => p.status === 'COMPLETED').length || 0;
                        const totalTracked = course?._count?.modules || Math.max(progress?.length || 1, 1); 
                        const progressPercent = isCompleted ? 100 : Math.min(100, Math.round((completedCount / totalTracked) * 100));

                        return (
                            <div key={enrollment.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col">
                                <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                                    {course.thumbnailUrl ? (
                                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-[#4A5D23] to-[#E97451] flex items-center justify-center p-6">
                                            <span className="text-white font-bold text-xl text-center line-clamp-2">{course.title}</span>
                                        </div>
                                    )}
                                    {isCompleted && (
                                        <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold shadow flex items-center gap-1">
                                            <CheckCircle2 className="w-3 h-3" /> Completed
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2">{course.title}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
                                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                                    </div>
                                    
                                    <div className="mt-auto">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Overall Progress</span>
                                            <span className="font-bold text-[#E97451]">{progressPercent}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 mb-4 overflow-hidden">
                                            <div className="bg-[#E97451] h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                                        </div>
                                        
                                        <Link 
                                            to={`/learn/${course.id}`}
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
        </div>
    );
}
