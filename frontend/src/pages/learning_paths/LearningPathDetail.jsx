import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { ArrowLeft, BookOpen, Clock, Loader2, PlayCircle, Lock, CheckCircle2 } from 'lucide-react';

export default function LearningPathDetail() {
    const { pathId } = useParams();

    const { data: path, isLoading, error } = useQuery({
        queryKey: ['learning-path', pathId],
        queryFn: async () => {
            const res = await api.get(`/learning-paths/${pathId}`);
            return res.data;
        }
    });

    const { data: enrollments } = useQuery({
        queryKey: ['my-courses'],
        queryFn: async () => {
            const res = await api.get('/enrollments');
            return res.data;
        }
    });

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#E97451]" /></div>;
    if (error || !path) return <div className="p-8 text-red-500 text-center">Failed to load learning path.</div>;

    // Check progress
    let enrolledCoursesCount = 0;
    let completedCoursesCount = 0;
    
    const coursesWithStatus = path.courses.map(pc => {
        const enrollment = enrollments?.find(e => e.courseId === pc.courseId);
        const isCompleted = !!enrollment?.completedAt;
        if (enrollment) enrolledCoursesCount++;
        if (isCompleted) completedCoursesCount++;
        
        return {
            ...pc.course,
            order: pc.order,
            isEnrolled: !!enrollment,
            isCompleted
        };
    }).sort((a, b) => a.order - b.order);

    const progressPercent = path.courses.length > 0 
        ? Math.round((completedCoursesCount / path.courses.length) * 100) 
        : 0;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link to="/learning-paths" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Paths
            </Link>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 mb-8 shadow-sm">
                <div className="flex flex-wrap gap-2 mb-4">
                    {path.tags?.map((tag, i) => (
                        <span key={i} className="px-2.5 py-1 bg-[#FFF0E8] text-[#E97451] dark:bg-[#E97451]/10 text-xs rounded-lg font-bold uppercase tracking-wider">
                            {tag}
                        </span>
                    ))}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{path.title}</h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg mb-8 leading-relaxed max-w-2xl">{path.description}</p>
                
                <div className="flex items-center gap-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                    <div>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Total Courses</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-[#E97451]" />
                            {path.courses.length}
                        </p>
                    </div>
                    <div className="h-10 w-px bg-gray-200 dark:bg-gray-800"></div>
                    <div className="flex-1 max-w-xs">
                        <div className="flex justify-between text-xs mb-2">
                            <span className="font-medium text-gray-500">Path Progress</span>
                            <span className="font-bold text-[#E97451]">{progressPercent}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                            <div className="bg-[#E97451] h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Course Sequence</h3>
            
            <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[1.1rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:via-gray-200 before:to-transparent dark:before:from-gray-800 dark:before:via-gray-800">
                {coursesWithStatus.map((course, idx) => {
                    // Logic to determine if course is unlocked (e.g., first course is always unlocked, or previous course is completed)
                    const isUnlocked = idx === 0 || coursesWithStatus[idx - 1].isCompleted;
                    
                    return (
                        <div key={course.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-9 h-9 rounded-full border-4 border-gray-50 dark:border-gray-950 bg-white dark:bg-gray-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 relative z-10">
                                {course.isCompleted ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500 fill-green-100 dark:fill-green-900/30" />
                                ) : isUnlocked ? (
                                    <span className="text-sm font-bold text-gray-500">{idx + 1}</span>
                                ) : (
                                    <Lock className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                                )}
                            </div>
                            
                            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm transition-all hover:shadow-md">
                                <div className="flex items-start justify-between gap-4 mb-2">
                                    <h4 className={`font-bold text-base ${isUnlocked ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}`}>
                                        {course.title}
                                    </h4>
                                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 shrink-0 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                        {course.level}
                                    </span>
                                </div>
                                <p className={`text-sm line-clamp-2 mb-4 ${isUnlocked ? 'text-gray-500' : 'text-gray-400/50'}`}>
                                    {course.description || "No description provided."}
                                </p>
                                
                                {isUnlocked ? (
                                    <div className="flex justify-end">
                                        <Link 
                                            to={`/courses/${course.slug || course.id}`}
                                            className={`text-sm font-bold flex items-center gap-1 transition-colors ${
                                                course.isCompleted ? 'text-green-600 hover:text-green-700' : 'text-[#E97451] hover:text-[#D05D3A]'
                                            }`}
                                        >
                                            {course.isCompleted ? 'Review Course' : course.isEnrolled ? 'Continue' : 'View Details'} 
                                            <span aria-hidden="true">&rarr;</span>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="flex justify-end">
                                        <span className="text-sm font-medium text-gray-400 flex items-center gap-1">
                                            <Lock className="w-3 h-3" /> Complete previous course
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
