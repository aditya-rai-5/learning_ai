import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import {
    BookOpen, LayoutDashboard, GraduationCap, GitBranch,
    MessageSquare, Bookmark, User, Settings, LogOut,
    Bell, Search, ChevronLeft, ChevronRight, Award, Check
} from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'

const NAV_ITEMS = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/my-courses', icon: GraduationCap, label: 'My Courses' },
    { to: '/learning-paths', icon: GitBranch, label: 'Learning Paths' },
    { to: '/certificates', icon: Award, label: 'Certificates' },
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
    const [showNotifications, setShowNotifications] = useState(false)
    const dropdownRef = useRef(null)
    const queryClient = useQueryClient()

    const { data: notifications } = useQuery({
        queryKey: ['notifications'],
        queryFn: async () => {
            const res = await api.get('/notifications')
            return res.data
        },
        refetchInterval: 30000 // Poll every 30s
    })

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            return api.patch('/notifications/read-all')
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications'])
        }
    })

    const markReadMutation = useMutation({
        mutationFn: async (id) => {
            return api.patch(`/notifications/${id}/read`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications'])
        }
    })

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const unreadCount = notifications?.filter(n => !n.isRead).length || 0

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center gap-4 shrink-0 transition-colors z-40">
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
                <ThemeToggle />
                
                {/* Notifications bell */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full" />
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl overflow-hidden z-50">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={() => markAllReadMutation.mutate()}
                                        className="text-xs text-[#E97451] hover:text-[#D05D3A] font-medium"
                                    >
                                        Mark all as read
                                    </button>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {!notifications || notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        No notifications yet
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {notifications.map(notification => (
                                            <div 
                                                key={notification.id} 
                                                className={`p-4 flex items-start gap-3 transition-colors ${!notification.isRead ? 'bg-[#FFF0E8]/50 dark:bg-[#E97451]/5' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
                                            >
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-900 dark:text-gray-100">{notification.message}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{new Date(notification.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                {!notification.isRead && (
                                                    <button 
                                                        onClick={() => markReadMutation.mutate(notification.id)}
                                                        className="p-1.5 text-gray-400 hover:text-green-500 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

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