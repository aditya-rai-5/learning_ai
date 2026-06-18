import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, UserX } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

export default function AdminUsers() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const res = await api.get('/admin/users');
            return res.data;
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (userId) => {
            return api.delete(`/admin/users/${userId}`);
        },
        onSuccess: () => {
            toast.success('User deleted successfully');
            queryClient.invalidateQueries(['admin-users']);
        },
        onError: (err) => {
            toast.error(err.response?.data?.error || 'Failed to delete user');
        }
    });

    const handleDelete = (userId) => {
        if (window.confirm('Are you sure you want to permanently delete this user? This will also delete their courses and enrollments. This cannot be undone.')) {
            deleteMutation.mutate(userId);
        }
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading users...</div>;

    const users = data?.users || [];

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">User Directory</h1>
            <p className="text-gray-500 mb-8">Manage all registered users on the platform.</p>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">Email</th>
                                <th className="px-6 py-4 font-medium">Role</th>
                                <th className="px-6 py-4 font-medium">Joined</th>
                                <th className="px-6 py-4 font-medium">Stats</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {user.name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold tracking-wider ${
                                            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                            user.role === 'INSTRUCTOR' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                        }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {user.role === 'STUDENT' ? `${user._count.enrollments} enrollments` : `${user._count.coursesCreated} courses`}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors"
                                            title="Delete User"
                                        >
                                            <UserX className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
