import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { Save, ArrowLeft, ArrowUp, ArrowDown, Plus, X, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LearningPathBuilder() {
    const { pathId } = useParams()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const isEdit = !!pathId

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        accentColor: '#E97451',
        tags: []
    })
    const [tagInput, setTagInput] = useState('')
    
    // Store selected courses as { courseId, title, order }
    const [selectedCourses, setSelectedCourses] = useState([])
    const [courseSearch, setCourseSearch] = useState('')

    // Fetch path data if edit mode
    const { data: pathData, isLoading: isLoadingPath } = useQuery({
        queryKey: ['learning-path', pathId],
        queryFn: async () => {
            const res = await api.get(`/learning-paths/${pathId}`)
            return res.data
        },
        enabled: isEdit
    })

    // Fetch instructor's courses
    const { data: availableCourses, isLoading: isLoadingCourses } = useQuery({
        queryKey: ['instructor-courses'],
        queryFn: async () => {
            const res = await api.get('/instructor/courses')
            return res.data
        }
    })

    useEffect(() => {
        if (isEdit && pathData) {
            setFormData({
                title: pathData.title || '',
                description: pathData.description || '',
                accentColor: pathData.accentColor || '#E97451',
                tags: pathData.tags || []
            })
            if (pathData.courses) {
                setSelectedCourses(pathData.courses.map(c => ({
                    courseId: c.course.id,
                    title: c.course.title,
                    order: c.order
                })))
            }
        }
    }, [pathData, isEdit])

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            if (isEdit) {
                await api.put(`/learning-paths/${pathId}`, data)
            } else {
                await api.post('/learning-paths', data)
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['instructor-learning-paths'])
            toast.success(`Learning path ${isEdit ? 'updated' : 'created'} successfully!`)
            navigate('/instructor/learning-paths')
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Failed to save learning path")
        }
    })

    const handleSave = () => {
        if (!formData.title) {
            toast.error("Title is required")
            return
        }

        const coursesToSave = selectedCourses.map((c, idx) => ({
            courseId: c.courseId,
            order: idx + 1
        }))

        saveMutation.mutate({
            ...formData,
            courses: coursesToSave
        })
    }

    const addTag = () => {
        if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim().toLowerCase()] }))
            setTagInput('')
        }
    }

    const removeTag = (tagToRemove) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }))
    }

    const handleAddCourse = (course) => {
        if (selectedCourses.find(c => c.courseId === course.id)) return
        setSelectedCourses(prev => [...prev, { courseId: course.id, title: course.title, order: prev.length + 1 }])
        setCourseSearch('')
    }

    const handleRemoveCourse = (courseId) => {
        setSelectedCourses(prev => prev.filter(c => c.courseId !== courseId))
    }

    const moveCourse = (index, direction) => {
        if (direction === -1 && index === 0) return
        if (direction === 1 && index === selectedCourses.length - 1) return

        const newArr = [...selectedCourses]
        const temp = newArr[index]
        newArr[index] = newArr[index + direction]
        newArr[index + direction] = temp
        setSelectedCourses(newArr)
    }

    const unselectedCourses = availableCourses?.filter(c => !selectedCourses.find(sc => sc.courseId === c.id))
    const filteredUnselected = unselectedCourses?.filter(c => c.title.toLowerCase().includes(courseSearch.toLowerCase()))

    if ((isEdit && isLoadingPath) || isLoadingCourses) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#E97451]" />
            </div>
        )
    }

    return (
        <div className="p-8 max-w-5xl mx-auto pb-24">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate('/instructor/learning-paths')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {isEdit ? 'Edit Learning Path' : 'Create Learning Path'}
                    </h1>
                </div>
                <div className="ml-auto">
                    <button
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                        className="flex items-center gap-2 bg-[#E97451] hover:bg-[#FF855C] text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Save Path
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Path Details</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#E97451] focus:border-transparent dark:text-white"
                                    placeholder="e.g., Full Stack Developer Track"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full h-32 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#E97451] focus:border-transparent dark:text-white resize-none"
                                    placeholder="What will students learn in this path?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Accent Color</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={formData.accentColor}
                                        onChange={(e) => setFormData(prev => ({ ...prev, accentColor: e.target.value }))}
                                        className="h-10 w-14 rounded cursor-pointer border-0 p-0"
                                    />
                                    <span className="text-sm text-gray-500 uppercase">{formData.accentColor}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                                        className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#E97451] dark:text-white"
                                        placeholder="Add a tag..."
                                    />
                                    <button
                                        type="button"
                                        onClick={addTag}
                                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.tags.map(tag => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FFF0E8] text-[#E97451] dark:bg-orange-900/20">
                                            {tag}
                                            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Courses */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Curriculum Sequence</h2>
                        
                        {selectedCourses.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                                <p className="text-gray-500 dark:text-gray-400">No courses added yet. Search and add courses from below.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedCourses.map((course, index) => (
                                    <div key={course.courseId} className="flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-sm">
                                        <div className="flex flex-col gap-1">
                                            <button 
                                                onClick={() => moveCourse(index, -1)}
                                                disabled={index === 0}
                                                className="text-gray-400 hover:text-[#E97451] disabled:opacity-30 disabled:hover:text-gray-400"
                                            >
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => moveCourse(index, 1)}
                                                disabled={index === selectedCourses.length - 1}
                                                className="text-gray-400 hover:text-[#E97451] disabled:opacity-30 disabled:hover:text-gray-400"
                                            >
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="w-8 h-8 shrink-0 bg-[#FFF0E8] dark:bg-gray-700 text-[#E97451] rounded-full flex items-center justify-center font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 dark:text-white truncate">{course.title}</h4>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveCourse(course.courseId)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors shrink-0"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Courses</h2>
                        
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search your published courses..."
                                value={courseSearch}
                                onChange={(e) => setCourseSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-[#E97451] dark:text-white"
                            />
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {filteredUnselected?.length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">No matching courses found.</p>
                            ) : (
                                filteredUnselected?.map(course => (
                                    <div key={course.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-lg hover:border-[#E97451] dark:hover:border-[#E97451] transition-colors group cursor-pointer" onClick={() => handleAddCourse(course)}>
                                        <div className="flex-1 min-w-0 mr-4">
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm truncate">{course.title}</h4>
                                        </div>
                                        <button className="text-[#E97451] opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
