import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { bookmarkApi } from '../../lib/api';
import { Bookmark, Trash2, ExternalLink } from 'lucide-react';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookmarks = useCallback(async () => {
    try {
      const response = await bookmarkApi.getBookmarks();
      setBookmarks(Array.isArray(response.data) ? response.data : []);
    } catch {
      setError('Failed to load bookmarks. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bookmark?')) return;
    try {
      await bookmarkApi.deleteBookmark(id);
      setBookmarks(bookmarks.filter(b => b.id !== id));
    } catch {
      alert('Failed to delete bookmark.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#E97451]"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Bookmark className="w-8 h-8 text-[#E97451]" />
        <h1 className="text-2xl font-bold text-gray-900">My Bookmarks</h1>
      </div>

      {bookmarks.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No bookmarks yet</h3>
          <p className="text-gray-500 mt-1">
            You haven't saved any content yet. Explore courses and bookmark interesting modules or interactions.
          </p>
          <Link to="/courses" className="mt-4 inline-block px-4 py-2 bg-[#E97451] text-white rounded-md hover:bg-[#D05D3A]">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 flex flex-col">
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">
                    {bookmark.note || (bookmark.module ? bookmark.module.title : 'Saved Item')}
                  </h3>
                  <button 
                    onClick={() => handleDelete(bookmark.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {bookmark.module && (
                  <p className="text-sm text-gray-500 mt-2">
                    Module: {bookmark.module.title}
                  </p>
                )}
                
                {bookmark.interaction && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-3 italic">
                    "{bookmark.interaction.message}"
                  </p>
                )}

                <p className="text-xs text-gray-400 mt-4">
                  Saved on {new Date(bookmark.createdAt).toLocaleDateString()}
                </p>
              </div>

              {bookmark.module && bookmark.module.courseId && (
                <Link 
                  to={`/learn/${bookmark.module.courseId}/module/${bookmark.moduleId}`}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-[#FFF0E8] text-[#D05D3A] rounded hover:bg-[#FFE0D1] transition-colors text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Go to Module
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
