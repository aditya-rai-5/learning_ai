import { useQuery } from '@tanstack/react-query';
import { BookOpen, PlusCircle, Users, LayoutList } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function InstructorCourses() {
    const navigate = useNavigate();

    const { data: courses, isLoading, error } = useQuery({
        queryKey: ['instructor-courses'],
        queryFn: async () => {
            const res = await api.get('/instructor/courses');
            return res.data;
        }
    });

    if (isLoading) return <div className="flex justify-center p-12 text-gray-500">Loading courses...</div>;
    if (error) return <div className="flex justify-center p-12 text-red-500">Failed to load courses.</div>;

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Courses</h1>
                    <p className="text-gray-500 mt-1">Manage and edit your course catalogue.</p>
                </div>
                <Link 
                    to="/instructor/courses/new" 
                    className="flex items-center gap-2 bg-[#E97451] hover:bg-[#D05D3A] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
                >
                    <PlusCircle className="w-5 h-5" />
                    Create New Course
                </Link>
            </div>

            {courses?.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
                    <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No courses yet</h3>
                    <p className="text-gray-500 mb-6">Create your first course to start teaching!</p>
                    <Link 
                        to="/instructor/courses/new" 
                        className="inline-flex items-center gap-2 bg-[#E97451] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#D05D3A] transition-colors"
                    >
                        <PlusCircle className="w-4 h-4" /> Create Course
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {courses.map(course => (
                        <div 
                            key={course.id} 
                            onClick={() => navigate(`/instructor/courses/${course.id}/edit`)}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl flex items-center justify-between hover:border-[#E97451] cursor-pointer transition-colors shadow-sm"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shrink-0">
                                    {course.thumbnailUrl ? (
                                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <BookOpen className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{course.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <LayoutList className="w-4 h-4" />
                                            {course._count.modules} modules
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="w-4 h-4" />
                                            {course._count.enrollments} students
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-semibold uppercase tracking-wider">
                                            {course.level}
                                        </span>
                                        <span className="font-bold text-gray-700 dark:text-gray-300">
                                            {course.price > 0 ? `$${course.price}` : 'Free'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-[#E97451] font-medium text-sm flex items-center gap-1 group-hover:underline">
                                Edit Course &rarr;
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
