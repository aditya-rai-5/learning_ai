import { useState, useEffect } from 'react'
import { Outlet, Link, NavLink } from 'react-router-dom'
import { BookOpen, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

const NAV_LINKS = [
    { to: '/courses', label: 'Courses' },
    { to: '/community', label: 'Community' },
]

function Navbar() {
    const [open, setOpen] = useState(false)
    const { user } = useAuth()

    return (
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 font-bold text-xl text-[#E97451] dark:text-[#FF855C]">
                        <BookOpen className="w-6 h-6" />
                        LearnAI
                    </Link>

                    {/* Desktop nav links */}
                    <nav className="hidden md:flex items-center gap-6">
                        {NAV_LINKS.map(({ to, label }) => (
                            <NavLink
                                key={to}
                                to={to}
                                className={({ isActive }) =>
                                    `text-sm font-medium transition-colors ${isActive ? 'text-[#E97451] dark:text-[#FF855C]' : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                                    }`
                                }
                            >
                                {label}
                            </NavLink>
                        ))}
                    </nav>

                    {/* Desktop auth */}
                    <div className="hidden md:flex items-center gap-3">
                        <ThemeToggle />
                        {user ? (
                            <Link
                                to="/dashboard"
                                className="text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                            >
                                Go to Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    Log in
                                </Link>
                                <Link
                                    to="/register"
                                    className="text-sm font-semibold bg-[#E97451] text-white px-4 py-2 rounded-lg hover:bg-[#D05D3A] transition-colors"
                                >
                                    Get started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile hamburger */}
                    <div className="md:hidden flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            onClick={() => setOpen(!open)}
                            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
                        >
                            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {open && (
                <div className="md:hidden border-t border-gray-100 dark:border-gray-800 px-4 py-3 space-y-1 bg-white dark:bg-gray-900 shadow-lg">
                    {NAV_LINKS.map(({ to, label }) => (
                        <Link
                            key={to}
                            to={to}
                            onClick={() => setOpen(false)}
                            className="block px-3 py-2 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            {label}
                        </Link>
                    ))}
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                        {user ? (
                            <Link to="/dashboard" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-md text-center hover:bg-gray-800 dark:hover:bg-gray-100">Go to Dashboard</Link>
                        ) : (
                            <>
                                <Link to="/login" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md">Log in</Link>
                                <Link to="/register" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm bg-[#E97451] text-white rounded-md text-center hover:bg-[#D05D3A]">Get started</Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    )
}

function Footer() {
    const sections = [
        { title: 'Product', links: ['Courses', 'Community', 'Pricing'] },
        { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
        { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies'] },
    ]
    return (
        <footer className="bg-gray-900 text-gray-400 py-12 mt-16 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <div className="flex items-center gap-2 text-white font-bold mb-3">
                            <BookOpen className="w-5 h-5 text-[#FF855C]" />
                            LearnAI
                        </div>
                        <p className="text-sm">AI-powered engineering education platform built on Groq + Mistral.</p>
                    </div>
                    {sections.map(({ title, links }) => (
                        <div key={title}>
                            <h4 className="text-white font-medium mb-3 text-sm">{title}</h4>
                            <ul className="space-y-2">
                                {links.map(l => (
                                    <li key={l}><a href="#" className="text-sm hover:text-white transition-colors">{l}</a></li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
                    © {new Date().getFullYear()} LearnAI. All rights reserved.
                </div>
            </div>
        </footer>
    )
}

export default function PublicLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors">
            <Navbar />
            <main className="flex-1"><Outlet /></main>
            <Footer />
        </div>
    )
}