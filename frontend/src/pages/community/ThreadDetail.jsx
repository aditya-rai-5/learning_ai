import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { discussionApi } from '../../lib/api';
import { MessageSquare, Users, Clock, ArrowLeft, ThumbsUp, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ThreadDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newReply, setNewReply] = useState('');

  const fetchThread = useCallback(async () => {
    try {
      setLoading(true);
      const response = await discussionApi.getThread(id);
      setThread(response.data);
    } catch {
      setError('Failed to load thread.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  const handleCreateReply = async (e) => {
    e.preventDefault();
    if (!user) return alert("Please login to reply.");
    if (!newReply.trim()) return;

    try {
      await discussionApi.createReply(id, { body: newReply });
      setNewReply('');
      fetchThread(); // Refresh thread to show new reply
    } catch {
      alert('Failed to post reply.');
    }
  };

  const handleUpvote = async (replyId) => {
    if (!user) return alert("Please login to upvote.");
    try {
      await discussionApi.upvoteReply(replyId);
      fetchThread(); // Refresh to get updated upvotes
    } catch {
      alert('Failed to upvote.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A5D23]"></div>
      </div>
    );
  }

  if (error || !thread) {
    return <div className="text-center text-red-500 py-12">{error || 'Thread not found'}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to="/community" className="inline-flex items-center gap-2 text-[#4A5D23] dark:text-[#B38B6D] hover:text-[#3B4A1C] dark:hover:text-white mb-6 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Community
      </Link>

      {/* Main Thread Post */}
      <div className="bg-[#BCCBC9] dark:bg-[#4c4c4e] rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6 sm:p-8 mb-8">
        <div className="flex items-center gap-2 mb-4">
          {thread.pinned && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Pinned</span>
          )}
          {thread.tags && thread.tags.map(tag => (
            <span key={tag} className="px-2.5 py-1 bg-[#B38B6D] text-white text-xs font-medium rounded-md">
              #{tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{thread.title}</h1>
        
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-8 pb-6 border-b border-gray-300 dark:border-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
              {thread.author?.avatarUrl ? (
                <img src={thread.author.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </div>
            <span className="font-medium text-gray-900 dark:text-white">{thread.author?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {new Date(thread.createdAt).toLocaleString()}
          </div>
        </div>

        <div className="prose max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {thread.body}
        </div>
      </div>

      {/* Replies Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#4A5D23] dark:text-[#B38B6D]" />
          {thread.replies?.length || 0} Replies
        </h2>

        <div className="space-y-6">
          {thread.replies?.map((reply) => (
            <div key={reply.id} className={`bg-[#BCCBC9] dark:bg-[#4c4c4e] rounded-lg shadow-sm border p-6 ${reply.isAnswer ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200 dark:border-gray-600'}`}>
              <div className="flex gap-4">
                {/* Upvote Column */}
                <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => handleUpvote(reply.id)}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-[#4A5D23] dark:hover:text-[#B38B6D] hover:bg-white/50 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{reply._count?.upvotes || 0}</span>
                </div>

                {/* Reply Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                        {reply.author?.avatarUrl ? (
                          <img src={reply.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{reply.author?.name || 'Unknown'}</span>
                      <span className="text-gray-500 dark:text-gray-400">&bull;</span>
                      <span className="text-gray-600 dark:text-gray-400">{new Date(reply.createdAt).toLocaleString()}</span>
                    </div>

                    {reply.isAnswer && (
                      <span className="flex items-center gap-1 text-sm font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        Accepted Answer
                      </span>
                    )}
                  </div>
                  
                  <div className="prose max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {reply.body}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {(!thread.replies || thread.replies.length === 0) && (
            <div className="text-center py-8 text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-gray-300 dark:border-gray-600 border-dashed">
              No replies yet. Be the first to share your thoughts!
            </div>
          )}
        </div>
      </div>

      {/* New Reply Form */}
      {user ? (
        <div className="bg-[#BCCBC9] dark:bg-[#4c4c4e] rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Post a Reply</h3>
          <form onSubmit={handleCreateReply}>
            <textarea
              required
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent outline-none mb-4 resize-none"
              placeholder="Write your response here..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
            ></textarea>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newReply.trim()}
                className="px-6 py-2 bg-[#4A5D23] text-white font-medium rounded-lg hover:bg-[#3B4A1C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Post Reply
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-gray-700 dark:text-gray-300 mb-4">Please log in to participate in this discussion.</p>
          <Link to="/login" className="inline-block px-6 py-2 bg-[#4A5D23] text-white font-medium rounded-lg hover:bg-[#3B4A1C] transition-colors">
            Log In
          </Link>
        </div>
      )}
    </div>
  );
}