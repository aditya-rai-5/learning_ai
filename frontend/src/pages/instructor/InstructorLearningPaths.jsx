import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { PlusCircle, Search, Edit2, Trash2, Map, BookOpen, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function InstructorLearningPaths() {
    const [searchQuery, setSearchQuery] = useState('')
    const queryClient = useQueryClient()

    const { data: paths, isLoading } = useQuery({
        queryKey: ['instructor-learning-paths'],
        queryFn: async () => {
            const res = await api.get('/instructor/learning-paths')
            return res.data
        }
    })

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            await api.delete(`/learning-paths/${id}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['instructor-learning-paths'])
            toast.success("Learning path deleted successfully")
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Failed to delete learning path")
        }
    })

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this learning path?")) {
            deleteMutation.mutate(id)
        }
    }

    const filteredPaths = paths?.filter(p => p.title.toLowerCase().includes(searchQuery.toLowerCase()))

    if (isLoading) {
        return (
            <div className="p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E97451]" />
            </div>
        )
    }

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Map className="w-8 h-8 text-[#E97451]" />
                        Learning Paths
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        Create structured curriculums by grouping multiple courses together
                    </p>
                </div>
                <Link
                    to="/instructor/learning-paths/new"
                    className="flex items-center gap-2 bg-[#E97451] hover:bg-[#FF855C] text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <PlusCircle className="w-5 h-5" />
                    Create Path
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm mb-6 p-4 flex items-center gap-4">
                <Search className="w-5 h-5 text-gray-400 ml-2 shrink-0" />
                <input
                    type="text"
                    placeholder="Search your learning paths..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400"
                />
            </div>

            {filteredPaths?.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-12 text-center shadow-sm">
                    <Map className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No learning paths found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                        Create your first learning path to guide students through a structured series of courses.
                    </p>
                    <Link
                        to="/instructor/learning-paths/new"
                        className="inline-flex items-center gap-2 text-[#E97451] hover:text-[#FF855C] font-medium"
                    >
                        <PlusCircle className="w-5 h-5" />
                        Create Learning Path
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPaths?.map((path) => (
                        <div key={path.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition-all group flex flex-col">
                            <div className="h-3 w-full" style={{ backgroundColor: path.accentColor || '#E97451' }} />
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 line-clamp-2">
                                    {path.title}
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-3 flex-1">
                                    {path.description || "No description provided"}
                                </p>
                                
                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4" />
                                        <span>{path.courses?.length || 0} Courses</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4" />
                                        <span>{path._count?.enrollments || 0} Enrolled</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <Link
                                        to={`/instructor/learning-paths/${path.id}/edit`}
                                        className="flex-1 flex items-center justify-center gap-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 rounded-lg transition-colors font-medium text-sm"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                        Edit Path
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(path.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
