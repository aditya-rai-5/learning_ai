import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Save, Loader2, Link as LinkIcon, Trash2, Plus, Settings, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function AiSettingsManager({ courseId }) {
    const queryClient = useQueryClient();

    // ─── AI Config State & Queries ───
    const [configForm, setConfigForm] = useState({
        modelId: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        topK: 5,
        systemPrompt: ''
    });

    const { data: aiConfig, isLoading: configLoading } = useQuery({
        queryKey: ['ai-config', courseId],
        queryFn: async () => {
            const res = await api.get(`/courses/${courseId}/ai-config`);
            return res.data;
        }
    });

    useEffect(() => {
        if (aiConfig && Object.keys(aiConfig).length > 0) {
            setConfigForm({
                modelId: aiConfig.modelId || 'llama-3.3-70b-versatile',
                temperature: aiConfig.temperature ?? 0.3,
                topK: aiConfig.topK ?? 5,
                systemPrompt: aiConfig.systemPrompt || ''
            });
        }
    }, [aiConfig]);

    const saveConfigMutation = useMutation({
        mutationFn: async (payload) => {
            return api.post(`/courses/${courseId}/ai-config`, payload);
        },
        onSuccess: () => {
            toast.success('AI Configuration saved successfully!');
            queryClient.invalidateQueries(['ai-config', courseId]);
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Failed to save AI configuration');
        }
    });

    const handleSaveConfig = (e) => {
        e.preventDefault();
        saveConfigMutation.mutate(configForm);
    };

    // ─── Document Sources State & Queries ───
    const [sourceForm, setSourceForm] = useState({ title: '', sourceUrl: '' });

    const { data: sources, isLoading: sourcesLoading } = useQuery({
        queryKey: ['document-sources', courseId],
        queryFn: async () => {
            const res = await api.get(`/courses/${courseId}/document-sources`);
            return res.data;
        }
    });

    const addSourceMutation = useMutation({
        mutationFn: async (payload) => {
            return api.post(`/courses/${courseId}/document-sources`, payload);
        },
        onSuccess: () => {
            toast.success('Document source added!');
            setSourceForm({ title: '', sourceUrl: '' });
            queryClient.invalidateQueries(['document-sources', courseId]);
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Failed to add document source');
        }
    });

    const deleteSourceMutation = useMutation({
        mutationFn: async (sourceId) => {
            return api.delete(`/courses/${courseId}/document-sources/${sourceId}`);
        },
        onSuccess: () => {
            toast.success('Document source removed!');
            queryClient.invalidateQueries(['document-sources', courseId]);
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Failed to delete document source');
        }
    });

    const handleAddSource = (e) => {
        e.preventDefault();
        addSourceMutation.mutate(sourceForm);
    };

    if (configLoading) {
        return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#E97451]" /></div>;
    }

    return (
        <div className="mt-8 space-y-8">
            {/* AI Configuration Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-[#FFF0E8] dark:bg-[#8A3324]/30 p-2 rounded-lg text-[#E97451] dark:text-[#FF855C]">
                        <Settings className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Assistant Configuration</h2>
                </div>
                
                <form onSubmit={handleSaveConfig} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Model</label>
                            <select
                                value={configForm.modelId}
                                onChange={e => setConfigForm({...configForm, modelId: e.target.value})}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none"
                            >
                                <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                                <option value="llama3-8b-8192">Llama 3 8B</option>
                                <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Temperature</label>
                            <input
                                type="number" step="0.1" min="0" max="2" required
                                value={configForm.temperature}
                                onChange={e => setConfigForm({...configForm, temperature: parseFloat(e.target.value)})}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Top K (Context Chunks)</label>
                            <input
                                type="number" min="1" max="20" required
                                value={configForm.topK}
                                onChange={e => setConfigForm({...configForm, topK: parseInt(e.target.value)})}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">System Prompt</label>
                        <p className="text-xs text-gray-500 mb-2">Leave blank to use the default tutor prompt. Retrieved context will be injected automatically below this.</p>
                        <textarea
                            rows={4}
                            value={configForm.systemPrompt}
                            onChange={e => setConfigForm({...configForm, systemPrompt: e.target.value})}
                            placeholder="You are an expert tutor..."
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-[#E97451] outline-none"
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit" disabled={saveConfigMutation.isLoading}
                            className="flex items-center gap-2 bg-[#E97451] hover:bg-[#D05D3A] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                        >
                            {saveConfigMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {saveConfigMutation.isLoading ? 'Saving...' : 'Save AI Settings'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Document Sources Section */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Database className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">External Document Sources</h2>
                        <p className="text-sm text-gray-500">Add external URLs to be indexed for the AI Assistant's knowledge base.</p>
                    </div>
                </div>

                <form onSubmit={handleAddSource} className="flex gap-4 items-end mb-8">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Source Title</label>
                        <input
                            type="text" required
                            value={sourceForm.title}
                            onChange={e => setSourceForm({...sourceForm, title: e.target.value})}
                            placeholder="e.g. React Official Docs"
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Source URL</label>
                        <input
                            type="url" required
                            value={sourceForm.sourceUrl}
                            onChange={e => setSourceForm({...sourceForm, sourceUrl: e.target.value})}
                            placeholder="https://..."
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <button
                        type="submit" disabled={addSourceMutation.isLoading}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50 h-[42px]"
                    >
                        {addSourceMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Add
                    </button>
                </form>

                {sourcesLoading ? (
                    <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" /></div>
                ) : sources?.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl">
                        <p className="text-gray-500">No external documents registered.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {sources?.map((source) => (
                            <div key={source.id} className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-xl shadow-sm">
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg text-indigo-500">
                                        <LinkIcon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{source.title}</h4>
                                        <a href={source.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">
                                            {source.sourceUrl}
                                        </a>
                                        <p className="text-xs text-gray-500 mt-1">Status: {source.status} | Chunks: {source.chunkCount}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        if (window.confirm("Delete this document source?")) {
                                            deleteSourceMutation.mutate(source.id);
                                        }
                                    }}
                                    disabled={deleteSourceMutation.isLoading}
                                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
