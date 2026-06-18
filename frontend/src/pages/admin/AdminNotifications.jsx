import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Send, Bell } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function AdminNotifications() {
    const [targetUserId, setTargetUserId] = useState('');
    const [message, setMessage] = useState('');

    const { data } = useQuery({
        queryKey: ['admin-users-list'],
        queryFn: async () => {
            const res = await api.get('/admin/users');
            return res.data;
        }
    });

    const notifyMutation = useMutation({
        mutationFn: async (payload) => {
            return api.post('/admin/notify', payload);
        },
        onSuccess: () => {
            toast.success('Notification sent successfully!');
            setMessage('');
            setTargetUserId('');
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Failed to send notification');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        notifyMutation.mutate({ targetUserId, message, type: 'SYSTEM_ALERT' });
    };

    const users = data?.users || [];

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">System Alerts</h1>
            <p className="text-gray-500 mb-8">Send direct notifications to instructors or students.</p>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full flex items-center justify-center">
                        <Bell className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Compose Alert</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select User</label>
                        <select 
                            required
                            value={targetUserId}
                            onChange={e => setTargetUserId(e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="">-- Choose a user --</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.role}) - {u.email}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
                        <textarea 
                            required
                            rows={4}
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder="Enter the alert message..."
                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                        />
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button 
                            type="submit"
                            disabled={notifyMutation.isLoading || !targetUserId || !message.trim()}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            <Send className="w-4 h-4" />
                            {notifyMutation.isLoading ? 'Sending...' : 'Send Alert'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
