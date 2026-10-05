import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const isAdmin = Boolean(
        user.role === 'ROLE_ADMIN' ||
        user.role === 'ADMIN' ||
        user.roles?.includes('ROLE_ADMIN') ||
        user.roles?.includes('ADMIN')
    );

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
}