import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Plus, Edit2, Trash2, Video, FileText, Code, Save, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ModuleManagement({ courseId }) {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [currentModule, setCurrentModule] = useState(null);

    const [form, setForm] = useState({
        title: '',
        contentType: 'TEXT',
        body: '',
        durationS: 0,
        videoFile: null,
        videoUrl: '',
        transcript: ''
    });

    const { data: modules, isLoading } = useQuery({
        queryKey: ['modules', courseId],
        queryFn: async () => {
            const res = await api.get(`/courses/${courseId}/modules`);
            return res.data;
        }
    });

    const saveMutation = useMutation({
        mutationFn: async (payload) => {
            if (currentModule) {
                return api.put(`/courses/${courseId}/modules/${currentModule.id}`, payload);
            }
            return api.post(`/courses/${courseId}/modules`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['modules', courseId]);
            toast.success(currentModule ? 'Module updated' : 'Module created');
            setIsEditing(false);
            setCurrentModule(null);
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Failed to save module');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return api.delete(`/courses/${courseId}/modules/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['modules', courseId]);
            toast.success('Module deleted');
        }
    });

    const handleEdit = (mod) => {
        setCurrentModule(mod);
        let parsedVideoUrl = '';
        let parsedTranscript = '';
        let parsedBody = mod.body;

        if (mod.contentType === 'VIDEO') {
            try {
                const parsed = JSON.parse(mod.body);
                parsedVideoUrl = parsed.url || mod.body;
                parsedTranscript = parsed.transcript || '';
            } catch (e) {
                parsedVideoUrl = mod.body;
            }
        }

        setForm({
            title: mod.title,
            contentType: mod.contentType,
            body: mod.contentType === 'VIDEO' ? '' : parsedBody,
            durationS: mod.durationS,
            videoFile: null,
            videoUrl: parsedVideoUrl,
            transcript: parsedTranscript
        });
        setIsEditing(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let finalBody = form.body;
        
        if (form.contentType === 'VIDEO') {
            let uploadedUrl = form.videoUrl;
            
            if (form.videoFile) {
                const formData = new FormData();
                formData.append('file', form.videoFile);
                try {
                    const res = await api.post('/upload/video', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    uploadedUrl = res.data.url;
                } catch (err) {
                    toast.error('Failed to upload video');
                    return;
                }
            }

            if (!uploadedUrl) {
                toast.error('Please provide a video URL or upload a file');
                return;
            }

            finalBody = JSON.stringify({ url: uploadedUrl, transcript: form.transcript });
        }

        saveMutation.mutate({
            courseId,
            title: form.title,
            contentType: form.contentType,
            body: finalBody,
            order: currentModule ? currentModule.order : (modules?.length || 0) + 1,
            durationS: parseInt(form.durationS) || 0
        });
    };

    if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#E97451]" /></div>;

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Course Modules</h2>
                {!isEditing && (
                    <button 
                        onClick={() => {
                            setCurrentModule(null);
                            setForm({ title: '', contentType: 'TEXT', body: '', durationS: 0, videoFile: null, videoUrl: '', transcript: '' });
                            setIsEditing(true);
                        }}
                        className="flex items-center gap-2 bg-[#E97451] hover:bg-[#D05D3A] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Module
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{currentModule ? 'Edit Module' : 'New Module'}</h3>
                        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Module Title</label>
                                <input
                                    type="text" required
                                    value={form.title}
                                    onChange={e => setForm({...form, title: e.target.value})}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-[#E97451] outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duration (seconds)</label>
                                <input
                                    type="number" min="0" required
                                    value={form.durationS}
                                    onChange={e => setForm({...form, durationS: e.target.value})}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-[#E97451] outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Content Type</label>
                            <div className="flex gap-4">
                                {['VIDEO', 'TEXT', 'CODE'].map(type => (
                                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio" name="contentType" value={type}
                                            checked={form.contentType === type}
                                            onChange={e => setForm({...form, contentType: e.target.value})}
                                            className="text-[#E97451] focus:ring-[#E97451]"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {form.contentType === 'VIDEO' ? (
                            <div className="space-y-4 border border-gray-100 dark:border-gray-800 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Video Upload</label>
                                    <input
                                        type="file" accept="video/*"
                                        onChange={e => setForm({...form, videoFile: e.target.files[0]})}
                                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#E97451] file:text-white hover:file:bg-[#D05D3A]"
                                    />
                                    {form.videoUrl && !form.videoFile && <p className="text-xs text-gray-500 mt-2">Current Video URL: {form.videoUrl}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Transcript (For AI Q&A)</label>
                                    <textarea
                                        rows={4}
                                        value={form.transcript}
                                        onChange={e => setForm({...form, transcript: e.target.value})}
                                        placeholder="Paste the video transcript here for AI ingestion..."
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-[#E97451] outline-none"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Content Body</label>
                                <textarea
                                    rows={8} required
                                    value={form.body}
                                    onChange={e => setForm({...form, body: e.target.value})}
                                    placeholder={form.contentType === 'CODE' ? 'Write code here...' : 'Write text content here...'}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-[#E97451] outline-none font-mono"
                                />
                            </div>
                        )}

                        <div className="flex justify-end pt-4">
                            <button
                                type="submit" disabled={saveMutation.isLoading}
                                className="flex items-center gap-2 bg-[#E97451] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#D05D3A] disabled:opacity-50"
                            >
                                {saveMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Module
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="space-y-3">
                    {modules?.length === 0 ? (
                        <div className="text-center py-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                            <p className="text-gray-500">No modules yet. Add one to get started!</p>
                        </div>
                    ) : (
                        modules?.map((mod, index) => (
                            <div key={mod.id} className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm hover:border-[#E97451]/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="text-gray-400 font-medium w-6 text-center">{index + 1}</div>
                                    <div className="bg-[#FFF0E8] dark:bg-[#8A3324]/30 p-2 rounded-lg text-[#E97451] dark:text-[#FF855C]">
                                        {mod.contentType === 'VIDEO' ? <Video className="w-5 h-5" /> : mod.contentType === 'CODE' ? <Code className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{mod.title}</h4>
                                        <div className="text-xs text-gray-500 flex gap-3">
                                            <span>{Math.round(mod.durationS / 60)} mins</span>
                                            <span>•</span>
                                            <span className="uppercase tracking-wider">{mod.contentType}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleEdit(mod)}
                                        className="p-2 text-gray-500 hover:text-[#E97451] hover:bg-[#FFF0E8] dark:hover:bg-[#8A3324]/30 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (window.confirm("Are you sure you want to delete this module?")) {
                                                deleteMutation.mutate(mod.id);
                                            }
                                        }}
                                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
