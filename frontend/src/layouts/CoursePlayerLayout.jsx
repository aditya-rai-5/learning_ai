import { useState, useEffect, useCallback, useRef } from 'react';
import { Outlet, Link, useParams, useNavigate } from 'react-router-dom';
import api, { aiApi } from '../lib/api';
import {
    ArrowLeft, CheckCircle2, PlayCircle, FileText, Code2,
    ChevronLeft, ChevronRight, MessageCircle, X, Bot, Send, User, ThumbsUp, ThumbsDown, Loader2
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle';

const TYPE_ICON = { VIDEO: PlayCircle, TEXT: FileText, CODE: Code2 };

function ModuleSidebar({ open, courseId, currentModuleId, modules, progressList }) {
    if (!open) return null;
    return (
        <aside className="w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden shrink-0 transition-colors">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Course Modules
            </div>
            <nav className="flex-1 overflow-y-auto py-1">
                {modules.map((mod, i) => {
                    const Icon = TYPE_ICON[mod.contentType] ?? FileText;
                    const isActive = mod.id === currentModuleId;
                    const modProgress = progressList.find(p => p.moduleId === mod.id);
                    const isCompleted = modProgress?.status === 'COMPLETED';

                    return (
                        <Link
                            key={mod.id}
                            to={`/learn/${courseId}/module/${mod.id}`}
                            className={`flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${isActive ? 'bg-[#FFF0E8] dark:bg-gray-800 border-r-2 border-[#E97451] dark:border-white' : ''
                                }`}
                        >
                            <div className={`mt-0.5 shrink-0 ${isCompleted ? 'text-green-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                {isCompleted
                                    ? <CheckCircle2 className="w-4 h-4" />
                                    : <Icon className="w-4 h-4" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isActive ? 'text-[#D05D3A] dark:text-white' : 'text-gray-700 dark:text-gray-400'}`}>
                                    {i + 1}. {mod.title}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
                                    {mod.contentType?.toLowerCase() || 'text'}
                                </p>
                            </div>
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}

function AiChatPanel({ open, onClose, courseId, moduleId }) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!open || !courseId) return;
        const fetchHistory = async () => {
            setLoadingHistory(true);
            try {
                const res = await aiApi.getChatHistory(courseId);
                const history = Array.isArray(res.data) ? res.data : [];
                const formattedMessages = history.map(item => ({
                    role: item.role,
                    content: item.message,
                    id: item.id,
                    rating: item.feedback?.rating
                }));
                setMessages(formattedMessages);
            } catch (err) {
                console.error("Failed to load chat history", err);
            } finally {
                setLoadingHistory(false);
                setTimeout(scrollToBottom, 100);
            }
        };
        fetchHistory();
    }, [open, courseId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setSending(true);

        try {
            const res = await aiApi.chat(courseId, { moduleId, question: userMsg });
            const aiMsg = res.data; 
            
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: aiMsg.answer, 
                id: aiMsg.interactionId
            }]);
        } catch (err) {
            console.error("Chat failed", err);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setSending(false);
        }
    };

    const handleFeedback = async (interactionId, rating) => {
        try {
            await aiApi.submitFeedback(courseId, interactionId, { rating });
            // Update local state to reflect rating
            setMessages(prev => prev.map(msg => 
                msg.id === interactionId ? { ...msg, rating } : msg
            ));
        } catch (err) {
            console.error("Failed to submit feedback", err);
        }
    };

    if (!open) return null;
    return (
        <aside className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex flex-col shrink-0 transition-colors">
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white">
                    <Bot className="w-4 h-4 text-[#E97451] dark:text-gray-300" />
                    AI Tutor
                </div>
                <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-950 space-y-4 transition-colors">
                <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#E97451] flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-[#FFF0E8] dark:bg-gray-800 border border-[#FFE0D1] dark:border-gray-700 rounded-xl rounded-tl-none p-3 text-sm text-[#A84525] dark:text-gray-200 max-w-[85%]">
                        Hi! I'm your AI tutor. Ask me anything about this module.
                    </div>
                </div>

                {loadingHistory ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-[#E97451]" />
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-[#4A5D23]' : 'bg-[#E97451]'}`}>
                                {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`rounded-xl p-3 text-sm whitespace-pre-wrap ${
                                    msg.role === 'user' 
                                        ? 'bg-[#4A5D23] text-white rounded-tr-none' 
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none'
                                }`}>
                                    {msg.content}
                                </div>
                                
                                {msg.role === 'assistant' && msg.id && (
                                    <div className="flex items-center gap-1.5 px-1">
                                        <button 
                                            onClick={() => handleFeedback(msg.id, 5)}
                                            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${msg.rating === 5 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}
                                            title="Helpful"
                                        >
                                            <ThumbsUp className="w-3 h-3" />
                                        </button>
                                        <button 
                                            onClick={() => handleFeedback(msg.id, 1)}
                                            className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${msg.rating === 1 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}
                                            title="Not helpful"
                                        >
                                            <ThumbsDown className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {sending && (
                    <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#E97451] flex items-center justify-center shrink-0">
                            <Bot className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl rounded-tl-none p-3 text-sm text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-gray-100 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        disabled={sending}
                        className="flex-1 text-sm px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E97451] text-gray-900 dark:text-gray-100 placeholder-gray-400 disabled:opacity-50"
                    />
                    <button 
                        type="submit" 
                        disabled={sending || !input.trim()}
                        className="bg-[#E97451] text-white p-2 rounded-lg hover:bg-[#D05D3A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </aside>
    )
}

export default function CoursePlayerLayout() {
    const { courseId, moduleId } = useParams();
    const navigate = useNavigate();
    
    const [enrollment, setEnrollment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [chatOpen, setChatOpen] = useState(false);

    const fetchEnrollment = useCallback(async () => {
        try {
            const res = await api.get(`/enrollments/${courseId}`);
            setEnrollment(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load course or you are not enrolled.');
            // Optionally navigate back to course details
            // navigate(`/courses/${courseId}`);
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        fetchEnrollment();
    }, [fetchEnrollment]);

    if (loading) {
        return <div className="h-screen bg-gray-900 flex items-center justify-center text-white">Loading course...</div>;
    }

    if (error || !enrollment) {
        return (
            <div className="h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
                <p className="mb-4">{error}</p>
                <Link to="/dashboard" className="px-4 py-2 bg-[#E97451] rounded-md">Go to Dashboard</Link>
            </div>
        );
    }

    const course = enrollment.course;
    const modules = course?.modules || [];
    const progressList = enrollment.progress || [];

    const completedCount = progressList.filter(p => p.status === 'COMPLETED').length;
    const totalCount = modules.length;

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-gray-900">

            {/* ── Player header ── */}
            <header className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center gap-4 shrink-0">
                <Link to="/dashboard" className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </Link>

                <div className="h-4 w-px bg-gray-700" />

                <h1 className="text-white text-sm font-medium flex-1 truncate">{course.title}</h1>

                {/* Progress bar */}
                <div className="hidden md:flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{completedCount}/{totalCount}</span>
                    <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[#FFF0E8]0 rounded-full transition-all"
                            style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
                        />
                    </div>
                </div>

                {/* Sidebar toggle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    title="Toggle module list"
                    className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
                >
                    {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>

                <ThemeToggle />

                {/* AI chat toggle */}
                <button
                    onClick={() => setChatOpen(!chatOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${chatOpen
                            ? 'bg-[#E97451] text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-800'
                        }`}
                >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden md:inline">AI Tutor</span>
                </button>
            </header>

            {/* ── Body ── */}
            <div className="flex-1 flex overflow-hidden">
                <ModuleSidebar 
                    open={sidebarOpen} 
                    courseId={courseId} 
                    currentModuleId={moduleId} 
                    modules={modules}
                    progressList={progressList}
                />

                <main className="flex-1 overflow-auto bg-white dark:bg-gray-950 transition-colors flex flex-col relative">
                    {/* Pass context to Outlet */}
                    <Outlet context={{ course, modules, progressList, refreshEnrollment: fetchEnrollment }} />
                </main>

                <AiChatPanel open={chatOpen} onClose={() => setChatOpen(false)} courseId={courseId} moduleId={moduleId} />
            </div>
        </div>
    )
}
