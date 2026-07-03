import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { DollarSign, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPayouts() {
    const queryClient = useQueryClient();

    const { data: payouts, isLoading } = useQuery({
        queryKey: ['admin-payouts'],
        queryFn: async () => {
            const res = await api.get('/payouts/admin');
            return res.data;
        }
    });

    const approveMutation = useMutation({
        mutationFn: async (id) => {
            await api.put(`/payouts/admin/${id}/approve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['admin-payouts']);
            toast.success("Payout marked as processed!");
        },
        onError: () => {
            toast.error("Failed to approve payout.");
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#E97451]" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-[#E97451]" />
                    Instructor Payout Requests
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Manage and approve payout requests from instructors.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="p-4 font-semibold text-gray-900 dark:text-white">Instructor</th>
                                <th className="p-4 font-semibold text-gray-900 dark:text-white">Amount</th>
                                <th className="p-4 font-semibold text-gray-900 dark:text-white">Date Requested</th>
                                <th className="p-4 font-semibold text-gray-900 dark:text-white">Status</th>
                                <th className="p-4 font-semibold text-gray-900 dark:text-white text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {payouts?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No payout requests found.
                                    </td>
                                </tr>
                            ) : (
                                payouts?.map(payout => (
                                    <tr key={payout.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 dark:text-white">{payout.instructor.name}</div>
                                            <div className="text-xs text-gray-500">{payout.instructor.email}</div>
                                        </td>
                                        <td className="p-4 font-bold text-gray-900 dark:text-white">
                                            ${parseFloat(payout.amount).toFixed(2)}
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            {new Date(payout.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                                payout.status === 'PROCESSED' 
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                            }`}>
                                                {payout.status === 'PROCESSED' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                                {payout.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            {payout.status === 'PENDING' && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Have you actually transferred these funds via your bank/payment processor?')) {
                                                            approveMutation.mutate(payout.id);
                                                        }
                                                    }}
                                                    disabled={approveMutation.isPending}
                                                    className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-black transition-colors disabled:opacity-50"
                                                >
                                                    Mark Processed
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
