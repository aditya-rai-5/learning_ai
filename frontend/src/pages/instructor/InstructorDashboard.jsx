import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, DollarSign, PlusCircle, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

export default function InstructorDashboard() {
    const { data: overview, isLoading, error } = useQuery({
        queryKey: ['instructor-overview'],
        queryFn: async () => {
            const res = await api.get('/instructor/overview');
            return res.data;
        }
    });

    if (isLoading) return <div className="flex justify-center p-12 text-gray-500">Loading overview...</div>;
    if (error) return <div className="flex justify-center p-12 text-red-500">Failed to load overview. You may not have instructor access.</div>;

    const stats = [
        { label: 'Total Active Students', value: overview?.totalStudents || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { label: 'Courses Published', value: overview?.totalCourses || 0, icon: BookOpen, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
        { label: 'Estimated Revenue', value: `$${(overview?.revenue || 0).toFixed(2)}`, icon: DollarSign, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    ];

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Instructor Dashboard</h1>
                    <p className="text-gray-500 mt-1">Monitor your impact and manage your content.</p>
                </div>
                <div className="flex gap-4">
                    <Link 
                        to="/instructor/courses/new" 
                        className="flex items-center gap-2 bg-[#E97451] hover:bg-[#D05D3A] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Create New Course
                    </Link>
                </div>
            </div>

            {/* Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                                <Icon className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions / Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Action: Review Q&A */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student Q&A</h2>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Stay engaged with your students. Review and answer questions from your active courses.
                    </p>
                    <Link 
                        to="/instructor/qa" 
                        className="inline-flex items-center gap-2 text-sm font-bold text-[#E97451] hover:text-[#D05D3A] transition-colors"
                    >
                        Review Q&A <span aria-hidden="true">&rarr;</span>
                    </Link>
                </div>

                {/* We can add more sections here later, like 'Recent Courses' or 'Analytics' */}
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                    <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Manage Your Courses</h3>
                    <p className="text-sm text-gray-500 mb-4 max-w-xs">View all your published and draft courses in one place.</p>
                    <Link 
                        to="/instructor/courses" 
                        className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        View All Courses
                    </Link>
                </div>
            </div>
        </div>
    );
}
