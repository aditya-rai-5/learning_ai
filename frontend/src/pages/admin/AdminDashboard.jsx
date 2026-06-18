import { useQuery } from '@tanstack/react-query';
import { Users, BookOpen, DollarSign, Activity } from 'lucide-react';
import api from '../../lib/api';

export default function AdminDashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const res = await api.get('/admin/stats');
            return res.data;
        }
    });

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading system stats...</div>;

    const cards = [
        { label: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { label: 'Total Courses', value: stats?.totalCourses || 0, icon: BookOpen, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
        { label: 'Total Enrollments', value: stats?.totalEnrollments || 0, icon: Activity, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
        { label: 'Platform Revenue', value: `$${(stats?.totalRevenue || 0).toFixed(2)}`, icon: DollarSign, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    ];

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">System Overview</h1>
            <p className="text-gray-500 mb-8">Monitor platform health and global metrics.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {cards.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${card.bg} ${card.color}`}>
                                <Icon className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{card.label}</p>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-2">Welcome Admin</h3>
                <p className="text-blue-800 dark:text-blue-400 text-sm">
                    You have full access to all courses, users, and community threads. You can bypass course enrollment entirely by clicking "View Course Content" on any course page.
                </p>
            </div>
        </div>
    );
}
