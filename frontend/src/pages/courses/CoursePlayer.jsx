import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import api, { bookmarkApi } from '../../lib/api';
import { CheckCircle2, Circle, Bookmark, PlayCircle } from 'lucide-react';

export default function CoursePlayer() {
    const { courseId, moduleId } = useParams();
    const navigate = useNavigate();
    const { modules, progressList, refreshEnrollment } = useOutletContext();
    
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
        } catch (err) {
            console.error("Failed to mark complete", err);
            alert("Failed to update progress.");
        } finally {
            setUpdating(false);
        }
    };

    const handleToggleBookmark = async () => {
        if (isBookmarking) return;
        setIsBookmarking(true);
        try {
            if (bookmarked) {
                // If it's already bookmarked, we need to find its ID to delete it.
                // For simplicity, we can just refetch and find it, or assume the backend handles it.
                // Since our bookmark route creates, we could just alert that it's bookmarked, or delete it if we had the ID.
                // Let's fetch to get the ID and delete it.
                const res = await bookmarkApi.getBookmarks();
                const bookmarkList = Array.isArray(res.data) ? res.data : [];
                const bookmark = bookmarkList.find(b => b.moduleId === moduleId);
                if (bookmark) {
                    await bookmarkApi.deleteBookmark(bookmark.id);
                    setBookmarked(false);
                }
            } else {
                await bookmarkApi.createBookmark({ moduleId, note: `Bookmark for ${currentModule.title}` });
                setBookmarked(true);
            }
        } catch (err) {
            console.error("Failed to toggle bookmark", err);
            alert("Failed to update bookmark.");
        } finally {
            setIsBookmarking(false);
        }
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {/* Module Content Header */}
            <div className="px-8 py-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
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
            </div>

            {/* Module Body Area */}
            <div className="flex-1 p-8">
                <div className="max-w-3xl mx-auto">
                    {currentModule.contentType === 'VIDEO' ? (
                        <div className="mb-8 rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-gray-200 dark:border-gray-800 shadow-sm">
                            {/* Assuming currentModule.body might be a URL or iframe embed code. 
                                For safety in this demo, if it starts with http, we try to use it as a video src or embed, 
                                otherwise we just display a mock player if it's standard text. */}
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
                            {/* Render Text or Code. In a real app we'd use a markdown parser like react-markdown */}
                            <div className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed font-sans text-lg">
                                {currentModule.body}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Footer Navigation (Next/Prev) can be added here if needed */}
        </div>
    );
}

