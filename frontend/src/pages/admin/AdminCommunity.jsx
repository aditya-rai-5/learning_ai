import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, MessageSquare } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function AdminCommunity() {
    const queryClient = useQueryClient();

    const { data: threads, isLoading } = useQuery({
        queryKey: ['admin-threads'],
        queryFn: async () => {
            const res = await api.get('/admin/threads');
            return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (threadId) => {
            return api.delete(`/threads/${threadId}`);
        },
        onSuccess: () => {
            toast.success('Thread deleted successfully');
            queryClient.invalidateQueries(['admin-threads']);
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Failed to delete thread');
        }
    });

    const handleDelete = (threadId) => {
        if (window.confirm('Are you sure you want to permanently delete this thread?')) {
            deleteMutation.mutate(threadId);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading community threads...</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Community Moderation</h1>
            <p className="text-gray-500 mb-8">Review and moderate all discussion threads.</p>

            <div className="space-y-4">
                {threads?.map(thread => (
                    <div key={thread.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl flex items-start justify-between shadow-sm">
                        <div className="flex gap-4">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center shrink-0 uppercase font-bold">
                                {thread.author?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{thread.title}</h3>
                                <p className="text-sm text-gray-500 mb-2">
                                    Posted by {thread.author?.name} in {thread.course?.title || 'General'}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
                                    <span className="flex items-center gap-1">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        {thread._count.replies} replies
                                    </span>
                                    <span>{new Date(thread.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => handleDelete(thread.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Delete Thread"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
