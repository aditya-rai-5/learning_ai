import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { GitBranch, Loader2, BookOpen } from 'lucide-react';

export default function LearningPaths() {
    const { data: paths, isLoading, error } = useQuery({
        queryKey: ['learning-paths'],
        queryFn: async () => {
            const res = await api.get('/learning-paths');
            return res.data;
        }
    });

    if (isLoading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#E97451]" /></div>;
    if (error) return <div className="p-8 text-red-500 text-center">Failed to load learning paths.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <GitBranch className="w-6 h-6 text-[#E97451]" />
                    Learning Paths
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Curated sequences of courses to help you master specific skills.</p>
            </div>

            {paths?.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
                    <GitBranch className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No paths available</h3>
                    <p className="text-gray-500 dark:text-gray-400">Check back later for new learning paths.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paths?.map((path) => (
                        <Link 
                            key={path.id} 
                            to={`/learning-paths/${path.id}`}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-[#E97451]/50 transition-all group flex flex-col"
                        >
                            <div className="h-32 bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-950 dark:to-black relative p-6 flex items-end">
                                <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md px-2 py-1 rounded text-xs text-white font-bold flex items-center gap-1">
                                    <BookOpen className="w-3 h-3" />
                                    {path.courses.length} Courses
                                </div>
                                <h3 className="font-bold text-xl text-white line-clamp-2">{path.title}</h3>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{path.description}</p>
                                
                                <div className="mt-auto">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {path.tags?.slice(0, 3).map((tag, i) => (
                                            <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-md">
                                                {tag}
                                            </span>
                                        ))}
                                        {path.tags?.length > 3 && (
                                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-md">
                                                +{path.tags.length - 3}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[#E97451] text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all">
                                        View Path <span aria-hidden="true">&rarr;</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
