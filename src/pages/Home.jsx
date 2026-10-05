import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import {
    Search,
    MapPin,
    Calendar,
    Tag,
    AlertCircle,
    Clock,
    X,
    CheckCircle2,
    PlusCircle,
    Sparkles,
    SlidersHorizontal,
    ArrowRight,
    HelpCircle,
    CheckCircle,
    Laptop,
    CreditCard,
    Key,
    Shirt,
    FileText,
    MoreHorizontal,
    Award,
    Building2,
    Camera,
    ArrowUpDown,
    Filter,
    Mic,
    MicOff,
    Share2,
    Hourglass,
    AlertTriangle
} from 'lucide-react';
import { getImageUrl, handleImageError } from '../utils/imageUrl';
import ShareModal from '../components/ShareModal';

const CATEGORIES = [
    { value: '', label: 'All Categories', icon: Tag },
    { value: 'ELECTRONICS', label: 'Electronics', icon: Laptop },
    { value: 'WALLETS_CARDS', label: 'Wallets & Cards', icon: CreditCard },
    { value: 'KEYS', label: 'Keys', icon: Key },
    { value: 'CLOTHING', label: 'Clothing & Acc.', icon: Shirt },
    { value: 'DOCUMENTS', label: 'Books & Docs', icon: FileText },
    { value: 'OTHER', label: 'Other Items', icon: MoreHorizontal }
];

// In-memory stale-while-revalidate cache for instant navigation & tab switching
const itemsCache = new Map();
const CACHE_STALE_MS = 60000; // 60 seconds

