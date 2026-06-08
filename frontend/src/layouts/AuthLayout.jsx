import { Outlet, Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'

export default function AuthLayout() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFF0E8] via-white to-[#F5F5DC] dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col items-center justify-center p-4 transition-colors">

            {/* Brand */}
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-[#E97451] dark:text-[#FF855C] mb-8">
                <BookOpen className="w-7 h-7" />
                LearnAI
            </Link>

            {/* Card */}
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl ring-1 ring-gray-100 dark:ring-gray-800 p-8 transition-colors">
                <Outlet />
            </div>

            <Link to="/" className="mt-6 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                ← Back to home
            </Link>
        </div>
    )
}