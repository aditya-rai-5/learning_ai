import { Link } from 'react-router-dom'
export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
            <p className="text-7xl font-bold text-[#E97451] mb-4">404</p>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Page not found</h1>
            <p className="text-gray-500 mb-8">That page doesn't exist or has been moved.</p>
            <Link to="/" className="bg-[#E97451] text-white px-5 py-2.5 rounded-lg hover:bg-[#D05D3A] transition-colors">
                Go home
            </Link>
        </div>
    )
}
