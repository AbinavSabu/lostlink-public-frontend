import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, AlertCircle, Mail, Lock, Eye, EyeOff, Compass, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if the user was trying to access a guarded route before being sent to login
    const from = location.state?.from?.pathname;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const loggedInUser = await login(email, password);

            // Determine redirect target
            if (from) {
                navigate(from, { replace: true });
            } else if (
                loggedInUser?.role === 'ROLE_ADMIN' ||
                loggedInUser?.role === 'ADMIN' ||
                loggedInUser?.roles?.includes('ROLE_ADMIN')
            ) {
                navigate('/admin', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Invalid email or password. Please verify your credentials and try again.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-[82vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
            <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-soft-lg border border-slate-200/90 p-8 sm:p-10 space-y-6">
                {/* Brand header */}
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white mx-auto shadow-soft">
                        <Compass className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Sign in to track your items, manage claims, and chat with finders.
                    </p>
                </div>

                {error && (
                    <div className="flex items-start gap-3 text-rose-700 bg-rose-50 border border-rose-200 text-xs p-3.5 rounded-2xl animate-in fade-in">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
                        <span className="leading-relaxed font-medium">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Campus Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                                placeholder="student@university.edu"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-soft hover:shadow-glow-primary transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2 active:scale-98"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Authenticating...</span>
                            </>
                        ) : (
                            <>
                                <span>Sign In</span>
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </form>

                <div className="pt-2 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-500">
                        Don't have an account yet?{' '}
                        <Link to="/register" className="text-indigo-600 font-bold hover:underline">
                            Register now
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}