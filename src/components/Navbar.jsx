import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    Bell,
    LogOut,
    MessageSquare,
    ShieldCheck,
    CheckCircle2,
    PlusCircle,
    Compass,
    Menu,
    X,
    User as UserIcon,
    Layers,
    ChevronDown,
    Inbox,
    Sun,
    Moon,
    QrCode,
    Search
} from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getWebSocketUrl } from '../utils/wsUrl';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
    const { user, token, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [systemNotifications, setSystemNotifications] = useState([]);
    const [messageNotifications, setMessageNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeNotifTab, setActiveNotifTab] = useState('ALL'); // 'ALL' | 'MESSAGES' | 'SYSTEM'
    const dropdownRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Safely parse user whether AuthContext provides a JSON string or an object
    const parsedUser = typeof user === 'string' ? (() => {
        try { return JSON.parse(user); } catch { return null; }
    })() : user;

    const currentUserId = parsedUser?.id;
    const userEmail = parsedUser?.email;

    const isAdmin = Boolean(
        parsedUser && (
            parsedUser.role === 'ROLE_ADMIN' ||
            parsedUser.role === 'ADMIN' ||
            parsedUser.roles?.includes('ROLE_ADMIN') ||
            parsedUser.roles?.includes('ADMIN')
        )
    );

    const handleLogout = () => {
        logout();
        setMobileMenuOpen(false);
        navigate('/login');
    };

    const handleBrowse = (e) => {
        if (e) e.preventDefault();
        setMobileMenuOpen(false);
        if (location.pathname !== '/') {
            navigate('/#items');
        } else {
            const el = document.getElementById('items') || document.getElementById('browse-section') || document.getElementById('catalog');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 400, behavior: 'smooth' });
            }
        }
    };

    const fetchAllNotifications = useCallback(async () => {
        if (!token || !parsedUser) {
            setSystemNotifications([]);
            setMessageNotifications([]);
            return;
        }

        try {
            // 1. Fetch system notifications from /api/notifications
            const notifsPromise = api.get('/notifications')
                .then((res) => {
                    const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
                    return list.filter((n) => !n.read && !n.isRead);
                })
                .catch(() => []);

            // 2. Fetch unread messages inbox
            const messagesPromise = currentUserId
                ? api.get(`/messages/inbox/${currentUserId}`)
                    .then((res) => (Array.isArray(res.data) ? res.data : []))
                    .catch(() => [])
                : Promise.resolve([]);

            const [notifsList, messagesList] = await Promise.all([notifsPromise, messagesPromise]);

            setSystemNotifications(notifsList);
            setMessageNotifications(messagesList);
        } catch (err) {
            console.error('Failed to fetch activity notifications', err);
        }
    }, [token, parsedUser, currentUserId]);

    // Initial load + refresh listener + fallback polling
    useEffect(() => {
        void fetchAllNotifications();

        const handleRefresh = () => void fetchAllNotifications();
        window.addEventListener('notifications:refresh', handleRefresh);

        // Poll every 45 seconds as fallback to live WebSockets
        const interval = setInterval(() => {
            void fetchAllNotifications();
        }, 45000);

        return () => {
            clearInterval(interval);
            window.removeEventListener('notifications:refresh', handleRefresh);
        };
    }, [fetchAllNotifications]);

    // Live STOMP WebSocket Connection for Instant Notifications
    useEffect(() => {
        if (!currentUserId || !token) return;

        const stompClient = new Client({
            webSocketFactory: () => new SockJS(getWebSocketUrl()),
            reconnectDelay: 5000,
            onConnect: () => {
                stompClient.subscribe(`/topic/users/${currentUserId}/messages`, (frame) => {
                    try {
                        const incomingMessage = JSON.parse(frame.body);
                        setMessageNotifications((prev) => {
                            if (prev.some((m) => m.id === incomingMessage.id)) return prev;
                            return [incomingMessage, ...prev];
                        });

                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('New LostLink Chat Message', {
                                body: `${incomingMessage.senderName || 'Someone'}: ${incomingMessage.content || 'Sent a message'}`,
                                icon: '/favicon.svg'
                            });
                        }
                    } catch (err) {
                        console.error('Failed to parse STOMP message frame', err);
                    }
                });

                stompClient.subscribe(`/topic/users/${currentUserId}/notifications`, (frame) => {
                    try {
                        const incomingNotif = JSON.parse(frame.body);
                        setSystemNotifications((prev) => {
                            if (prev.some((n) => n.id === incomingNotif.id)) return prev;
                            return [incomingNotif, ...prev];
                        });
                        window.dispatchEvent(new Event('notifications:refresh'));

                        if ('Notification' in window && Notification.permission === 'granted') {
                            new Notification('LostLink Campus Update', {
                                body: incomingNotif.message || 'You have a new activity update.',
                                icon: '/favicon.svg'
                            });
                        }
                    } catch (err) {
                        console.error('Failed to parse STOMP notification frame', err);
                    }
                });
            },
            onStompError: (frame) => {
                console.warn('STOMP Broker Error:', frame.headers['message']);
            }
        });

        stompClient.activate();

        return () => {
            stompClient.deactivate();
        };
    }, [currentUserId, token]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close mobile menu when route changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const handleNotificationClick = async (notification) => {
        setShowDropdown(false);
        setSystemNotifications((prev) => prev.filter((n) => n.id !== notification.id));

        try {
            await api.patch(`/notifications/${notification.id}/read`);
        } catch (err) {
            console.error('Failed to mark notification as read', err);
        }

        if (notification.relatedItemId) {
            navigate(`/items/${notification.relatedItemId}`);
        } else {
            navigate('/notifications');
        }
    };

    const handleMessageClick = async (msg) => {
        setShowDropdown(false);
        setMessageNotifications((prev) => prev.filter((m) => m.id !== msg.id));

        if (currentUserId && msg.itemId) {
            try {
                await api.patch(`/messages/item/${msg.itemId}/read`, null, {
                    params: { userId: currentUserId }
                });
            } catch (err) {
                console.error('Failed to mark message thread as read', err);
            }
        }

        navigate(`/items/${msg.itemId}?openChat=true`);
    };

    const totalAlerts = systemNotifications.length + messageNotifications.length;

    const isActive = (path) => location.pathname === path;

    return (
        <header className="sticky top-0 z-50 w-full max-w-full overflow-x-hidden bg-white/85 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-16 flex items-center justify-between gap-2 sm:gap-4">
                    {/* Brand Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-soft group-hover:scale-105 transition-transform">
                            <Compass className="w-5 h-5 transition-transform group-hover:rotate-45" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors">
                                Lost<span className="text-indigo-600 dark:text-indigo-400">Link</span>
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 -mt-1 hidden sm:block">
                                Campus Hub
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                        <Link
                            to="/"
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                isActive('/')
                                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
                            }`}
                        >
                            Browse Feed
                        </Link>

                        {token && (
                            <Link
                                to="/my-items"
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                    isActive('/my-items')
                                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50'
                                }`}
                            >
                                My Activities
                            </Link>
                        )}

                        {isAdmin && (
                            <Link
                                to="/admin"
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    isActive('/admin')
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-indigo-700 dark:text-indigo-300 bg-indigo-50/70 dark:bg-indigo-950/60 hover:bg-indigo-100/80'
                                }`}
                            >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Moderator Panel</span>
                            </Link>
                        )}
                    </nav>

                    {/* Command Palette Trigger Button (Ctrl + K) */}
                    <button
                        type="button"
                        onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs border border-slate-200/60 dark:border-slate-700/60 transition-all"
                        title="Quick Search or Jump to Page (Ctrl + K)"
                    >
                        <Search className="w-3.5 h-3.5" />
                        <span>Search...</span>
                        <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-400">
                            Ctrl K
                        </kbd>
                    </button>

                    {/* Right Hand Controls */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        {/* QR Code Tag Scanner Button */}
                        <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent('open-qr-scanner'))}
                            className="hidden sm:flex p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            title="Scan QR Tag or Flyer"
                        >
                            <QrCode className="w-5 h-5" />
                        </button>

                        {/* Theme Switcher Toggle (Light / Dark) */}
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="hidden sm:flex p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-5 h-5 text-amber-400" />
                            ) : (
                                <Moon className="w-5 h-5" />
                            )}
                        </button>
                        {token ? (
                            <>
                                {/* Quick Report Item Button */}
                                <Link
                                    to="/create-item"
                                    className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-2 rounded-xl shadow-soft hover:shadow-glow-emerald transition-all active:scale-95"
                                >
                                    <PlusCircle className="w-4 h-4" />
                                    <span>Report Item</span>
                                </Link>

                                {/* Notification Dropdown Popover */}
                                <div className="relative" ref={dropdownRef}>
                                    <button
                                        type="button"
                                        onClick={() => setShowDropdown((prev) => !prev)}
                                        className={`relative p-2.5 rounded-xl transition-all ${
                                            showDropdown
                                                ? 'bg-indigo-50 text-indigo-600'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                        }`}
                                        aria-label="View notifications"
                                    >
                                        <Bell className="w-5 h-5" />
                                        {totalAlerts > 0 && (
                                            <span className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-black text-white bg-rose-500 rounded-full ring-2 ring-white animate-pulse">
                                                {totalAlerts > 9 ? '9+' : totalAlerts}
                                            </span>
                                        )}
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showDropdown && (
                                        <div className="absolute right-0 mt-3 w-84 sm:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-soft-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                            {/* Header */}
                                            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-800">
                                                        Notifications
                                                    </span>
                                                    {totalAlerts > 0 && (
                                                        <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                            {totalAlerts} new
                                                        </span>
                                                    )}
                                                </div>
                                                <Link
                                                    to="/notifications"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                                                >
                                                    View All &rarr;
                                                </Link>
                                            </div>

                                            {/* Filter Tabs */}
                                            <div className="px-3 pt-2 pb-1 flex gap-1 border-b border-slate-100 text-xs">
                                                <button
                                                    onClick={() => setActiveNotifTab('ALL')}
                                                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                                                        activeNotifTab === 'ALL'
                                                            ? 'bg-slate-100 text-slate-900 font-bold'
                                                            : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                                >
                                                    All ({totalAlerts})
                                                </button>
                                                <button
                                                    onClick={() => setActiveNotifTab('MESSAGES')}
                                                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                                                        activeNotifTab === 'MESSAGES'
                                                            ? 'bg-slate-100 text-slate-900 font-bold'
                                                            : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                                >
                                                    Chats ({messageNotifications.length})
                                                </button>
                                                <button
                                                    onClick={() => setActiveNotifTab('SYSTEM')}
                                                    className={`px-2.5 py-1 rounded-lg font-medium transition ${
                                                        activeNotifTab === 'SYSTEM'
                                                            ? 'bg-slate-100 text-slate-900 font-bold'
                                                            : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                                >
                                                    System ({systemNotifications.length})
                                                </button>
                                            </div>

                                            {/* List body */}
                                            <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                                                {totalAlerts === 0 ? (
                                                    <div className="py-8 text-center px-4">
                                                        <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                                        <p className="text-xs font-semibold text-slate-600">All caught up!</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">No unread notifications or messages.</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Messages */}
                                                        {(activeNotifTab === 'ALL' || activeNotifTab === 'MESSAGES') &&
                                                            messageNotifications.map((msg) => (
                                                                <div
                                                                    key={`msg-${msg.id}`}
                                                                    onClick={() => handleMessageClick(msg)}
                                                                    className="p-3.5 hover:bg-indigo-50/50 transition cursor-pointer flex items-start gap-3 bg-indigo-50/20"
                                                                >
                                                                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                                                        <MessageSquare className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <div className="flex items-center justify-between">
                                                                            <p className="text-xs font-bold text-slate-800">
                                                                                Chat Reply
                                                                            </p>
                                                                            <span className="text-[10px] text-indigo-600 font-semibold">
                                                                                Open &rarr;
                                                                            </span>
                                                                        </div>
                                                                        <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                                                                            "{msg.content}"
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}

                                                        {/* System Notifications */}
                                                        {(activeNotifTab === 'ALL' || activeNotifTab === 'SYSTEM') &&
                                                            systemNotifications.map((n) => (
                                                                <div
                                                                    key={`notif-${n.id}`}
                                                                    onClick={() => handleNotificationClick(n)}
                                                                    className="p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3"
                                                                >
                                                                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                                                                        <CheckCircle2 className="w-4 h-4" />
                                                                    </div>
                                                                    <div className="min-w-0 flex-1">
                                                                        <p className="text-xs font-semibold text-slate-800 leading-snug">
                                                                            {n.message}
                                                                        </p>
                                                                        {n.createdAt && (
                                                                            <span className="text-[10px] text-slate-400 mt-1 inline-block">
                                                                                {new Date(n.createdAt).toLocaleTimeString([], {
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit'
                                                                                })}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                    </>
                                                )}
                                            </div>

                                            {/* Dropdown Footer */}
                                            <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between bg-slate-50/70 text-xs">
                                                <Link
                                                    to="/my-items?tab=claims"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="font-medium text-slate-600 hover:text-indigo-600 transition"
                                                >
                                                    Review Claims &rarr;
                                                </Link>
                                                <Link
                                                    to="/notifications"
                                                    onClick={() => setShowDropdown(false)}
                                                    className="font-bold text-indigo-600 hover:text-indigo-700 transition"
                                                >
                                                    Full Activity Feed
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* User Profile / Logout */}
                                <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-slate-200">
                                    <Link
                                        to="/profile"
                                        className="flex items-center gap-2 hover:bg-slate-100 p-1.5 rounded-xl transition group"
                                        title="View Profile & Settings"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                                            <UserIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col text-left">
                                            <span className="text-xs font-bold text-slate-800 truncate max-w-[120px] group-hover:text-indigo-600 transition">
                                                {userEmail?.split('@')[0]}
                                            </span>
                                            <span className="text-[10px] font-semibold text-slate-400 uppercase">
                                                {isAdmin ? 'Admin' : 'Profile'}
                                            </span>
                                        </div>
                                    </Link>

                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                        title="Sign Out"
                                    >
                                        <LogOut className="w-4 h-4" />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="hidden md:flex items-center gap-2">
                                <Link
                                    to="/login"
                                    className="text-xs font-bold text-slate-700 hover:text-indigo-600 px-3 py-2 rounded-xl transition"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl shadow-soft hover:shadow-glow-primary transition"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}

                        {/* Mobile Hamburger Menu Toggle */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen((prev) => !prev)}
                            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
                            aria-label="Toggle Navigation Menu"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation Drawer */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-3 border-t border-slate-200/80 space-y-2 animate-in slide-in-from-top-2 duration-150">
                        {/* Mobile Quick Action Strip (QR Scanner & Theme Toggle) */}
                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setMobileMenuOpen(false);
                                    window.dispatchEvent(new CustomEvent('open-qr-scanner'));
                                }}
                                className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600"
                            >
                                <QrCode className="w-4 h-4 text-indigo-500" />
                                <span>Scan QR Code</span>
                            </button>

                            <button
                                type="button"
                                onClick={toggleTheme}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200"
                            >
                                {theme === 'dark' ? (
                                    <>
                                        <Sun className="w-4 h-4 text-amber-400" />
                                        <span>Light</span>
                                    </>
                                ) : (
                                    <>
                                        <Moon className="w-4 h-4 text-indigo-600" />
                                        <span>Dark</span>
                                    </>
                                )}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={handleBrowse}
                            className={`w-full text-left block px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer touch-manipulation transition ${
                                isActive('/') ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            Browse Listings
                        </button>

                        {token ? (
                            <>
                                <Link
                                    to="/my-items"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block px-3 py-2 rounded-xl text-sm font-semibold ${
                                        isActive('/my-items') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    My Submissions & Claims
                                </Link>
                                <Link
                                    to="/create-item"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block px-3 py-2 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                                >
                                    + Report Lost or Found Item
                                </Link>
                                <Link
                                    to="/notifications"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block px-3 py-2 rounded-xl text-sm font-semibold ${
                                        isActive('/notifications') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    Notifications ({totalAlerts})
                                </Link>
                                <Link
                                    to="/profile"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`block px-3 py-2 rounded-xl text-sm font-semibold ${
                                        isActive('/profile') ? 'bg-indigo-50 text-indigo-600' : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                                >
                                    My Profile & Security
                                </Link>

                                {isAdmin && (
                                    <Link
                                        to="/admin"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-3 py-2 rounded-xl text-sm font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
                                    >
                                        Moderator Dashboard
                                    </Link>
                                )}

                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between px-3 text-xs text-slate-500">
                                    <span>Signed in as <strong className="text-slate-800">{userEmail}</strong></span>
                                    <button
                                        onClick={handleLogout}
                                        className="font-bold text-rose-600 hover:underline flex items-center gap-1"
                                    >
                                        <LogOut className="w-3.5 h-3.5" /> Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                                <Link
                                    to="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-center py-2 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-center py-2 text-sm font-bold text-white bg-indigo-600 rounded-xl"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}