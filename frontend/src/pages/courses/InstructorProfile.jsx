import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, Users, LayoutList, Calendar } from 'lucide-react';
import api from '../../lib/api';

export default function InstructorProfile() {
    const { instructorId } = useParams();

    const { data: profile, isLoading, error } = useQuery({
        queryKey: ['instructor-profile', instructorId],
        queryFn: async () => {
            const res = await api.get(`/instructor/profile/${instructorId}`);
            return res.data;
        }
    });

    if (isLoading) return <div className="flex justify-center p-16 text-gray-500">Loading profile...</div>;
    if (error) return <div className="flex justify-center p-16 text-red-500">Instructor not found.</div>;

    const totalStudents = profile.courses.reduce((acc, course) => acc + (course._count?.enrollments || 0), 0);

    return (
        <div className="max-w-5xl mx-auto px-4 py-12">
            {/* Profile Header */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-sm mb-12">
                <div className="w-32 h-32 bg-[#E97451] rounded-full flex items-center justify-center shrink-0 border-4 border-white dark:border-gray-900 shadow-lg overflow-hidden">
                    {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-5xl font-bold text-white uppercase">{profile.name.charAt(0)}</span>
                    )}
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{profile.name}</h1>
                    <p className="text-[#E97451] font-semibold tracking-wide uppercase text-sm mb-4">Instructor</p>
                    
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4" />
                            {profile.courses.length} Courses
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            {totalStudents} Students
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            Joined {new Date(profile.createdAt).getFullYear()}
                        </span>
                    </div>

                    {profile.skills && profile.skills.length > 0 && (
                        <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-2">
                            {profile.skills.map(skill => (
                                <span key={skill.id} className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-xs font-medium">
                                    {skill.skillTag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Courses List */}
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-[#E97451]" />
                Courses by {profile.name}
            </h2>

            {profile.courses.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
                    This instructor hasn't published any courses yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profile.courses.map(course => (
                        <Link 
                            key={course.id} 
                            to={`/courses/${course.slug || course.id}`}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-[#E97451] hover:shadow-lg transition-all group flex flex-col"
                        >
                            <div className="h-40 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                                {course.thumbnailUrl ? (
                                    <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                )}
                                <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white">
                                    {course.level}
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-[#E97451] transition-colors">{course.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1">{course.description}</p>
                                
                                <div className="flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
                                    <span className="flex items-center gap-1">
                                        <LayoutList className="w-4 h-4 text-gray-400" />
                                        {course._count.modules} modules
                                    </span>
                                    <span>
                                        {course.price > 0 ? `$${course.price}` : 'Free'}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
