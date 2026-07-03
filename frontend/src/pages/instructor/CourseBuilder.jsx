import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ModuleManagement from './ModuleManagement';
import AssessmentManagement from './AssessmentManagement';
import AiSettingsManager from './AiSettingsManager';

export default function CourseBuilder() {
    const { courseId } = useParams();
    const isNew = !courseId || courseId === 'new';
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isUploading, setIsUploading] = useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        level: 'BEGINNER',
        price: 0,
        thumbnailUrl: '',
        tags: '',
        learningOutcomes: '',
        initialModuleTitle: '',
        initialModuleDurationS: 0,
        initialModuleType: 'TEXT',
        initialModuleVideoUrl: '',
        initialModuleTranscript: '',
        initialModuleBody: ''
    });

    const { data: course, isLoading } = useQuery({
        queryKey: ['instructor-course', courseId],
        queryFn: async () => {
            if (isNew) return null;
            const res = await api.get(`/courses/${courseId}`);
            return res.data;
        },
        enabled: !isNew
    });

    useEffect(() => {
        if (course && !isNew) {
            setForm({
                title: course.title || '',
                description: course.description || '',
                level: course.level || 'BEGINNER',
                price: course.price || 0,
                thumbnailUrl: course.thumbnailUrl || '',
                tags: course.tags?.map(t => t.tag.name).join(', ') || '',
                learningOutcomes: course.learningOutcomes?.join('\n') || ''
            });
        }
    }, [course, isNew]);

    const saveMutation = useMutation({
        mutationFn: async (data) => {
            const payload = {
                ...data,
                tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
                learningOutcomes: data.learningOutcomes.split('\n').map(o => o.trim()).filter(Boolean)
            };

            if (isNew) {
                payload.initialModule = {
                    title: data.initialModuleTitle,
                    contentType: data.initialModuleType,
                    body: data.finalBody,
                    durationS: parseInt(data.initialModuleDurationS) || 0
                };
                return api.post('/courses', payload);
            } else {
                delete payload.initialModuleTitle;
                delete payload.initialModuleType;
                delete payload.initialModuleBody;
                delete payload.initialModuleVideoFile;
                delete payload.initialModuleVideoUrl;
                delete payload.initialModuleTranscript;
                delete payload.initialModuleDurationS;
                delete payload.finalBody;
                return api.put(`/courses/${courseId}`, payload);
            }
        },
        onSuccess: (res) => {
            toast.success(isNew ? 'Course created!' : 'Course updated!');
            queryClient.invalidateQueries(['instructor-courses']);
            if (isNew) {
                navigate(`/instructor/courses/${res.data.course.id}/edit`, { replace: true });
            } else {
                queryClient.invalidateQueries(['instructor-course', courseId]);
            }
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Failed to save course');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            return api.delete(`/courses/${courseId}`);
        },
        onSuccess: () => {
            toast.success('Course deleted');
            queryClient.invalidateQueries(['instructor-courses']);
            navigate('/instructor/courses');
        }
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let finalBody = form.initialModuleBody;

        if (isNew && form.initialModuleType === 'VIDEO') {
            let uploadedUrl = form.initialModuleVideoUrl;
            
            if (form.initialModuleVideoFile) {
                setIsUploading(true);
                const formData = new FormData();
                formData.append('file', form.initialModuleVideoFile);
                try {
                    const res = await api.post('/upload/video', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    uploadedUrl = res.data.url;
                } catch (err) {
                    toast.error('Failed to upload video');
                    setIsUploading(false);
                    return;
                }
                setIsUploading(false);
            }

            if (!uploadedUrl) {
                toast.error('Please provide a video URL or upload a file');
                return;
            }

            finalBody = JSON.stringify({ url: uploadedUrl, transcript: form.initialModuleTranscript });
        }

        saveMutation.mutate({ ...form, finalBody });
    };

    if (isLoading && !isNew) return <div className="p-12 text-center text-gray-500">Loading course details...</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 pb-24">
            <div className="flex items-center justify-between mb-8">
                <button 
                    onClick={() => navigate('/instructor/courses')}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Courses
                </button>
                {!isNew && (
                    <button 
                        onClick={() => {
                            if (window.confirm("Are you sure you want to delete this course? This cannot be undone.")) {
                                deleteMutation.mutate();
                            }
                        }}
                        className="flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> Delete Course
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    {isNew ? 'Create New Course' : 'Edit Course Details'}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Course Title</label>
                        <input
                            type="text" required
                            value={form.title}
                            onChange={e => setForm({...form, title: e.target.value})}
                            placeholder="e.g. Advanced Machine Learning"
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                        <textarea
                            required rows={4}
                            value={form.description}
                            onChange={e => setForm({...form, description: e.target.value})}
                            placeholder="Describe what students will learn..."
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Difficulty Level</label>
                            <select
                                value={form.level}
                                onChange={e => setForm({...form, level: e.target.value})}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none"
                            >
                                <option value="BEGINNER">Beginner</option>
                                <option value="INTERMEDIATE">Intermediate</option>
                                <option value="ADVANCED">Advanced</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price (USD)</label>
                            <input
                                type="number" step="0.01" min="0" required
                                value={form.price}
                                onChange={e => setForm({...form, price: e.target.value})}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thumbnail URL (Optional)</label>
                        <input
                            type="url"
                            value={form.thumbnailUrl}
                            onChange={e => setForm({...form, thumbnailUrl: e.target.value})}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tags (comma separated)</label>
                        <input
                            type="text"
                            value={form.tags}
                            onChange={e => setForm({...form, tags: e.target.value})}
                            placeholder="python, AI, data science"
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Learning Outcomes (one per line)</label>
                        <textarea
                            rows={4}
                            value={form.learningOutcomes}
                            onChange={e => setForm({...form, learningOutcomes: e.target.value})}
                            placeholder="Build a neural network&#10;Understand gradient descent"
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none"
                        />
                    </div>

                    {isNew && (
                        <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">First Module (Required)</h2>
                            <p className="text-sm text-gray-500 mb-6">Every course must have at least one module to get started. You can add more later.</p>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Module Title</label>
                                        <input
                                            type="text" required
                                            value={form.initialModuleTitle}
                                            onChange={e => setForm({...form, initialModuleTitle: e.target.value})}
                                            placeholder="e.g. Introduction"
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duration (seconds)</label>
                                        <input
                                            type="number" min="0" required
                                            value={form.initialModuleDurationS}
                                            onChange={e => setForm({...form, initialModuleDurationS: e.target.value})}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Content Type</label>
                                    <select
                                        value={form.initialModuleType}
                                        onChange={e => setForm({...form, initialModuleType: e.target.value})}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none"
                                    >
                                        <option value="TEXT">Text</option>
                                        <option value="VIDEO">Video</option>
                                        <option value="CODE">Code</option>
                                    </select>
                                </div>
                                
                                {form.initialModuleType === 'VIDEO' ? (
                                    <div className="space-y-4 border border-gray-100 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Video Upload</label>
                                            <input
                                                type="file" accept="video/*"
                                                onChange={e => setForm({...form, initialModuleVideoFile: e.target.files[0]})}
                                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#E97451] file:text-white hover:file:bg-[#D05D3A]"
                                            />
                                            {form.initialModuleVideoUrl && !form.initialModuleVideoFile && <p className="text-xs text-gray-500 mt-2">Current Video URL: {form.initialModuleVideoUrl}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Transcript (For AI Q&A)</label>
                                            <textarea
                                                rows={4}
                                                value={form.initialModuleTranscript}
                                                onChange={e => setForm({...form, initialModuleTranscript: e.target.value})}
                                                placeholder="Paste the video transcript here for AI ingestion..."
                                                className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Content Body</label>
                                        <textarea
                                            required rows={4}
                                            value={form.initialModuleBody}
                                            onChange={e => setForm({...form, initialModuleBody: e.target.value})}
                                            placeholder={form.initialModuleType === 'CODE' ? 'Write code here...' : 'Write text content here...'}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none font-mono"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end border-t border-gray-100 dark:border-gray-800 pt-6">
                        <button
                            type="submit"
                            disabled={saveMutation.isLoading || isUploading}
                            className="flex items-center gap-2 bg-[#E97451] hover:bg-[#D05D3A] text-white px-8 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
                        >
                            {(saveMutation.isLoading || isUploading) ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {(saveMutation.isLoading || isUploading) ? (isUploading ? 'Uploading Video...' : 'Saving Course...') : 'Save Course Details'}
                        </button>
                    </div>
                </form>
            </div>
            
            {!isNew && (
                <div className="space-y-12">
                    <ModuleManagement courseId={courseId} />
                    <AssessmentManagement courseId={courseId} />
                    <AiSettingsManager courseId={courseId} />
                </div>
            )}
        </div>
    );
}
