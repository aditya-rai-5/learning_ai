import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { discussionApi } from '../../lib/api';
import { MessageSquare, Users, Clock, Search, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Community() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newThreadData, setNewThreadData] = useState({ title: '', body: '', tags: '' });

  const fetchThreads = useCallback(async () => {
    try {
      const response = await discussionApi.getThreads({ general: 'true' });
      setThreads(Array.isArray(response.data) ? response.data : []);
    } catch {
      setError('Failed to load discussions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to create a thread.");
      return;
    }
    
    try {
      const tagsArray = newThreadData.tags.split(',').map(tag => tag.trim()).filter(t => t);
      const response = await discussionApi.createThread({
        title: newThreadData.title,
        body: newThreadData.body,
        tags: tagsArray
      });
      setThreads([response.data.thread, ...threads]);
      setShowNewThread(false);
      setNewThreadData({ title: '', body: '', tags: '' });
    } catch {
      alert('Failed to create thread.');
    }
  };

  const filteredThreads = threads.filter(thread => 
    thread.title.toLowerCase().includes(search.toLowerCase()) ||
    (thread.tags && thread.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Community Discussions</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Join the conversation, ask questions, and share knowledge.</p>
        </div>
        
        {user && (
          <button 
            onClick={() => setShowNewThread(!showNewThread)}
            className="flex items-center gap-2 px-4 py-2 bg-[#4A5D23] text-white rounded-md hover:bg-[#3B4A1C] transition-colors"
          >
            <PlusCircle className="w-5 h-5" />
            New Discussion
          </button>
        )}
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
        <input 
          type="text" 
          placeholder="Search discussions by title or tags..." 
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {showNewThread && user && (
        <div className="bg-[#BCCBC9] dark:bg-[#4c4c4e] rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Start a new discussion</h2>
          <form onSubmit={handleCreateThread}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-[#4A5D23] focus:border-[#4A5D23]"
                  value={newThreadData.title}
                  onChange={e => setNewThreadData({...newThreadData, title: e.target.value})}
                  placeholder="What's on your mind?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Body</label>
                <textarea 
                  required
                  rows="4"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-[#4A5D23] focus:border-[#4A5D23]"
                  value={newThreadData.body}
                  onChange={e => setNewThreadData({...newThreadData, body: e.target.value})}
                  placeholder="Provide more details..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tags (comma separated)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md focus:outline-none focus:ring-[#4A5D23] focus:border-[#4A5D23]"
                  value={newThreadData.tags}
                  onChange={e => setNewThreadData({...newThreadData, tags: e.target.value})}
                  placeholder="e.g. react, question, help"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowNewThread(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#4A5D23] text-white rounded-md hover:bg-[#3B4A1C]"
                >
                  Post Discussion
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4A5D23]"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-500 py-12">{error}</div>
      ) : filteredThreads.length === 0 ? (
        <div className="text-center py-12 bg-[#BCCBC9] dark:bg-[#4c4c4e] rounded-lg border border-gray-200 dark:border-gray-600">
          <MessageSquare className="w-12 h-12 text-gray-500 dark:text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No discussions found</h3>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Try adjusting your search or start a new discussion.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredThreads.map(thread => (
            <Link 
              key={thread.id} 
              to={`/community/${thread.id}`}
              className="block bg-[#BCCBC9] dark:bg-[#4c4c4e] rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {thread.pinned && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Pinned</span>
                    )}
                    <h2 className="text-xl font-bold text-[#4A5D23] dark:text-[#B38B6D] group-hover:text-[#3B4A1C] dark:group-hover:text-white transition-colors">
                      {thread.title}
                    </h2>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-2 mb-4">{thread.body}</p>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
                        {thread.author?.avatarUrl ? (
                          <img src={thread.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">{thread.author?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {new Date(thread.createdAt).toLocaleDateString()}
                    </div>
                    {thread.course && (
                      <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                        {thread.course.title}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col gap-4 md:items-end border-t md:border-t-0 md:border-l border-gray-300 dark:border-gray-500 pt-4 md:pt-0 md:pl-4 min-w-[120px]">
                  <div className="flex flex-col items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded-lg p-2 flex-1 md:flex-none md:w-full">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{thread._count?.replies || 0}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400 uppercase font-medium">Replies</span>
                  </div>
                </div>
              </div>
              
              {thread.tags && thread.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {thread.tags.map(tag => (
                    <span key={tag} className="px-2.5 py-1 bg-[#B38B6D] text-white text-xs font-medium rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}