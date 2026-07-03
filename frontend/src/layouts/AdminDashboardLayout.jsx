import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    LayoutDashboard, Users, BookOpen, MessageSquare, Bell, LogOut,
    Search, ChevronLeft, ChevronRight, Settings, ShieldAlert, DollarSign
} from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'

const NAV_ITEMS = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/users', icon: Users, label: 'User Directory' },
    { to: '/admin/courses', icon: BookOpen, label: 'Course Catalog' },
    { to: '/admin/community', icon: MessageSquare, label: 'Community Mods' },
    { to: '/admin/notifications', icon: Bell, label: 'System Alerts' },
    { to: '/admin/payouts', icon: DollarSign, label: 'Payout Requests' },
]

function Sidebar({ collapsed, setCollapsed }) {
    const { logout, user } = useAuth()
    const navigate = useNavigate()

    return (
        <aside className={`hidden md:flex flex-col bg-gray-900 text-gray-300 shrink-0 transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
            <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800 overflow-hidden">
                <ShieldAlert className="w-6 h-6 text-purple-500 shrink-0" />
                {!collapsed && <span className="font-bold text-white text-lg whitespace-nowrap">LearnAI <span className="text-xs bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">Admin</span></span>}
            </div>

            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        title={collapsed ? label : undefined}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`
                        }
                    >
                        <Icon className="w-5 h-5 shrink-0" />
                        {!collapsed && <span>{label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="px-2 py-4 border-t border-gray-800 space-y-1">
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
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    title={collapsed ? 'Log out' : undefined}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors"
                >
                    <LogOut className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>Log out</span>}
                </button>
            </div>

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
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-end gap-4 shrink-0 transition-colors z-40">
            <ThemeToggle />
            <button className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold uppercase">
                {user?.name?.charAt(0) || 'A'}
            </button>
        </header>
    )
}

export default function AdminDashboardLayout() {
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
