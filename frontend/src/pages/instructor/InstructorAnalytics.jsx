import { useQuery } from '@tanstack/react-query'
import api from '../../lib/api'
import { TrendingUp, Clock, CheckCircle, Users, BookOpen, Loader2 } from 'lucide-react'

export default function InstructorAnalytics() {
    const { data: analytics, isLoading } = useQuery({
        queryKey: ['instructor-analytics'],
        queryFn: async () => {
            const res = await api.get('/instructor/analytics')
            return res.data
        }
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#E97451]" />
            </div>
        )
    }

    if (!analytics) return null

    const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        if (h > 0) return `${h}h ${m}m`
        return `${m}m`
    }

    // Prepare chart data (simple max scaling for CSS bars)
    const maxDuration = Math.max(...analytics.dailyTrends.map(d => d.durationS), 1)

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <TrendingUp className="w-8 h-8 text-[#E97451]" />
                    Engagement Analytics
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Track student engagement and course performance metrics.
                </p>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Study Time</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{formatDuration(analytics.totalStudyTimeS)}</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Completion Rate</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.overallCompletionRate}%</h3>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Courses</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.courseStats.length}</h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Daily Trends Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Study Time (Last 7 Days)</h2>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {analytics.dailyTrends.map((day, i) => {
                            const heightPercent = (day.durationS / maxDuration) * 100;
                            const dateObj = new Date(day.date);
                            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                    <div className="w-full flex-1 flex items-end justify-center rounded-t-sm relative">
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                            {formatDuration(day.durationS)}
                                        </div>
                                        <div 
                                            className="w-full max-w-[40px] bg-[#E97451] rounded-t-md transition-all duration-500"
                                            style={{ height: `${Math.max(heightPercent, 2)}%` }} // At least 2% so it's visible
                                        />
                                    </div>
                                    <span className="text-xs text-gray-500 font-medium">{dayName}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Performance by Course */}
                <div className="lg:col-span-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm overflow-hidden flex flex-col">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Course Performance</h2>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                        {analytics.courseStats.map(course => (
                            <div key={course.id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-3 truncate" title={course.title}>
                                    {course.title}
                                </h3>
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                                    <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {course.enrollments} enrollments</span>
                                    <span>{course.completionRate}% completed</span>
                                </div>
                                {/* Progress Bar */}
                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-green-500 rounded-full"
                                        style={{ width: `${course.completionRate}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {analytics.courseStats.length === 0 && (
                            <div className="text-center text-gray-500 text-sm py-8">
                                No courses available yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
