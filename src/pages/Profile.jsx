import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
    User as UserIcon,
    Mail,
    Phone,
    Lock,
    Shield,
    CheckCircle2,
    AlertCircle,
    Package,
    HandMetal,
    Calendar,
    Save,
    KeyRound,
    ArrowRight,
    Loader2
} from 'lucide-react';

export default function Profile() {
    const { user, updateUser, logout } = useAuth();

    // Profile Details Form State
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');
    const [memberSince, setMemberSince] = useState('');
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError] = useState('');

    // Change Password Form State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Activity Stats State
    const [stats, setStats] = useState({
        itemsCount: 0,
        claimsCount: 0
    });

    useEffect(() => {
        const fetchUserData = async () => {
            setLoadingProfile(true);
            try {
                const [meRes, itemsRes, claimsRes] = await Promise.all([
                    api.get('/auth/me').catch(() => ({ data: user })),
                    api.get('/items/my-items').catch(() => ({ data: [] })),
                    api.get('/claims/my-claims').catch(() => ({ data: [] }))
                ]);

                if (meRes.data) {
                    setName(meRes.data.name || '');
                    setPhoneNumber(meRes.data.phoneNumber || '');
                    setEmail(meRes.data.email || '');
                    setRole(meRes.data.role || 'ROLE_USER');
                    setMemberSince(meRes.data.createdAt || '');
                }

                setStats({
                    itemsCount: Array.isArray(itemsRes.data) ? itemsRes.data.length : (itemsRes.data?.content?.length || 0),
                    claimsCount: Array.isArray(claimsRes.data) ? claimsRes.data.length : (claimsRes.data?.content?.length || 0)
                });
            } catch (err) {
                console.error('Failed to load profile data', err);
            } finally {
                setLoadingProfile(false);
            }
        };

        void fetchUserData();
    }, []);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');
        setSavingProfile(true);

        try {
            const res = await api.put('/auth/profile', {
                name: name.trim(),
                phoneNumber: phoneNumber.trim() || null
            });

            updateUser({
                name: res.data.name,
                phoneNumber: res.data.phoneNumber
            });

            setProfileSuccess('Profile details updated successfully!');
            setTimeout(() => setProfileSuccess(''), 4000);
        } catch (err) {
            setProfileError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('New password and confirmation do not match.');
            return;
        }

        setSavingPassword(true);
        try {
            await api.post('/auth/change-password', {
                oldPassword,
                newPassword
            });

            setPasswordSuccess('Password changed successfully!');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordSuccess(''), 4000);
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Current password incorrect or update failed.');
        } finally {
            setSavingPassword(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Active Member';
        const d = new Date(dateStr);
        return isNaN(d.getTime())
            ? 'Active Member'
            : d.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
    };

    const isAdmin = role === 'ROLE_ADMIN' || role === 'ADMIN';

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
            {/* Profile Header Card */}
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft mb-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* Avatar Initial Circle */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white flex items-center justify-center text-3xl font-black shadow-glow-primary flex-shrink-0">
                        {name ? name.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U')}
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                                {name || 'User Profile'}
                            </h1>
                            <span
                                className={`text-xs font-black uppercase px-3 py-1 rounded-full self-center sm:self-auto border ${
                                    isAdmin
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}
                            >
                                {isAdmin ? 'Campus Moderator' : 'Verified Campus User'}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 mt-2">
                            <div className="flex items-center gap-1.5">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>{email || 'No email registered'}</span>
                            </div>
                            {phoneNumber && (
                                <div className="flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>{phoneNumber}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <span>Member since {formatDate(memberSince)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Badges */}
                    <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-center">
                            <span className="text-xl font-black text-indigo-600 block">
                                {stats.itemsCount}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Listings
                            </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 text-center">
                            <span className="text-xl font-black text-emerald-600 block">
                                {stats.claimsCount}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Claims
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Form Sections: 2-Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Personal Information Form */}
                <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <UserIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Personal Details</h2>
                                <p className="text-xs text-slate-500">
                                    Update your contact info for seamless handover communication.
                                </p>
                            </div>
                        </div>

                        {profileSuccess && (
                            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                <span>{profileSuccess}</span>
                            </div>
                        )}

                        {profileError && (
                            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{profileError}</span>
                            </div>
                        )}

                        <form id="profile-form" onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Full Display Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Your Full Name"
                                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Phone Number (SMS / WhatsApp Handover)
                                </label>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition"
                                />
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                    Shared with claimants or finders during verified handovers.
                                </span>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Email Address (Account Identifier)
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    value={email}
                                    className="w-full text-xs p-3 bg-slate-100 text-slate-500 border border-slate-200 rounded-xl cursor-not-allowed"
                                />
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                    Contact administrator if you need to alter your institutional email.
                                </span>
                            </div>
                        </form>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100">
                        <button
                            type="submit"
                            form="profile-form"
                            disabled={savingProfile || loadingProfile}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-soft disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {savingProfile ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Saving Changes...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Update Details</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right: Security & Change Password Form */}
                <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-soft flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900">Security & Password</h2>
                                <p className="text-xs text-slate-500">
                                    Safeguard your custody credentials and account access.
                                </p>
                            </div>
                        </div>

                        {passwordSuccess && (
                            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                                <span>{passwordSuccess}</span>
                            </div>
                        )}

                        {passwordError && (
                            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold rounded-xl flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{passwordError}</span>
                            </div>
                        )}

                        <form id="password-form" onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-amber-500/10 transition"
                                />
                            </div>
                        </form>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100">
                        <button
                            type="submit"
                            form="password-form"
                            disabled={savingPassword || !oldPassword || !newPassword}
                            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-soft disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {savingPassword ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Changing Password...</span>
                                </>
                            ) : (
                                <>
                                    <KeyRound className="w-4 h-4" />
                                    <span>Save New Password</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Links Footer Card */}
            <div className="mt-8 bg-slate-50 border border-slate-200/90 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Package className="w-5 h-5 text-indigo-600" />
                    <div>
                        <h4 className="text-xs font-bold text-slate-800">Manage Your Submissions & Claims</h4>
                        <p className="text-[11px] text-slate-500">View status tracking, handover PINs, and pending approvals.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Link
                        to="/my-items"
                        className="flex-1 sm:flex-initial px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-soft transition text-center inline-flex items-center justify-center gap-1.5"
                    >
                        <span>View My Items</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                        to="/notifications"
                        className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-soft transition text-center"
                    >
                        Notifications
                    </Link>
                </div>
            </div>
        </div>
    );
}
