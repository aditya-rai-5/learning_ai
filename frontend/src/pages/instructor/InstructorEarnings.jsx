import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../lib/api'
import { DollarSign, ArrowUpRight, ArrowDownRight, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function InstructorEarnings() {
    const queryClient = useQueryClient()
    const [payoutAmount, setPayoutAmount] = useState('')

    const { data: earnings, isLoading } = useQuery({
        queryKey: ['instructor-earnings'],
        queryFn: async () => {
            const res = await api.get('/instructor/earnings')
            return res.data
        }
    })

    const payoutMutation = useMutation({
        mutationFn: async (amount) => {
            await api.post('/instructor/payouts', { amount })
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['instructor-earnings'])
            toast.success("Payout request submitted successfully!")
            setPayoutAmount('')
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || "Failed to request payout")
        }
    })

    const handleRequestPayout = (e) => {
        e.preventDefault()
        if (!payoutAmount || isNaN(payoutAmount) || Number(payoutAmount) <= 0) {
            toast.error("Please enter a valid amount")
            return
        }
        if (Number(payoutAmount) > earnings?.availableBalance) {
            toast.error("Amount exceeds available balance")
            return
        }
        payoutMutation.mutate(payoutAmount)
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#E97451]" />
            </div>
        )
    }

    if (!earnings) return null

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-[#E97451]" />
                    Earnings & Payouts
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Track your revenue from course sales and request withdrawals to your bank account.
                </p>
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg text-sm border border-blue-100 dark:border-blue-800/50">
                    <strong>Note:</strong> When a student pays for your course, the funds are initially held by the platform. 
                    Your "Available Balance" reflects what is owed to you. You can request a payout here, which our team will process and send to your registered bank account.
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                            <ArrowDownRight className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Balance</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">${earnings.availableBalance.toFixed(2)}</h3>
                        </div>
                    </div>
                    
                    <form onSubmit={handleRequestPayout} className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input 
                                type="number" 
                                min="1"
                                step="0.01"
                                max={earnings.availableBalance}
                                value={payoutAmount}
                                onChange={(e) => setPayoutAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-[#E97451] dark:text-white"
                                disabled={earnings.availableBalance <= 0}
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={earnings.availableBalance <= 0 || payoutMutation.isPending}
                            className="bg-[#E97451] hover:bg-[#FF855C] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {payoutMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Request Payout"}
                        </button>
                    </form>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <ArrowUpRight className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Lifetime Earnings</p>
                            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">${earnings.totalEarnings.toFixed(2)}</h3>
                        </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                        Total revenue generated from all your courses across the lifetime of your account.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Transactions */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Recent Sales</h2>
                    <div className="space-y-4">
                        {earnings.recentTransactions?.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No recent sales found.</p>
                        ) : (
                            earnings.recentTransactions?.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white text-sm">{tx.course.title}</p>
                                        <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleDateString()} • {tx.user.name}</p>
                                    </div>
                                    <span className="font-bold text-green-600 dark:text-green-400 text-sm">
                                        +${parseFloat(tx.amount).toFixed(2)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Payout History */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Payout History</h2>
                    <div className="space-y-4">
                        {earnings.payoutHistory?.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-4">No payout requests yet.</p>
                        ) : (
                            earnings.payoutHistory?.map(payout => (
                                <div key={payout.id} className="flex items-center justify-between p-3 border border-gray-100 dark:border-gray-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        {payout.status === 'PROCESSED' ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <Clock className="w-5 h-5 text-orange-500" />
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white text-sm">Withdrawal to Bank</p>
                                            <p className="text-xs text-gray-500">{new Date(payout.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-gray-900 dark:text-white text-sm block">
                                            ${parseFloat(payout.amount).toFixed(2)}
                                        </span>
                                        <span className={`text-xs font-medium ${payout.status === 'PROCESSED' ? 'text-green-500' : 'text-orange-500'}`}>
                                            {payout.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
