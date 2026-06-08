import { useState } from 'react'
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    BookOpen, LayoutDashboard, GraduationCap, GitBranch,
    MessageSquare, Bookmark, User, Settings, LogOut,
    Bell, Search, ChevronLeft, ChevronRight
} from 'lucide-react'

const NAV_ITEMS = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/my-courses', icon: GraduationCap, label: 'My Courses' },
    { to: '/learning-paths', icon: GitBranch, label: 'Learning Paths' },
    { to: '/community', icon: MessageSquare, label: 'Community' },
    { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
]

const BOTTOM_ITEMS = [
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
]

function Sidebar({ collapsed, setCollapsed }) {
    const { logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <aside
            className={`hidden md:flex flex-col bg-gray-900 text-gray-300 shrink-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* Brand */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800 overflow-hidden">
                <BookOpen className="w-6 h-6 text-[#FF855C] shrink-0" />
                {!collapsed && <span className="font-bold text-white text-lg whitespace-nowrap">LearnAI</span>}
            </div>

            {/* Main nav */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        title={collapsed ? label : undefined}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-[#E97451] text-white'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        <Icon className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>{label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* Bottom nav */}
            <div className="px-2 py-4 border-t border-gray-800 space-y-1">
                {BOTTOM_ITEMS.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        title={collapsed ? label : undefined}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        <Icon className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>{label}</span>}
                    </NavLink>
                ))}
                <button
                    onClick={handleLogout}
                    title={collapsed ? 'Log out' : undefined}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>Log out</span>}
                </button>
            </div>

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="flex items-center justify-center py-3 border-t border-gray-800 text-gray-500 hover:text-white transition-colors"
            >
                {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
        </aside>
    )
}

function DashboardHeader() {
    const { user } = useAuth()

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center gap-4 shrink-0 transition-colors">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="search"
                    placeholder="Search courses, modules..."
                    className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFF0E8]0 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400"
                />
            </div>

            <div className="flex items-center gap-3 ml-auto">
                {/* Notifications bell */}
                <button className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Bell className="w-5 h-5" />
                    {/* Red dot — conditionally render when unread > 0 */}
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* Avatar */}
                <button className="w-8 h-8 bg-[#E97451] rounded-full flex items-center justify-center text-white text-sm font-bold hover:ring-2 hover:ring-[#FF855C] transition-all uppercase">
                    {user?.name?.charAt(0) || 'A'}
                </button>
            </div>
        </header>
    )
}

export default function StudentDashboardLayout() {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 transition-colors">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader />
                <main className="flex-1 p-6 overflow-auto text-gray-900 dark:text-gray-100">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}