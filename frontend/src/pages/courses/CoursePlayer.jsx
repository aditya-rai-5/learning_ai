import { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import api, { bookmarkApi } from '../../lib/api';
import { 
    CheckCircle2, Circle, Bookmark, PlayCircle, 
    MessageSquare, BookOpen, ClipboardList, Loader2,
    MessageCircle, ThumbsUp, Star, X
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// --- Discussion Tab Component ---

function DiscussionTab({ moduleId, courseId }) {
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadBody, setNewThreadBody] = useState('');
    const [showNewForm, setShowNewForm] = useState(false);
    const queryClient = useQueryClient();

    const { data: threads, isLoading, error } = useQuery({
        queryKey: ['threads', moduleId],
        queryFn: async () => {
            const res = await api.get(`/threads?moduleId=${moduleId}`);
            return res.data;
        },
        enabled: !!moduleId
    });

    const createThreadMutation = useMutation({
        mutationFn: async (newThread) => {
            return api.post('/threads', { ...newThread, moduleId, courseId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['threads', moduleId]);
            setNewThreadTitle('');
            setNewThreadBody('');
            setShowNewForm(false);
            toast.success('Thread created!');
        },
        onError: () => toast.error('Failed to create thread')
    });

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#E97451]" /></div>;
    if (error) return <div className="p-8 text-red-500 text-center">Failed to load discussions.</div>;

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-[#E97451]" />
                    Q&A Discussions
                </h3>
                <button 
                    onClick={() => setShowNewForm(!showNewForm)}
                    className="bg-[#E97451] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#D05D3A] transition-colors"
                >
                    {showNewForm ? 'Cancel' : 'Ask a Question'}
                </button>
            </div>

            {showNewForm && (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 mb-8">
                    <input 
                        type="text"
                        placeholder="Title of your question"
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 mb-3 focus:ring-2 focus:ring-[#E97451] outline-none"
                        value={newThreadTitle}
                        onChange={e => setNewThreadTitle(e.target.value)}
                    />
                    <textarea 
                        placeholder="Describe your question in detail..."
                        rows={4}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 mb-3 focus:ring-2 focus:ring-[#E97451] outline-none"
                        value={newThreadBody}
                        onChange={e => setNewThreadBody(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button 
                            disabled={createThreadMutation.isLoading || !newThreadTitle.trim() || !newThreadBody.trim()}
                            onClick={() => createThreadMutation.mutate({ title: newThreadTitle, body: newThreadBody })}
                            className="bg-[#E97451] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#D05D3A] disabled:opacity-50 transition-colors"
                        >
                            {createThreadMutation.isLoading ? 'Posting...' : 'Post Question'}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {threads?.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No questions yet. Be the first to ask!
                    </div>
                ) : (
                    threads?.map(thread => (
                        <ThreadItem key={thread.id} thread={thread} moduleId={moduleId} />
                    ))
                )}
            </div>
        </div>
    );
}

function ThreadItem({ thread, moduleId }) {
    const [expanded, setExpanded] = useState(false);
    const [replyBody, setReplyBody] = useState('');
    const queryClient = useQueryClient();

    const { data: threadDetail, isLoading: isLoadingDetail } = useQuery({
        queryKey: ['thread', thread.id],
        queryFn: async () => {
            const res = await api.get(`/threads/${thread.id}`);
            return res.data;
        },
        enabled: expanded
    });

    const replyMutation = useMutation({
        mutationFn: async ({ body, parentReplyId }) => {
            return api.post(`/threads/${thread.id}/replies`, { body, parentReplyId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['thread', thread.id]);
            setReplyBody('');
            toast.success('Reply posted!');
        }
    });

    const upvoteMutation = useMutation({
        mutationFn: async (replyId) => {
            return api.post(`/replies/${replyId}/upvote`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['thread', thread.id]);
        }
    });

    // Helper to build nested replies
    const nestedReplies = useMemo(() => {
        if (!threadDetail?.replies) return [];
        const map = {};
        const roots = [];
        threadDetail.replies.forEach(r => {
            map[r.id] = { ...r, children: [] };
        });
        threadDetail.replies.forEach(r => {
            if (r.parentReplyId && map[r.parentReplyId]) {
                map[r.parentReplyId].children.push(map[r.id]);
            } else {
                roots.push(map[r.id]);
            }
        });
        return roots;
    }, [threadDetail]);

    return (
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-950 shadow-sm transition-all hover:border-gray-300 dark:hover:border-gray-700">
            <div 
                className="p-4 cursor-pointer"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">{thread.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                                <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden">
                                    {thread.author.avatarUrl && <img src={thread.author.avatarUrl} alt={thread.author.name} className="w-full h-full object-cover" />}
                                </div>
                                {thread.author.name}
                            </span>
                            <span>•</span>
                            <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" />
                                {thread._count.replies} replies
                            </span>
                        </div>
                    </div>
                    {thread.pinned && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                </div>
            </div>

            {expanded && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
                    <div className="py-4 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                        {threadDetail?.body || thread.body}
                    </div>

                    <div className="space-y-4 mt-6">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400">Replies</h5>
                        {isLoadingDetail ? (
                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                        ) : (
                            <div className="space-y-4">
                                {nestedReplies.map(reply => (
                                    <ReplyItem 
                                        key={reply.id} 
                                        reply={reply} 
                                        onUpvote={(id) => upvoteMutation.mutate(id)}
                                        onReply={(body, parentId) => replyMutation.mutate({ body, parentReplyId: parentId })}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="mt-6 flex gap-3">
                            <div className="flex-1">
                                <textarea 
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm focus:ring-1 focus:ring-[#E97451] outline-none"
                                    placeholder="Write a reply..."
                                    rows={2}
                                    value={replyBody}
                                    onChange={e => setReplyBody(e.target.value)}
                                />
                                <div className="flex justify-end mt-2">
                                    <button 
                                        disabled={replyMutation.isLoading || !replyBody.trim()}
                                        onClick={() => replyMutation.mutate({ body: replyBody })}
                                        className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-black transition-colors"
                                    >
                                        Post Reply
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ReplyItem({ reply, onUpvote, onReply, depth = 0 }) {
    const [showReplyForm, setShowReplyForm] = useState(false);
    const [replyText, setReplyText] = useState('');

    const handleReply = () => {
        onReply(replyText, reply.id);
        setReplyText('');
        setShowReplyForm(false);
    };

    return (
        <div className={`${depth > 0 ? 'ml-6 mt-3 border-l-2 border-gray-100 dark:border-gray-800 pl-4' : ''}`}>
            <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0">
                    {reply.author.avatarUrl && <img src={reply.author.avatarUrl} alt={reply.author.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{reply.author.name}</span>
                        <span className="text-[10px] text-gray-500">{new Date(reply.createdAt).toLocaleTimeString()}</span>
                        {reply.isAnswer && (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight">Answer</span>
                        )}
                    </div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        {reply.body}
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <button 
                            onClick={() => onUpvote(reply.id)}
                            className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-[#E97451] transition-colors"
                        >
                            <ThumbsUp className="w-3 h-3" />
                            {reply._count?.upvotes || 0}
                        </button>
                        <button 
                            onClick={() => setShowReplyForm(!showReplyForm)}
                            className="text-[11px] font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            Reply
                        </button>
                    </div>

                    {showReplyForm && (
                        <div className="mt-3 flex gap-2">
                            <input 
                                className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-1.5 text-xs focus:ring-1 focus:ring-[#E97451] outline-none"
                                placeholder="Write a reply..."
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                            />
                            <button 
                                onClick={handleReply}
                                className="bg-gray-900 text-white px-2 py-1 rounded text-[10px] font-bold"
                            >
                                Send
                            </button>
                        </div>
                    )}

                    {reply.children?.map(child => (
                        <ReplyItem 
                            key={child.id} 
                            reply={child} 
                            onUpvote={onUpvote} 
                            onReply={onReply} 
                            depth={depth + 1} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}


// --- Assessment Components ---

function AssessmentTab({ moduleId, courseId }) {
    const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);

    const { data: assessments, isLoading } = useQuery({
        queryKey: ['assessments', moduleId],
        queryFn: async () => {
            const res = await api.get(`/assessments/courses/${courseId}/assessments?moduleId=${moduleId}`);
            return res.data;
        },
        enabled: !!moduleId
    });

    if (selectedAssessmentId) {
        return <AssessmentRunner assessmentId={selectedAssessmentId} onBack={() => setSelectedAssessmentId(null)} />;
    }

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-[#E97451]" /></div>;

    return (
        <div className="max-w-3xl mx-auto p-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#E97451]" />
                Module Assessments
            </h3>

            {assessments?.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-gray-500">No assessments found for this module.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {assessments?.map(assessment => (
                        <div key={assessment.id} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-5 rounded-xl flex items-center justify-between hover:border-[#E97451]/50 transition-colors">
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{assessment.title}</h4>
                                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                    <span>{assessment._count.questions} Questions</span>
                                    <span>Pass Score: {assessment.passScore}</span>
                                    <span>Limit: {Math.round(assessment.timeLimitS / 60)}m</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedAssessmentId(assessment.id)}
                                className="bg-gray-900 dark:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-colors"
                            >
                                Start Quiz
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function AssessmentRunner({ assessmentId, onBack }) {
    const [attempt, setAttempt] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const { data: assessment, isLoading } = useQuery({
        queryKey: ['assessment', assessmentId],
        queryFn: async () => {
            const res = await api.get(`/assessments/assessments/${assessmentId}`);
            return res.data;
        }
    });

    const handleStart = async () => {
        setLoading(true);
        try {
            const res = await api.post(`/assessments/assessments/${assessmentId}/attempts`);
            setAttempt(res.data);
        } catch (err) {
            toast.error(err.response?.data?.error || "Failed to start attempt");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!attempt) return;
        setLoading(true);
        try {
            const res = await api.post(`/assessments/attempts/${attempt.id}/submit`, { answers });
            setResult(res.data);
            setSubmitted(true);
            toast.success('Assessment submitted!');
        } catch (err) {
            toast.error("Failed to submit assessment");
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    if (submitted && result) {
        return (
            <div className="max-w-2xl mx-auto p-8 text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${result.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {result.passed ? <CheckCircle2 className="w-10 h-10" /> : <X className="w-10 h-10" />}
                </div>
                <h3 className="text-2xl font-bold mb-2">{result.passed ? 'Assessment Passed!' : 'Assessment Failed'}</h3>
                <p className="text-gray-500 mb-6">Your score: <span className="font-bold text-gray-900 dark:text-white">{result.score}</span> / {assessment.questions.reduce((a,b)=>a+b.points, 0)}</p>
                
                <button 
                    onClick={onBack}
                    className="bg-[#E97451] text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
                >
                    Back to Module
                </button>
            </div>
        );
    }

    if (!attempt) {
        return (
            <div className="max-w-2xl mx-auto p-12 text-center">
                <h3 className="text-2xl font-bold mb-4">{assessment.title}</h3>
                <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 mb-8">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Questions</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{assessment.questions.length}</p>
                        </div>
                        <div className="text-center border-x border-gray-200 dark:border-gray-800">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Time Limit</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(assessment.timeLimitS / 60)}m</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Pass Score</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{assessment.passScore}</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 justify-center">
                    <button onClick={onBack} className="px-6 py-2 text-gray-500 font-medium">Cancel</button>
                    <button 
                        onClick={handleStart}
                        disabled={loading}
                        className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-8 py-2 rounded-lg font-bold hover:scale-105 transition-transform disabled:opacity-50"
                    >
                        {loading ? 'Starting...' : 'I am Ready'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto p-8">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold">{assessment.title}</h3>
                <div className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
                    QUIZ IN PROGRESS
                </div>
            </div>

            <div className="space-y-10">
                {assessment.questions.map((q, idx) => (
                    <div key={q.id} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm">
                        <div className="flex gap-4 mb-4">
                            <span className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold shrink-0">{idx + 1}</span>
                            <p className="text-lg font-medium text-gray-900 dark:text-white">{q.prompt}</p>
                        </div>
                        
                        <div className="grid gap-3 ml-12">
                            {q.optionsJson.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => setAnswers({...answers, [q.id]: opt})}
                                    className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${
                                        answers[q.id] === opt 
                                            ? 'bg-[#FFF0E8] border-[#E97451] text-[#A84525] dark:bg-[#E97451]/20 dark:border-[#E97451] dark:text-white' 
                                            : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-300'
                                    }`}
                                >
                                    <span className="font-mono mr-3 opacity-40">{String.fromCharCode(65 + i)})</span>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-8 mb-20">
                <p className="text-sm text-gray-500">
                    {Object.keys(answers).length} of {assessment.questions.length} answered
                </p>
                <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="bg-[#E97451] text-white px-10 py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
                >
                    {loading ? 'Submitting...' : 'Finish & Submit'}
                </button>
            </div>
        </div>
    );
}

// --- CoursePlayer Main Component ---

export default function CoursePlayer() {
    const { courseId, moduleId } = useParams();
    const navigate = useNavigate();
    const { modules, progressList, refreshEnrollment } = useOutletContext();
    
    const [activeTab, setActiveTab] = useState('content'); // 'content', 'qa', 'assessments'
    const [updating, setUpdating] = useState(false);
    const [isBookmarking, setIsBookmarking] = useState(false);
    const [bookmarked, setBookmarked] = useState(false);
    const sessionRef = useRef(null);

    // Default to the first module if none specified
    useEffect(() => {
        if (!moduleId && modules.length > 0) {
            navigate(`/learn/${courseId}/module/${modules[0].id}`, { replace: true });
        }
    }, [moduleId, modules, courseId, navigate]);

    // Check if current module is bookmarked
    useEffect(() => {
        const checkBookmark = async () => {
            if (!moduleId) return;
            try {
                const res = await bookmarkApi.getBookmarks();
                const bookmarks = Array.isArray(res.data) ? res.data : [];
                const isMarked = bookmarks.some(b => b.moduleId === moduleId);
                setBookmarked(isMarked);
            } catch (err) {
                console.error("Failed to fetch bookmarks", err);
            }
        };
        checkBookmark();
    }, [moduleId]);

    // Handle Study Session tracking
    useEffect(() => {
        if (!moduleId) return;

        let currentSessionId = null;

        const startSession = async () => {
            try {
                const res = await api.post('/study-sessions/start', { courseId, moduleId });
                currentSessionId = res.data.session.id;
                sessionRef.current = currentSessionId;
            } catch (err) {
                console.error("Failed to start study session", err);
            }
        };

        startSession();

        return () => {
            // End session on unmount or when moduleId changes
            if (currentSessionId) {
                api.patch(`/study-sessions/${currentSessionId}/end`).catch(err => {
                    console.error("Failed to end study session", err);
                });
            }
        };
    }, [courseId, moduleId]);

    const currentModule = modules.find(m => m.id === moduleId);

    if (!currentModule) {
        return (
            <div className="flex-1 flex items-center justify-center p-10 text-gray-500">
                Module not found or select a module to start learning.
            </div>
        );
    }

    const currentProgress = progressList.find(p => p.moduleId === moduleId);
    const isCompleted = currentProgress?.status === 'COMPLETED';

    const handleMarkComplete = async () => {
        if (updating || isCompleted) return;
        setUpdating(true);
        try {
            await api.post(`/enrollments/${courseId}/progress/${moduleId}`, { status: 'COMPLETED' });
            await refreshEnrollment(); // Update context
            toast.success('Module marked as completed!');
        } catch (err) {
            console.error("Failed to mark complete", err);
            toast.error("Failed to update progress.");
        } finally {
            setUpdating(false);
        }
    };

    const handleToggleBookmark = async () => {
        if (isBookmarking) return;
        setIsBookmarking(true);
        try {
            if (bookmarked) {
                const res = await bookmarkApi.getBookmarks();
                const bookmarkList = Array.isArray(res.data) ? res.data : [];
                const bookmark = bookmarkList.find(b => b.moduleId === moduleId);
                if (bookmark) {
                    await bookmarkApi.deleteBookmark(bookmark.id);
                    setBookmarked(false);
                    toast.success('Bookmark removed');
                }
            } else {
                await bookmarkApi.createBookmark({ moduleId, note: `Bookmark for ${currentModule.title}` });
                setBookmarked(true);
                toast.success('Module bookmarked');
            }
        } catch (err) {
            console.error("Failed to toggle bookmark", err);
            toast.error("Failed to update bookmark.");
        } finally {
            setIsBookmarking(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Module Content Header */}
            <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-950">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {currentModule.title}
                        </h2>
                        <div className="flex gap-2 items-center text-sm text-gray-500 dark:text-gray-400">
                            <span className="uppercase tracking-wider font-semibold text-xs text-[#E97451] dark:text-[#FF855C] bg-[#FFF0E8] dark:bg-[#8A3324]/30 px-2 py-1 rounded">
                                {currentModule.contentType}
                            </span>
                            <span>•</span>
                            <span>{Math.round(currentModule.durationS / 60)} min read</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleToggleBookmark}
                            disabled={isBookmarking}
                            className={`flex items-center gap-2 p-2 rounded-lg transition-colors border ${
                                bookmarked 
                                    ? 'bg-[#FFF0E8] text-[#E97451] border-[#FFC6B0] dark:bg-[#8A3324]/30 dark:border-[#A84525] dark:text-[#FF855C]' 
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                            title={bookmarked ? "Remove Bookmark" : "Bookmark Module"}
                        >
                            <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
                        </button>

                        <button 
                            onClick={handleMarkComplete}
                            disabled={updating || isCompleted}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                isCompleted 
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                            }`}
                        >
                            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            {isCompleted ? 'Completed' : (updating ? 'Saving...' : 'Mark as complete')}
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 mt-6 border-b border-gray-100 dark:border-gray-800">
                    <button 
                        onClick={() => setActiveTab('content')}
                        className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'content' ? 'text-[#E97451]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Module Content
                        </div>
                        {activeTab === 'content' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E97451] rounded-full" />}
                    </button>
                    <button 
                        onClick={() => setActiveTab('qa')}
                        className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'qa' ? 'text-[#E97451]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Q&A Discussions
                        </div>
                        {activeTab === 'qa' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E97451] rounded-full" />}
                    </button>
                    <button 
                        onClick={() => setActiveTab('assessments')}
                        className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'assessments' ? 'text-[#E97451]' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <div className="flex items-center gap-2">
                            <ClipboardList className="w-4 h-4" />
                            Assessments
                        </div>
                        {activeTab === 'assessments' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E97451] rounded-full" />}
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'content' && (
                    <div className="p-8">
                        <div className="max-w-3xl mx-auto">
                            {currentModule.contentType === 'VIDEO' ? (
                                <div className="mb-8 rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-gray-200 dark:border-gray-800 shadow-sm">
                                    {currentModule.body.includes('<iframe') ? (
                                        <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: currentModule.body }} />
                                    ) : currentModule.body.startsWith('http') ? (
                                        <video src={currentModule.body} controls className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="text-center text-gray-500 flex flex-col items-center">
                                            <PlayCircle className="w-16 h-16 mb-4 text-gray-700" />
                                            <p>Video Player Placeholder</p>
                                            <p className="text-xs mt-2 text-gray-600 max-w-md">{currentModule.body}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="prose dark:prose-invert prose-stone max-w-none">
                                    <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed font-sans text-lg">
                                        {currentModule.body}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'qa' && <DiscussionTab moduleId={moduleId} courseId={courseId} />}
                
                {activeTab === 'assessments' && <AssessmentTab moduleId={moduleId} courseId={courseId} />}
            </div>
        </div>
    );
}

