import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Command,
    PlusCircle,
    Package,
    Bell,
    Shield,
    User,
    Sun,
    Moon,
    QrCode,
    Tag,
    ArrowRight,
    Sparkles,
    X,
    Loader2
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getImageUrl } from '../utils/imageUrl';

export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const navigate = useNavigate();
    const { user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const inputRef = useRef(null);

    const parsedUser = typeof user === 'string' ? (() => {
        try { return JSON.parse(user); } catch { return null; }
    })() : user;

    const isAdmin = Boolean(
        parsedUser && (
            parsedUser.role === 'ROLE_ADMIN' ||
            parsedUser.role === 'ADMIN' ||
            parsedUser.roles?.includes('ROLE_ADMIN') ||
            parsedUser.roles?.includes('ADMIN')
        )
    );

    // Global shortcut Ctrl+K or Cmd+K
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            } else if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        const handleCustomOpen = () => setIsOpen(true);

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('open-command-palette', handleCustomOpen);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('open-command-palette', handleCustomOpen);
        };
    }, [isOpen]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setSearchResults([]);
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    // Live search items with debounce
    useEffect(() => {
        if (!query.trim() || query.trim().length < 2) {
            setSearchResults([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const timer = setTimeout(async () => {
            try {
                const res = await api.get('/items', { params: { keyword: query.trim() } });
                const list = res.data.content || res.data || [];
                setSearchResults(Array.isArray(list) ? list.slice(0, 6) : []);
            } catch {
                setSearchResults([]);
            } finally {
                setLoading(false);
            }
        }, 220);

        return () => clearTimeout(timer);
    }, [query]);

    // Static Navigation Actions
    const staticActions = [
        {
            id: 'report-lost',
            title: 'Report Lost Item',
            category: 'Actions',
            icon: PlusCircle,
            badge: 'Lost',
            action: () => navigate('/create-item?type=LOST')
        },
        {
            id: 'report-found',
            title: 'Report Found Item',
            category: 'Actions',
            icon: PlusCircle,
            badge: 'Found',
            action: () => navigate('/create-item?type=FOUND')
        },
        {
            id: 'scan-qr',
            title: 'Scan QR Tag / Flyer',
            category: 'Actions',
            icon: QrCode,
            action: () => window.dispatchEvent(new CustomEvent('open-qr-scanner'))
        },
        {
            id: 'my-items',
            title: 'My Items & Claims',
            category: 'Navigation',
            icon: Package,
            action: () => navigate('/my-items')
        },
        {
            id: 'notifications',
            title: 'Notification Center',
            category: 'Navigation',
            icon: Bell,
            action: () => navigate('/notifications')
        },
        {
            id: 'profile',
            title: 'My Profile & Activity',
            category: 'Navigation',
            icon: User,
            action: () => navigate('/profile')
        },
        ...(isAdmin
            ? [
                  {
                      id: 'admin',
                      title: 'Campus Security & Admin Dashboard',
                      category: 'Administration',
                      icon: Shield,
                      action: () => navigate('/admin')
                  }
              ]
            : []),
        {
            id: 'toggle-theme',
            title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`,
            category: 'Preferences',
            icon: theme === 'dark' ? Sun : Moon,
            action: toggleTheme
        }
    ];

    const filteredActions = query.trim()
        ? staticActions.filter((a) =>
              a.title.toLowerCase().includes(query.toLowerCase())
          )
        : staticActions;

    const allItems = [
        ...filteredActions.map((a) => ({ type: 'action', data: a })),
        ...searchResults.map((item) => ({ type: 'item', data: item }))
    ];

    const handleSelect = (entry) => {
        if (!entry) return;
        setIsOpen(false);
        if (entry.type === 'action') {
            entry.data.action();
        } else if (entry.type === 'item') {
            navigate(`/items/${entry.data.id}`);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + allItems.length) % (allItems.length || 1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (allItems[selectedIndex]) {
                handleSelect(allItems[selectedIndex]);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
            <div
                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100 transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Header */}
                <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
                    <Search className="w-5 h-5 text-slate-400 dark:text-slate-500 mr-3 flex-shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a command, search items, or jump to page..."
                        className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-base focus:outline-none"
                    />
                    {loading && (
                        <Loader2 className="w-4 h-4 text-indigo-600 animate-spin mr-2" />
                    )}
                    <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                        ESC
                    </kbd>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="ml-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 sm:hidden"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Results Body */}
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 divide-y divide-slate-100 dark:divide-slate-800/60">
                    {/* Actions List */}
                    {filteredActions.length > 0 && (
                        <div className="py-1">
                            <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                                Quick Commands &amp; Navigation
                            </div>
                            {filteredActions.map((action, idx) => {
                                const Icon = action.icon;
                                const isSelected = selectedIndex === idx;
                                return (
                                    <button
                                        key={action.id}
                                        onClick={() => handleSelect({ type: 'action', data: action })}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm transition-colors ${
                                            isSelected
                                                ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium">{action.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {action.badge && (
                                                <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                                                    {action.badge}
                                                </span>
                                            )}
                                            <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Matched Items */}
                    {searchResults.length > 0 && (
                        <div className="py-2">
                            <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                Matching Lost &amp; Found Listings
                            </div>
                            {searchResults.map((item, idx) => {
                                const realIdx = filteredActions.length + idx;
                                const isSelected = selectedIndex === realIdx;
                                const isLost = (item.status || '').toUpperCase() === 'LOST';
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleSelect({ type: 'item', data: item })}
                                        onMouseEnter={() => setSelectedIndex(realIdx)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${
                                            isSelected
                                                ? 'bg-indigo-50 dark:bg-indigo-950/40'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {item.imageUrl ? (
                                                <img
                                                    src={getImageUrl(item.imageUrl)}
                                                    alt=""
                                                    className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-slate-200 dark:border-slate-700"
                                                />
                                            ) : (
                                                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400">
                                                    <Tag className="w-4 h-4" />
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                    {item.title}
                                                </div>
                                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-2">
                                                    <span>{item.category}</span>
                                                    <span>&bull;</span>
                                                    <span>{item.location}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span
                                                className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                                    isLost
                                                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                                                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                }`}
                                            >
                                                {item.status}
                                            </span>
                                            <ArrowRight className="w-4 h-4 text-slate-400" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {query.trim() && allItems.length === 0 && !loading && (
                        <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                            No commands or listings found for "{query}".
                        </div>
                    )}
                </div>

                {/* Footer instructions */}
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span>Navigate <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd></span>
                        <span>Select <kbd className="font-mono">↵</kbd></span>
                        <span>Close <kbd className="font-mono">esc</kbd></span>
                    </div>
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">Campus QuickSearch</span>
                </div>
            </div>
        </div>
    );
}
