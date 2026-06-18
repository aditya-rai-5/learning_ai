import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function InstructorQA() {
    const [expandedThread, setExpandedThread] = useState(null);
    const [replyText, setReplyText] = useState('');
    const queryClient = useQueryClient();

    const { data: threads, isLoading } = useQuery({
        queryKey: ['instructor-qa'],
        queryFn: async () => {
            const res = await api.get('/instructor/qa');
            return res.data;
        }
    });

    const replyMutation = useMutation({
        mutationFn: async ({ threadId, body }) => {
            return api.post(`/threads/${threadId}/replies`, { body });
        },
        onSuccess: () => {
            toast.success('Reply posted!');
            setReplyText('');
            queryClient.invalidateQueries(['instructor-qa']);
            queryClient.invalidateQueries(['thread', expandedThread]);
        }
    });

    const { data: threadDetail } = useQuery({
        queryKey: ['thread', expandedThread],
        queryFn: async () => {
            const res = await api.get(`/threads/${expandedThread}`);
            return res.data;
        },
        enabled: !!expandedThread
    });

    if (isLoading) return <div className="flex justify-center p-12 text-gray-500">Loading Q&A...</div>;

    // A simple heuristic: if a thread has 0 replies, it's unanswered. Or if no replies from instructor.
    // We'll just list all threads for now, newest first.

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Student Q&A</h1>
                <p className="text-gray-500 mt-1">Review and answer questions from students across all your courses.</p>
            </div>

            {threads?.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
                    <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No questions yet</h3>
                    <p className="text-gray-500">When students ask questions in your courses, they will appear here.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {threads?.map(thread => (
                        <div key={thread.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                            <div 
                                className="p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-start gap-4"
                                onClick={() => setExpandedThread(expandedThread === thread.id ? null : thread.id)}
                            >
                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center shrink-0 uppercase font-bold text-sm">
                                    {thread.author.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{thread.author.name}</span>
                                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                            {thread.course?.title || 'Unknown Course'}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{thread.title}</h4>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{thread.body}</p>
                                    
                                    <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 font-medium">
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            {thread._count.replies} replies
                                        </span>
                                        <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                                        {thread._count.replies === 0 && (
                                            <span className="text-[#E97451] bg-[#FFF0E8] dark:bg-[#8A3324]/30 px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">
                                                Needs Answer
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-gray-400">
                                    {expandedThread === thread.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                            </div>

                            {expandedThread === thread.id && (
                                <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 p-5">
                                    <div className="mb-6 whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm">
                                        {threadDetail?.body || thread.body}
                                    </div>

                                    <div className="space-y-4 mb-6">
                                        {threadDetail?.replies?.map(reply => (
                                            <div key={reply.id} className="flex gap-3 ml-6 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0 text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
                                                    {reply.author.name.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{reply.author.name}</span>
                                                        <span className="text-[10px] text-gray-500">{new Date(reply.createdAt).toLocaleString()}</span>
                                                        {reply.isAnswer && (
                                                            <span className="flex items-center gap-1 text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-tight">
                                                                <CheckCircle className="w-3 h-3" /> Answer
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{reply.body}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="ml-6 flex gap-3">
                                        <textarea 
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            placeholder="Write your answer..."
                                            rows={2}
                                            className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#E97451] outline-none transition-shadow"
                                        />
                                        <button 
                                            onClick={() => replyMutation.mutate({ threadId: thread.id, body: replyText })}
                                            disabled={!replyText.trim() || replyMutation.isLoading}
                                            className="bg-[#E97451] text-white px-6 py-2 rounded-xl font-medium text-sm hover:bg-[#D05D3A] disabled:opacity-50 transition-colors self-end"
                                        >
                                            Reply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
