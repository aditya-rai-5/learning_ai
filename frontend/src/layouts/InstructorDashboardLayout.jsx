import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import {
    LayoutDashboard, BookOpen, MessageSquare, Settings, LogOut,
    Bell, Search, ChevronLeft, ChevronRight, User, PlusCircle, ShieldAlert
} from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'

const NAV_ITEMS = [
    { to: '/instructor/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/instructor/courses', icon: BookOpen, label: 'My Courses' },
    { to: '/instructor/qa', icon: MessageSquare, label: 'Student Q&A' },
]

const BOTTOM_ITEMS = [
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
]

function Sidebar({ collapsed, setCollapsed }) {
    const { logout, user } = useAuth()
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
                {!collapsed && <span className="font-bold text-white text-lg whitespace-nowrap">LearnAI <span className="text-xs bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">Instructor</span></span>}
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
                {user?.role === 'ADMIN' && (
                    <NavLink
                        to="/admin/dashboard"
                        title={collapsed ? 'Admin Mode' : undefined}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-purple-400 hover:bg-purple-900/20`
                        }
                    >
                        <ShieldAlert className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>Admin Mode</span>}
                    </NavLink>
                )}
                <NavLink
                    to="/dashboard"
                    title={collapsed ? 'Student Mode' : undefined}
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-blue-400 hover:bg-blue-900/20`
                    }
                >
                    <LayoutDashboard className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>Student Mode</span>}
                </NavLink>
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

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNotifications(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center gap-4 shrink-0 transition-colors z-40">
            {/* Search */}
            <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="search"
                    placeholder="Search..."
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
                    </button>
                </div>

                {/* Avatar */}
                <button className="w-8 h-8 bg-[#E97451] rounded-full flex items-center justify-center text-white text-sm font-bold hover:ring-2 hover:ring-[#FF855C] transition-all uppercase">
                    {user?.name?.charAt(0) || 'I'}
                </button>
            </div>
        </header>
    )
}

export default function InstructorDashboardLayout() {
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950 transition-colors">
            <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <DashboardHeader />
                <main className="flex-1 overflow-auto text-gray-900 dark:text-gray-100">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
