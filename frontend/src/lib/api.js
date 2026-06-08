import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle global errors (like 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // automatically logout user on 401
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Bookmarks API
export const bookmarkApi = {
  getBookmarks: () => api.get('/bookmarks'),
  createBookmark: (data) => api.post('/bookmarks', data),
  updateBookmark: (id, data) => api.put(`/bookmarks/${id}`, data),
  deleteBookmark: (id) => api.delete(`/bookmarks/${id}`)
};

// Community/Discussion API
export const discussionApi = {
  getThreads: (params) => api.get('/threads', { params }),
  getThread: (id) => api.get(`/threads/${id}`),
  createThread: (data) => api.post('/threads', data),
  updateThread: (id, data) => api.put(`/threads/${id}`, data),
  deleteThread: (id) => api.delete(`/threads/${id}`),
  createReply: (threadId, data) => api.post(`/threads/${threadId}/replies`, data),
  upvoteReply: (replyId) => api.post(`/replies/${replyId}/upvote`)
};

// AI API
export const aiApi = {
  getChatHistory: (courseId) => api.get(`/courses/${courseId}/chat`),
  chat: (courseId, data) => api.post(`/courses/${courseId}/chat`, data), // { moduleId, message }
  submitFeedback: (courseId, interactionId, data) => api.post(`/courses/${courseId}/chat/interactions/${interactionId}/feedback`, data) // { rating: 'UP' | 'DOWN' }
};

export default api;
