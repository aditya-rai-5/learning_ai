import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { Plus, Edit2, Trash2, ClipboardList, Save, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AssessmentManagement({ courseId }) {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [currentAssessment, setCurrentAssessment] = useState(null);
    const [expandedAssessmentId, setExpandedAssessmentId] = useState(null);

    const [form, setForm] = useState({
        title: '',
        moduleId: '',
        passScore: 50,
        maxAttempts: 3,
        timeLimitS: 1800 // 30 mins
    });

    // Question form state
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);
    const [qForm, setQForm] = useState({
        type: 'MULTIPLE_CHOICE',
        prompt: '',
        options: ['', '', '', ''],
        answerIndex: 0,
        points: 10
    });

    const { data: modules } = useQuery({
        queryKey: ['modules', courseId],
        queryFn: async () => {
            const res = await api.get(`/courses/${courseId}/modules`);
            return res.data;
        }
    });

    const { data: assessments, isLoading } = useQuery({
        queryKey: ['assessments-instructor', courseId],
        queryFn: async () => {
            const res = await api.get(`/courses/${courseId}/assessments`);
            return res.data;
        }
    });

    // Fetch details (questions) when an assessment is expanded
    const { data: assessmentDetail, isLoading: isLoadingDetail } = useQuery({
        queryKey: ['assessment-detail', expandedAssessmentId],
        queryFn: async () => {
            const res = await api.get(`/assessments/${expandedAssessmentId}/instructor`);
            return res.data;
        },
        enabled: !!expandedAssessmentId
    });

    const saveAssessmentMutation = useMutation({
        mutationFn: async (payload) => {
            if (currentAssessment) {
                return api.put(`/assessments/${currentAssessment.id}`, payload);
            }
            if (payload.moduleId) {
                return api.post(`/courses/${courseId}/modules/${payload.moduleId}/assessments`, payload);
            }
            return api.post(`/courses/${courseId}/assessments`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['assessments-instructor', courseId]);
            toast.success(currentAssessment ? 'Assessment updated' : 'Assessment created');
            setIsEditing(false);
            setCurrentAssessment(null);
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to save assessment')
    });

    const deleteAssessmentMutation = useMutation({
        mutationFn: async (id) => api.delete(`/assessments/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['assessments-instructor', courseId]);
            toast.success('Assessment deleted');
            if (expandedAssessmentId) setExpandedAssessmentId(null);
        }
    });

    const addQuestionMutation = useMutation({
        mutationFn: async (payload) => api.post(`/assessments/${expandedAssessmentId}/questions`, payload),
        onSuccess: () => {
            queryClient.invalidateQueries(['assessment-detail', expandedAssessmentId]);
            queryClient.invalidateQueries(['assessments-instructor', courseId]);
            toast.success('Question added');
            setIsAddingQuestion(false);
            setQForm({ type: 'MULTIPLE_CHOICE', prompt: '', options: ['', '', '', ''], answerIndex: 0, points: 10 });
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to add question')
    });

    const deleteQuestionMutation = useMutation({
        mutationFn: async (id) => api.delete(`/questions/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['assessment-detail', expandedAssessmentId]);
            queryClient.invalidateQueries(['assessments-instructor', courseId]);
            toast.success('Question deleted');
        }
    });

    const handleEditAssessment = (assessment) => {
        setCurrentAssessment(assessment);
        setForm({
            title: assessment.title,
            moduleId: assessment.moduleId || '',
            passScore: assessment.passScore,
            maxAttempts: assessment.maxAttempts,
            timeLimitS: assessment.timeLimitS
        });
        setIsEditing(true);
    };

    const handleSaveAssessment = (e) => {
        e.preventDefault();
        saveAssessmentMutation.mutate({
            title: form.title,
            moduleId: form.moduleId || null,
            passScore: parseInt(form.passScore),
            maxAttempts: parseInt(form.maxAttempts),
            timeLimitS: parseInt(form.timeLimitS)
        });
    };

    const handleAddQuestion = (e) => {
        e.preventDefault();
        if (qForm.options.some(opt => !opt.trim())) {
            toast.error("Please fill in all options");
            return;
        }
        addQuestionMutation.mutate({
            type: qForm.type,
            prompt: qForm.prompt,
            optionsJson: qForm.options,
            answerKey: qForm.options[qForm.answerIndex],
            points: parseInt(qForm.points)
        });
    };

    if (isLoading) return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#E97451]" /></div>;

    return (
        <div className="mt-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-[#E97451]" />
                        Course Assessments
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Create quizzes and exams to test student knowledge.</p>
                </div>
                {!isEditing && (
                    <button 
                        onClick={() => {
                            setCurrentAssessment(null);
                            setForm({ title: '', moduleId: '', passScore: 50, maxAttempts: 3, timeLimitS: 1800 });
                            setIsEditing(true);
                        }}
                        className="flex items-center gap-2 bg-[#E97451] hover:bg-[#D05D3A] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" /> Add Assessment
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{currentAssessment ? 'Edit Assessment' : 'New Assessment'}</h3>
                        <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSaveAssessment} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Assessment Title</label>
                                <input type="text" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-[#E97451] outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Link to Module (Optional)</label>
                                <select value={form.moduleId} onChange={e => setForm({...form, moduleId: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-[#E97451] outline-none">
                                    <option value="">General Course Assessment</option>
                                    {modules?.map(m => (
                                        <option key={m.id} value={m.id}>{m.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Passing Score</label>
                                <input type="number" min="1" required value={form.passScore} onChange={e => setForm({...form, passScore: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-[#E97451] outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Max Attempts</label>
                                <input type="number" min="1" required value={form.maxAttempts} onChange={e => setForm({...form, maxAttempts: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-[#E97451] outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Time Limit (seconds)</label>
                                <input type="number" min="60" step="60" required value={form.timeLimitS} onChange={e => setForm({...form, timeLimitS: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-[#E97451] outline-none" />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button type="submit" disabled={saveAssessmentMutation.isLoading} className="flex items-center gap-2 bg-[#E97451] text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#D05D3A]">
                                {saveAssessmentMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Save Assessment
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            <div className="space-y-4">
                {assessments?.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/20 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <p className="text-gray-500">No assessments created yet.</p>
                    </div>
                ) : (
                    assessments?.map((assessment) => (
                        <div key={assessment.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 flex items-center justify-between">
                                <div className="flex-1 cursor-pointer" onClick={() => setExpandedAssessmentId(expandedAssessmentId === assessment.id ? null : assessment.id)}>
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-bold text-gray-900 dark:text-white">{assessment.title}</h4>
                                        {expandedAssessmentId === assessment.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                    </div>
                                    <div className="text-xs text-gray-500 flex gap-3 mt-1">
                                        <span>{assessment._count?.questions || 0} Questions</span>
                                        <span>Pass: {assessment.passScore}</span>
                                        <span>Time: {Math.round(assessment.timeLimitS / 60)}m</span>
                                        {assessment.moduleId && <span className="text-[#E97451]">Linked to Module</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleEditAssessment(assessment)} className="p-2 text-gray-500 hover:text-[#E97451] rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                    <button 
                                        onClick={() => { if(window.confirm("Delete assessment?")) deleteAssessmentMutation.mutate(assessment.id); }} 
                                        className="p-2 text-gray-500 hover:text-red-500 rounded-lg transition-colors"
                                    ><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            {expandedAssessmentId === assessment.id && (
                                <div className="p-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between mb-4">
                                        <h5 className="font-bold text-sm text-gray-700 dark:text-gray-300">Questions</h5>
                                        {!isAddingQuestion && (
                                            <button onClick={() => setIsAddingQuestion(true)} className="text-sm text-[#E97451] font-bold flex items-center gap-1 hover:text-[#D05D3A]">
                                                <Plus className="w-4 h-4" /> Add Question
                                            </button>
                                        )}
                                    </div>

                                    {isAddingQuestion && (
                                        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg mb-6">
                                            <form onSubmit={handleAddQuestion} className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 mb-1">Question Prompt</label>
                                                    <textarea required value={qForm.prompt} onChange={e => setQForm({...qForm, prompt: e.target.value})} rows={2} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-[#E97451] outline-none" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    {qForm.options.map((opt, idx) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <input type="radio" name="correctAnswer" checked={qForm.answerIndex === idx} onChange={() => setQForm({...qForm, answerIndex: idx})} className="text-[#E97451] focus:ring-[#E97451]" />
                                                            <input required type="text" value={opt} onChange={e => { const newOpts = [...qForm.options]; newOpts[idx] = e.target.value; setQForm({...qForm, options: newOpts}) }} placeholder={`Option ${idx + 1}`} className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-[#E97451]" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <label className="text-xs font-bold text-gray-500">Points</label>
                                                        <input type="number" min="1" value={qForm.points} onChange={e => setQForm({...qForm, points: e.target.value})} className="w-20 px-2 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-sm outline-none" />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button type="button" onClick={() => setIsAddingQuestion(false)} className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">Cancel</button>
                                                        <button type="submit" disabled={addQuestionMutation.isLoading} className="bg-[#E97451] text-white px-4 py-1.5 rounded text-sm font-bold disabled:opacity-50 hover:bg-[#D05D3A]">Save Question</button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {isLoadingDetail ? (
                                        <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
                                    ) : (
                                        <div className="space-y-3">
                                            {assessmentDetail?.questions?.length === 0 ? (
                                                <p className="text-sm text-gray-500 text-center py-4">No questions added yet.</p>
                                            ) : (
                                                assessmentDetail?.questions?.map((q, idx) => (
                                                    <div key={q.id} className="border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded p-4 relative group">
                                                        <button 
                                                            onClick={() => { if(window.confirm("Delete question?")) deleteQuestionMutation.mutate(q.id); }}
                                                            className="absolute top-2 right-2 p-1.5 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-red-50 dark:bg-red-900/20 rounded"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                                                            <span className="text-gray-400 mr-2">{idx + 1}.</span>{q.prompt}
                                                            <span className="ml-2 text-xs font-normal text-gray-500">({q.points} pts)</span>
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-2 pl-6">
                                                            {q.optionsJson.map((opt, i) => (
                                                                <div key={i} className={`text-xs p-2 rounded border ${opt === q.answerKey ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' : 'bg-gray-50 border-gray-100 text-gray-600 dark:bg-gray-800/50 dark:border-gray-800 dark:text-gray-400'}`}>
                                                                    {opt === q.answerKey && <span className="font-bold mr-1">✓</span>}
                                                                    {opt}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
