import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { Bot, Send, User, Loader2, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AITutorChat({ courseId, moduleId, onClose }) {
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef(null);
    const queryClient = useQueryClient();

    // Fetch conversation history
    const { data: history, isLoading } = useQuery({
        queryKey: ['chat-history', courseId, moduleId],
        queryFn: async () => {
            const url = moduleId 
                ? `/courses/${courseId}/chat?moduleId=${moduleId}` 
                : `/courses/${courseId}/chat`;
            const res = await api.get(url);
            return res.data;
        }
    });

    const chatMutation = useMutation({
        mutationFn: async (question) => {
            return api.post(`/courses/${courseId}/chat`, {
                question,
                moduleId
            });
        },
        onMutate: async (newQuestion) => {
            await queryClient.cancelQueries(['chat-history', courseId, moduleId]);
            const previousHistory = queryClient.getQueryData(['chat-history', courseId, moduleId]);
            
            // Optimistically update UI
            const optimisticUserMessage = { id: Date.now(), role: 'user', message: newQuestion };
            const optimisticBotMessage = { id: Date.now() + 1, role: 'assistant', message: '...', isTyping: true };
            
            queryClient.setQueryData(['chat-history', courseId, moduleId], old => {
                const oldHistory = Array.isArray(old) ? old : [];
                return [...oldHistory, optimisticUserMessage, optimisticBotMessage];
            });

            return { previousHistory };
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries(['chat-history', courseId, moduleId]);
        },
        onError: (err, newQuestion, context) => {
            queryClient.setQueryData(['chat-history', courseId, moduleId], context.previousHistory);
            toast.error(err.response?.data?.error || "Failed to get AI response.");
        }
    });

    const handleSend = (e) => {
        e.preventDefault();
        if (!message.trim() || chatMutation.isPending) return;
        
        chatMutation.mutate(message.trim());
        setMessage('');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 shadow-xl w-80 md:w-96 flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">AI Tutor</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">Powered by Groq</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
                ) : history?.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p className="text-sm">Hi! I'm your AI Tutor.<br/>Ask me anything about this module.</p>
                    </div>
                ) : (
                    history?.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                                msg.role === 'user' 
                                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300' 
                                    : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                            }`}>
                                {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                            </div>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                                msg.role === 'user'
                                    ? 'bg-[#E97451] text-white rounded-tr-sm'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-tl-sm'
                            }`}>
                                {msg.isTyping ? (
                                    <span className="flex gap-1 py-1">
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </span>
                                ) : (
                                    <div className="whitespace-pre-wrap leading-relaxed">{msg.message}</div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
                <form onSubmit={handleSend} className="relative flex items-center">
                    <input 
                        type="text"
                        placeholder="Ask a question..."
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        disabled={chatMutation.isPending}
                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full pl-4 pr-12 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button 
                        type="submit"
                        disabled={!message.trim() || chatMutation.isPending}
                        className="absolute right-1.5 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full disabled:opacity-50 disabled:bg-gray-400 transition-colors"
                    >
                        <Send className="w-4 h-4 -ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
