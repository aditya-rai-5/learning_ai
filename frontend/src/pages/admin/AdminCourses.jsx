import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function AdminCourses() {
    const queryClient = useQueryClient();

    const { data: courses, isLoading } = useQuery({
        queryKey: ['admin-courses'],
        queryFn: async () => {
            const res = await api.get('/admin/courses');
            return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (courseId) => {
            return api.delete(`/courses/${courseId}`);
        },
        onSuccess: () => {
            toast.success('Course deleted successfully');
            queryClient.invalidateQueries(['admin-courses']);
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Failed to delete course');
        }
    });

    const handleDelete = (courseId) => {
        if (window.confirm('Are you sure you want to permanently delete this course? This cannot be undone.')) {
            deleteMutation.mutate(courseId);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading courses...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Course Catalog</h1>
            <p className="text-gray-500 mb-8">Manage all courses on the platform.</p>

            <div className="grid gap-4">
                {courses?.map(course => (
                    <div key={course.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl flex items-center justify-between shadow-sm">
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{course.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>Instructor: {course.creator?.name || 'Unknown'}</span>
                                <span>•</span>
                                <span>{course._count.enrollments} enrollments</span>
                                <span>•</span>
                                <span>{course._count.modules} modules</span>
                                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-semibold uppercase tracking-wider">
                                    {course.level}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link 
                                to={`/courses/${course.slug || course.id}`}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            >
                                <ExternalLink className="w-4 h-4" /> View
                            </Link>
                            <button 
                                onClick={() => handleDelete(course.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Delete Course"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
