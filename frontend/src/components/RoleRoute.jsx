import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Protects routes that require ANY logged in user
export function ProtectedRoute() {
    const { user, loading } = useAuth();

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}

// Redirects already logged in users away from auth pages (login/register)
export function GuestRoute() {
    const { user, loading } = useAuth();

    if (loading) return null;

    if (user) {
        // We could route based on role here, but /dashboard is fine for all
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}