export default function Home() {
    // Multi-factor Filters & Sorting
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('');
    const [dateRange, setDateRange] = useState(''); // '', '1', '3', '7', '30'
    const [withRewardOnly, setWithRewardOnly] = useState(false);
    const [withPhotoOnly, setWithPhotoOnly] = useState(false);
    const [inDeskOnly, setInDeskOnly] = useState(false);
    const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'title'

    // Compute initial cache key for default view
    const initialCacheKey = JSON.stringify({});
    const initialCached = itemsCache.get(initialCacheKey);

    // Initial state hydrates immediately from memory if available
    const [items, setItems] = useState(() => initialCached?.data || []);
    const [loading, setLoading] = useState(() => !initialCached);
    const [isRevalidating, setIsRevalidating] = useState(false);
    const [error, setError] = useState('');

    // Voice search state
    const [isListening, setIsListening] = useState(false);

    // Share modal state
    const [shareItem, setShareItem] = useState(null);

    // 300ms debounce timer for keystrokes
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Fetch items with Stale-While-Revalidate caching
    const fetchItems = useCallback(async () => {
        const params = {};
        if (debouncedSearch.trim()) params.keyword = debouncedSearch.trim();
        if (category) params.category = category;
        if (status) params.status = status;

        const cacheKey = JSON.stringify(params);
        const cached = itemsCache.get(cacheKey);
        const now = Date.now();

        if (cached) {
            // Immediately display cached items without showing skeleton
            setItems(cached.data);
            setLoading(false);

            // If cache is fresh (< 60s), avoid background re-fetch
            if (now - cached.timestamp < CACHE_STALE_MS) {
                return;
            }
            setIsRevalidating(true);
        } else {
            setLoading(true);
        }

        setError('');
        try {
            const res = await api.get('/items', { params });
            const list = res.data.content || res.data || [];
            const safeList = Array.isArray(list) ? list : [];

            // Store in cache
            itemsCache.set(cacheKey, { data: safeList, timestamp: Date.now() });
            setItems(safeList);
        } catch {
            if (!cached) {
                setError('Unable to load listings. Please check your connection and try again.');
            }
        } finally {
            setLoading(false);
            setIsRevalidating(false);
        }
    }, [debouncedSearch, category, status]);

    useEffect(() => {
        void fetchItems();
    }, [fetchItems]);

    // Handle hash scroll when navigated to /#items from other pages
    useEffect(() => {
        if (window.location.hash === '#items' || window.location.hash === '#browse-section') {
            setTimeout(() => {
                const el = document.getElementById('items') || document.getElementById('browse-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, []);

    const handleClearFilters = () => {
        setSearchTerm('');
        setDebouncedSearch('');
        setCategory('');
        setStatus('');
        setDateRange('');
        setWithRewardOnly(false);
        setWithPhotoOnly(false);
        setInDeskOnly(false);
        setSortBy('newest');
    };

    // Voice speech-to-text dictation
    const handleVoiceSearch = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice search is not supported in this browser. Please type your query.');
            return;
        }

        if (isListening) return;

        try {
            const recognition = new SpeechRecognition();
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => setIsListening(true);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                if (transcript) {
                    setSearchTerm(transcript);
                }
                setIsListening(false);
            };
            recognition.onerror = () => setIsListening(false);
            recognition.onend = () => setIsListening(false);

            recognition.start();
        } catch {
            setIsListening(false);
        }
    };

    // Campus Custody Retention Info Calculation (90-day policy)
    const getRetentionInfo = (item) => {
        const itemStatus = (item.status || item.type || '').toUpperCase();
        if (itemStatus !== 'FOUND') return null;

        const dateVal = item.createdAt || item.date;
        if (!dateVal) return null;

        const createdTime = new Date(dateVal).getTime();
        if (isNaN(createdTime)) return null;

        const retentionPeriodMs = 90 * 24 * 60 * 60 * 1000;
        const expiryTime = createdTime + retentionPeriodMs;
        const now = Date.now();
        const diffDays = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));

        if (diffDays <= 0) {
            return { text: 'Retention expired', isUrgent: true };
        } else if (diffDays <= 14) {
            return { text: `${diffDays}d left in custody`, isUrgent: true };
        } else {
            return { text: `${diffDays}d custody window`, isUrgent: false };
        }
    };

    // Multi-Factor Filter & Sort
    const displayedItems = useMemo(() => {
        let result = items.filter((item) => {
            if (status) {
                const s = (item.status || item.type || '').toUpperCase();
                if (s !== status.toUpperCase()) return false;
            }
            if (withRewardOnly && !item.reward) {
                return false;
            }
            if (withPhotoOnly && !item.imageUrl) {
                return false;
            }
            if (inDeskOnly && !item.custodyDesk) {
                return false;
            }
            if (dateRange) {
                const days = parseInt(dateRange, 10);
                const itemDate = new Date(item.date || item.createdAt);
                const now = new Date();
                const diffDays = (now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24);
                if (diffDays > days) return false;
            }
            return true;
        });

        // Sorting
        const sorted = [...result];
        if (sortBy === 'oldest') {
            sorted.sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
        } else if (sortBy === 'title') {
            sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        } else {
            // default 'newest'
            sorted.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
        }

        return sorted;
    }, [items, status, withRewardOnly, withPhotoOnly, inDeskOnly, dateRange, sortBy]);

    // Quick Stats Calculation
    const stats = useMemo(() => {
        const total = items.length;
        const lostCount = items.filter(i => (i.status || i.type || '').toUpperCase() === 'LOST').length;
        const foundCount = items.filter(i => (i.status || i.type || '').toUpperCase() === 'FOUND').length;
        const resolvedCount = items.filter(i => {
            const s = (i.status || i.type || '').toUpperCase();
            return s === 'RESOLVED' || s === 'CLAIMED' || s === 'REUNITED';
        }).length;

        return { total, lostCount, foundCount, resolvedCount };
    }, [items]);

    const renderBadge = (item) => {
        const s = (item.status || item.type || '').toUpperCase();
        switch (s) {
            case 'RESOLVED':
                return (
                    <span className="text-[11px] font-extrabold tracking-wide uppercase px-2.5 py-1 rounded-full shadow-sm bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                    </span>
                );
            case 'CLAIMED':
                return (
                    <span className="text-[11px] font-extrabold tracking-wide uppercase px-2.5 py-1 rounded-full shadow-sm bg-amber-500 text-white flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Claimed
                    </span>
                );
            case 'FOUND':
                return (
                    <span className="text-[11px] font-extrabold tracking-wide uppercase px-2.5 py-1 rounded-full shadow-sm bg-emerald-600 text-white flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Found
                    </span>
                );
            case 'LOST':
            default:
                return (
                    <span className="text-[11px] font-extrabold tracking-wide uppercase px-2.5 py-1 rounded-full shadow-sm bg-rose-500 text-white flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" /> Lost
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen pb-16 transition-colors">
            {/* Modern Hero Section */}
            <section className="relative overflow-hidden pt-8 pb-12 sm:pt-12 sm:pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200/70 dark:border-slate-800 bg-gradient-to-b from-white/90 dark:from-slate-900/90 via-slate-50/50 dark:via-slate-900/50 to-transparent">
                <div className="max-w-6xl mx-auto text-center space-y-6">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/80 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 shadow-sm animate-in fade-in">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Official Campus LostLink System</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-[1.15]">
                        Find What's Lost, <br className="hidden sm:inline" />
                        <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-emerald-600 bg-clip-text text-transparent">
                            Reunite What's Found.
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                        Browse active campus listings, report misplaced items with photo proof, and securely reclaim belongings with PIN verification.
                    </p>

                    {/* Quick Action CTAs */}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <Link
                            to="/create-item"
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-soft hover:shadow-glow-primary transition-all active:scale-95 cursor-pointer touch-manipulation"
                        >
                            <PlusCircle className="w-4 h-4" />
                            <span>Report a Missing or Found Item</span>
                        </Link>
                        <a
                            href="#items"
                            onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById('items') || document.getElementById('browse-section');
                                if (el) {
                                    el.scrollIntoView({ behavior: 'smooth' });
                                }
                            }}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300/80 dark:border-slate-700 text-sm font-bold shadow-soft transition-all cursor-pointer touch-manipulation"
                        >
                            <span>Browse Catalog</span>
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>

                    {/* Live Metric Pills */}
                    <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto">
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700 p-3.5 rounded-2xl shadow-soft">
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Active</span>
                            <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{stats.total}</span>
                        </div>
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700 p-3.5 rounded-2xl shadow-soft">
                            <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block">Missing</span>
                            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{stats.lostCount}</span>
                        </div>
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700 p-3.5 rounded-2xl shadow-soft">
                            <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider block">Recovered</span>
                            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.foundCount}</span>
                        </div>
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700 p-3.5 rounded-2xl shadow-soft">
                            <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block">Reunited</span>
                            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.resolvedCount}</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Listings Section */}
            <main id="items" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 scroll-mt-20">
                {/* Search & Control Bar */}
                <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-soft p-4 sm:p-5 mb-8 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Search Input with Voice & Clear Buttons */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by item title, description, or keyword..."
                                className="w-full pl-10 pr-20 py-2.5 bg-slate-50 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                            <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                        title="Clear search"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleVoiceSearch}
                                    className={`p-1.5 rounded-lg transition-colors ${
                                        isListening
                                            ? 'bg-rose-500 text-white animate-pulse'
                                            : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                                    }`}
                                    title={isListening ? 'Listening...' : 'Voice Search (Dictation)'}
                                >
                                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Status Filter Pills */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto custom-scrollbar">
                            {[
                                { label: 'All Items', value: '' },
                                { label: 'Lost', value: 'LOST' },
                                { label: 'Found', value: 'FOUND' },
                                { label: 'Claimed', value: 'CLAIMED' },
                                { label: 'Resolved', value: 'RESOLVED' },
                            ].map((pill) => (
                                <button
                                    key={pill.label}
                                    type="button"
                                    onClick={() => setStatus(pill.value)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                                        status === pill.value
                                            ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
                                    }`}
                                >
                                    {pill.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Category Selector Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                            <SlidersHorizontal className="w-3 h-3" /> Category:
                        </span>
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = category === cat.value;
                            return (
                                <button
                                    key={cat.value}
                                    type="button"
                                    onClick={() => setCategory(cat.value)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                        isSelected
                                            ? 'bg-indigo-600 text-white shadow-soft'
                                            : 'bg-slate-100/70 dark:bg-slate-800/70 hover:bg-slate-200/70 dark:hover:bg-slate-700/70 text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span>{cat.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Secondary Advanced Filters & Quick Toggles */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        {/* Quick Toggles */}
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setWithRewardOnly(!withRewardOnly)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    withRewardOnly
                                        ? 'bg-amber-500 text-white shadow-soft ring-2 ring-amber-300'
                                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800'
                                }`}
                            >
                                <Award className="w-3.5 h-3.5" />
                                <span>🪙 With Reward</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setWithPhotoOnly(!withPhotoOnly)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    withPhotoOnly
                                        ? 'bg-indigo-600 text-white shadow-soft ring-2 ring-indigo-300'
                                        : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800'
                                }`}
                            >
                                <Camera className="w-3.5 h-3.5" />
                                <span>Has Photo</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setInDeskOnly(!inDeskOnly)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                    inDeskOnly
                                        ? 'bg-emerald-600 text-white shadow-soft ring-2 ring-emerald-300'
                                        : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800'
                                }`}
                            >
                                <Building2 className="w-3.5 h-3.5" />
                                <span>In Desk Custody</span>
                            </button>
                        </div>

                        {/* Date Range & Sort Selector */}
                        <div className="flex items-center gap-2 ml-auto">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                <select
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    aria-label="Date Range"
                                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 dark:text-slate-200 cursor-pointer"
                                >
                                    <option value="">All Time</option>
                                    <option value="1">Past 24 Hours</option>
                                    <option value="3">Past 3 Days</option>
                                    <option value="7">Past 7 Days</option>
                                    <option value="30">Past 30 Days</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    aria-label="Sort By"
                                    className="px-2.5 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 dark:text-slate-200 cursor-pointer"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                    <option value="title">Title (A-Z)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Active Filter Chips Bar */}
                    {(status || category || searchTerm || dateRange || withRewardOnly || withPhotoOnly || inDeskOnly) && (
                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in">
                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                <Filter className="w-3 h-3" /> Active:
                            </span>

                            {status && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    Status: {status}
                                    <button type="button" onClick={() => setStatus('')} className="hover:text-indigo-900 dark:hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                                </span>
                            )}

                            {category && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    {category.replace('_', ' ')}
                                    <button type="button" onClick={() => setCategory('')} className="hover:text-indigo-900 dark:hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                                </span>
                            )}

                            {searchTerm && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    "{searchTerm}"
                                    <button type="button" onClick={() => { setSearchTerm(''); setDebouncedSearch(''); }} className="hover:text-slate-900 dark:hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                                </span>
                            )}

                            {withRewardOnly && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    🪙 Reward Offered
                                    <button type="button" onClick={() => setWithRewardOnly(false)} className="hover:text-amber-900 dark:hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                                </span>
                            )}

                            {withPhotoOnly && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    📷 Photos Only
                                    <button type="button" onClick={() => setWithPhotoOnly(false)} className="hover:text-indigo-900 dark:hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                                </span>
                            )}

                            {inDeskOnly && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    🏢 Desk Custody
                                    <button type="button" onClick={() => setInDeskOnly(false)} className="hover:text-emerald-900 dark:hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                                </span>
                            )}

                            {dateRange && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                    Past {dateRange} Days
                                    <button type="button" onClick={() => setDateRange('')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer"><X className="w-3 h-3" /></button>
                                </span>
                            )}

                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer transition ml-auto"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Reset All</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="flex items-center gap-3 p-4 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-sm mb-8 shadow-sm">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                        <span className="font-medium">{error}</span>
                        <button
                            onClick={() => void fetchItems()}
                            className="ml-auto text-xs font-bold uppercase tracking-wider underline hover:text-rose-900 dark:hover:text-rose-100"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Loading Skeleton */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div
                                key={n}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 h-80 flex flex-col justify-between shadow-soft animate-pulse"
                            >
                                <div className="w-full h-44 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                                <div className="space-y-2 mt-4">
                                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-3/4"></div>
                                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-1/2"></div>
                                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-5/6"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && displayedItems.length === 0 && (
                    <div className="text-center py-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto shadow-soft">
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">No items match your criteria</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                            Try broadening your keyword search, selecting another category, or report a new item.
                        </p>
                        <div className="flex items-center justify-center gap-3 mt-6">
                            {(status || category || searchTerm) && (
                                <button
                                    onClick={handleClearFilters}
                                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                >
                                    Clear Filters
                                </button>
                            )}
                            <Link
                                to="/create-item"
                                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition shadow-soft"
                            >
                                Report Item Now
                            </Link>
                        </div>
                    </div>
                )}

                {/* Item Grid */}
                {!loading && displayedItems.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {displayedItems.map((item) => {
                            const isResolved = item.status === 'RESOLVED';
                            const retention = getRetentionInfo(item);

                            return (
                                <div
                                    key={item.id}
                                    className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-soft-lg hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-200 flex flex-col overflow-hidden"
                                >
                                    {/* Thumbnail preview */}
                                    <Link
                                        to={`/items/${item.id}`}
                                        className="relative w-full h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden block"
                                    >
                                        {item.imageUrl ? (
                                            <>
                                                <img
                                                    src={getImageUrl(item.imageUrl)}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    onError={handleImageError}
                                                />
                                                <div className="hidden flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-200/60 dark:bg-slate-700/60 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-2">
                                                        <Tag className="w-6 h-6 opacity-60" />
                                                    </div>
                                                    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Image Unavailable</span>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-4">
                                                <div className="w-12 h-12 rounded-xl bg-slate-200/60 dark:bg-slate-700/60 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-2">
                                                    <Tag className="w-6 h-6 opacity-60" />
                                                </div>
                                                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Photo Pending</span>
                                            </div>
                                        )}

                                        {/* Status Badge Positioned absolute top right */}
                                        <div className="absolute top-3 right-3">
                                            {renderBadge(item)}
                                        </div>

                                        {/* Category Pill on bottom left of image */}
                                        <div className="absolute bottom-3 left-3">
                                            <span className="text-[11px] font-bold bg-white/95 dark:bg-slate-900/90 backdrop-blur-md text-slate-700 dark:text-slate-200 px-2.5 py-0.5 rounded-md shadow-sm border border-slate-200/60 dark:border-slate-700">
                                                {item.category?.replace('_', ' ') || 'General'}
                                            </span>
                                        </div>

                                        {/* Reward Pill on bottom right of image */}
                                        {item.reward && (
                                            <div className="absolute bottom-3 right-3">
                                                <span className="text-[11px] font-black bg-amber-500/95 backdrop-blur-md text-white px-2 py-0.5 rounded-md shadow-sm border border-amber-400 flex items-center gap-1">
                                                    <span>🪙</span> {item.reward}
                                                </span>
                                            </div>
                                        )}
                                    </Link>

                                    {/* Card Details */}
                                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                                        <div>
                                            <div className="flex items-start justify-between gap-2">
                                                <Link
                                                    to={`/items/${item.id}`}
                                                    className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 flex-1"
                                                >
                                                    {item.title}
                                                </Link>
                                                {/* Quick Share Button */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setShareItem(item);
                                                    }}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                    title="Share item alert"
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed font-normal">
                                                {item.description || 'No additional details provided for this listing.'}
                                            </p>
                                        </div>

                                        {/* Custody retention countdown badge for FOUND items */}
                                        {retention && (
                                            <div
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                                    retention.isUrgent
                                                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                                                        : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                                }`}
                                            >
                                                <Hourglass className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span>{retention.text}</span>
                                            </div>
                                        )}

                                        {/* Desk Custody Badge if turned in */}
                                        {item.custodyDesk && (
                                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                                <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                                                <span className="truncate">Desk: {item.custodyDesk}</span>
                                            </div>
                                        )}

                                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                <div className="flex items-center gap-1.5 truncate max-w-[55%]">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                    <span className="truncate font-medium">
                                                        {item.location || 'Campus Unspecified'}
                                                    </span>
                                                </div>

                                                {(item.createdAt || item.date) && (
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                                                        <span className="font-medium text-slate-500 dark:text-slate-400">
                                                            {new Date(item.createdAt || item.date).toLocaleDateString('en-GB')}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-1">
                                                <Link
                                                    to={`/items/${item.id}`}
                                                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-1"
                                                >
                                                    <span>View Details</span>
                                                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                                {isResolved && (
                                                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                                                        Reunited
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Quick Share Modal Mounted */}
            {shareItem && (
                <ShareModal
                    item={shareItem}
                    isOpen={Boolean(shareItem)}
                    onClose={() => setShareItem(null)}
                />
            )}
        </div>
    );
}