import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { getImageUrl, handleImageError } from '../utils/imageUrl';
import {
    ShieldAlert,
    Trash2,
    Search,
    ExternalLink,
    Package,
    AlertCircle,
    Users,
    Clock,
    CheckCircle2,
    RefreshCw,
    Layers,
    ClipboardCheck,
    XCircle,
    Check,
    BarChart3,
    Download,
    Image as ImageIcon,
    ShieldCheck,
    TrendingUp,
    Filter
} from 'lucide-react';

export default function AdminDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'items'; // 'items' | 'claims' | 'users'

    const [stats, setStats] = useState(null);
    const [claimAnalytics, setClaimAnalytics] = useState(null);
    const [items, setItems] = useState([]);
    const [claims, setClaims] = useState([]);
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [exportingCsv, setExportingCsv] = useState(false);

    const handleTabChange = (tab) => {
        setSearchParams({ tab });
        setStatusFilter('');
        setSearch('');
    };

    const fetchAdminData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [statsRes, analyticsRes, itemsRes, claimsRes, usersRes] = await Promise.all([
                api.get('/admin/stats').catch(() => ({ data: null })),
                api.get('/admin/claims/analytics').catch(() => ({ data: null })),
                api.get('/admin/items').catch(() => api.get('/items')),
                api.get('/admin/claims').catch(() => ({ data: [] })),
                api.get('/admin/users').catch(() => ({ data: [] }))
            ]);

            setStats(statsRes.data);
            setClaimAnalytics(analyticsRes.data);

            const itemsData = itemsRes.data?.content || (Array.isArray(itemsRes.data) ? itemsRes.data : []);
            setItems(itemsData);

            const claimsData = claimsRes.data?.content || (Array.isArray(claimsRes.data) ? claimsRes.data : []);
            setClaims(claimsData);

            const usersData = usersRes.data?.content || (Array.isArray(usersRes.data) ? usersRes.data : []);
            setUsersList(usersData);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load moderator data. Ensure you have ADMIN privileges.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchAdminData();
    }, [fetchAdminData]);

    const handleExportCsv = async () => {
        setExportingCsv(true);
        try {
            const res = await api.get('/admin/claims/export', { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `claims-audit-report-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to export claims audit report.');
        } finally {
            setExportingCsv(false);
        }
    };

    const handleExportItemsCsv = () => {
        try {
            const headers = ['ID', 'Title', 'Category', 'Status', 'Location', 'Date', 'Reporter Name', 'Reporter Email', 'Reward', 'Custody Desk', 'Storage Bin'];
            const rows = items.map(i => [
                i.id,
                `"${(i.title || '').replace(/"/g, '""')}"`,
                i.category || '',
                i.status || '',
                `"${(i.location || '').replace(/"/g, '""')}"`,
                i.date || i.createdAt || '',
                `"${(i.userName || '').replace(/"/g, '""')}"`,
                i.userEmail || '',
                `"${(i.reward || '').replace(/"/g, '""')}"`,
                `"${(i.custodyDesk || '').replace(/"/g, '""')}"`,
                `"${(i.storageBin || '').replace(/"/g, '""')}"`
            ]);

            const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `campus-items-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch {
            alert('Failed to generate items inventory CSV.');
        }
    };

    const handleStatusChange = async (id, status) => {
        setActionLoading(id);
        try {
            await api.patch(`/admin/items/${id}/status`, null, { params: { status } });
            setItems((prev) =>
                prev.map((item) => (item.id === id ? { ...item, status } : item))
            );
            const statsRes = await api.get('/admin/stats').catch(() => null);
            if (statsRes?.data) setStats(statsRes.data);
        } catch {
            alert('Failed to update status.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm('MODERATOR ACTION: Permanently remove this listing?')) return;

        setActionLoading(id);
        try {
            await api.delete(`/admin/items/${id}`);
            setItems((prev) => prev.filter((item) => item.id !== id));
            setClaims((prev) => prev.filter((c) => c.itemId !== id));
            const statsRes = await api.get('/admin/stats').catch(() => null);
            if (statsRes?.data) setStats(statsRes.data);
        } catch {
            alert('Failed to delete item.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleApproveClaim = async (claimId) => {
        if (!window.confirm('Approve this claim? The item will be marked as CLAIMED and other pending claims will be rejected.')) return;

        setActionLoading(`claim-${claimId}`);
        try {
            await api.patch(`/admin/claims/${claimId}/approve`);
            await fetchAdminData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to approve claim.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectClaim = async (claimId) => {
        if (!window.confirm('Reject this claim?')) return;

        setActionLoading(`claim-${claimId}`);
        try {
            await api.patch(`/admin/claims/${claimId}/reject`);
            setClaims((prev) =>
                prev.map((c) => (c.id === claimId ? { ...c, status: 'REJECTED' } : c))
            );
            const statsRes = await api.get('/admin/stats').catch(() => null);
            if (statsRes?.data) setStats(statsRes.data);
            const analyticsRes = await api.get('/admin/claims/analytics').catch(() => null);
            if (analyticsRes?.data) setClaimAnalytics(analyticsRes.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reject claim.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('MODERATOR ACTION: Are you sure you want to permanently delete this user account?')) {
            return;
        }

        setActionLoading(`user-${userId}`);
        try {
            await api.delete(`/admin/users/${userId}`);
            setUsersList((prev) => prev.filter((u) => u.id !== userId));
            const statsRes = await api.get('/admin/stats').catch(() => null);
            if (statsRes?.data) setStats(statsRes.data);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete user.');
        } finally {
            setActionLoading(null);
        }
    };

    const filteredItems = items.filter((item) => {
        const matchesSearch =
            (item.title || '').toLowerCase().includes(search.toLowerCase()) ||
            (item.userEmail || item.user?.email || '').toLowerCase().includes(search.toLowerCase()) ||
            (item.location || '').toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter ? (item.status === statusFilter || item.type === statusFilter) : true;
        return matchesSearch && matchesStatus;
    });

    const filteredClaims = claims.filter((claim) => {
        const matchesSearch =
            (claim.itemTitle || '').toLowerCase().includes(search.toLowerCase()) ||
            (claim.claimantName || '').toLowerCase().includes(search.toLowerCase()) ||
            (claim.claimantEmail || '').toLowerCase().includes(search.toLowerCase()) ||
            (claim.proofDescription || '').toLowerCase().includes(search.toLowerCase());

        const matchesStatus = statusFilter ? claim.status?.toUpperCase() === statusFilter.toUpperCase() : true;
        return matchesSearch && matchesStatus;
    });

    const filteredUsers = usersList.filter((u) => {
        const q = search.toLowerCase();
        return (
            (u.name || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.role || '').toLowerCase().includes(q)
        );
    });

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
            {/* Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-soft">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Moderator Console
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Campus moderation, listings verification, claims dispute resolution, and audit logs.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleExportItemsCsv}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition border border-indigo-200 shadow-soft cursor-pointer"
                        title="Download CSV spreadsheet of all items inventory"
                    >
                        <Download className="w-4 h-4 text-indigo-600" />
                        <span>Export Items CSV</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleExportCsv}
                        disabled={exportingCsv}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-soft cursor-pointer disabled:opacity-50"
                        title="Download CSV report of all claims"
                    >
                        <Download className="w-4 h-4 text-emerald-400" />
                        <span>{exportingCsv ? 'Exporting...' : 'Export Claims CSV'}</span>
                    </button>

                    <div className="relative">
                        <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={
                                activeTab === 'items'
                                    ? "Search title, place, user..."
                                    : activeTab === 'claims'
                                        ? "Search claim or item..."
                                        : "Search user name, email..."
                            }
                            className="pl-10 pr-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 w-56 sm:w-64 shadow-soft text-slate-800"
                        />
                    </div>

                    {activeTab === 'items' && (
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-soft text-slate-700 font-bold cursor-pointer"
                        >
                            <option value="">All Statuses</option>
                            <option value="LOST">Lost</option>
                            <option value="FOUND">Found</option>
                            <option value="CLAIMED">Claimed</option>
                            <option value="REUNITED">Reunited</option>
                            <option value="RESOLVED">Resolved</option>
                        </select>
                    )}

                    {activeTab === 'claims' && (
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-soft text-slate-700 font-bold cursor-pointer"
                        >
                            <option value="">All Claims</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    )}

                    <button
                        type="button"
                        onClick={fetchAdminData}
                        disabled={loading}
                        className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl shadow-soft transition cursor-pointer"
                        title="Refresh data"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl text-sm mb-6 shadow-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Core System KPI Cards */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 p-5 rounded-3xl shadow-soft">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Total Listings</span>
                            <Package className="w-4 h-4 text-indigo-500" />
                        </div>
                        <div className="text-3xl font-black text-slate-900 mt-2">{stats.totalItems ?? 0}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium">
                            {stats.lostItems ?? 0} Lost • {stats.foundItems ?? 0} Found
                        </div>
                    </div>

                    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 p-5 rounded-3xl shadow-soft">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Claims Activity</span>
                            <Clock className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-3xl font-black text-slate-900 mt-2">{stats.totalClaims ?? 0}</div>
                        <div className="text-xs text-amber-600 font-bold mt-1">
                            {stats.pendingClaims ?? 0} Pending • {stats.approvedClaims ?? 0} Approved
                        </div>
                    </div>

                    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 p-5 rounded-3xl shadow-soft">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Reunited Items</span>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="text-3xl font-black text-slate-900 mt-2">{stats.claimedItems ?? 0}</div>
                        <div className="text-xs text-emerald-600 font-bold mt-1">
                            Items verified & returned
                        </div>
                    </div>

                    <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 p-5 rounded-3xl shadow-soft">
                        <div className="flex items-center justify-between text-slate-400">
                            <span className="text-[10px] font-bold uppercase tracking-wider">Registered Users</span>
                            <Users className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="text-3xl font-black text-slate-900 mt-2">{stats.totalUsers ?? usersList.length}</div>
                        <div className="text-xs text-slate-500 mt-1 font-medium">Community members</div>
                    </div>
                </div>
            )}

            {/* Resolution Metrics Banner */}
            {claimAnalytics && (
                <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 mb-8 shadow-soft-lg">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-4 h-4 text-emerald-400" />
                        <h2 className="text-xs font-bold tracking-wider uppercase text-slate-300">
                            Resolution Performance & Turnaround Metrics
                        </h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <div className="text-[11px] text-slate-400 font-medium">Resolution Success</div>
                            <div className="text-2xl font-black text-emerald-400 mt-1">{claimAnalytics.resolutionRate}%</div>
                            <div className="text-[10px] text-slate-400 mt-1">{claimAnalytics.approvedClaims} Approved claims</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <div className="text-[11px] text-slate-400 font-medium">Rejection Ratio</div>
                            <div className="text-2xl font-black text-rose-400 mt-1">{claimAnalytics.rejectionRate}%</div>
                            <div className="text-[10px] text-slate-400 mt-1">{claimAnalytics.rejectedClaims} Disputed / rejected</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <div className="text-[11px] text-slate-400 font-medium">Pending Review</div>
                            <div className="text-2xl font-black text-amber-400 mt-1">{claimAnalytics.pendingClaims}</div>
                            <div className="text-[10px] text-slate-400 mt-1">Awaiting verification</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                            <div className="text-[11px] text-slate-400 font-medium">Avg Review Turnaround</div>
                            <div className="text-2xl font-black text-indigo-400 mt-1">{claimAnalytics.averageResolutionHours}h</div>
                            <div className="text-[10px] text-slate-400 mt-1">Submission to decision</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 mb-6 gap-2 sm:gap-4 overflow-x-auto custom-scrollbar">
                <button
                    type="button"
                    onClick={() => handleTabChange('items')}
                    className={`pb-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                        activeTab === 'items'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Layers className="w-4 h-4" />
                    <span>Listings Moderation ({items.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleTabChange('claims')}
                    className={`pb-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                        activeTab === 'claims'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Claims Review ({claims.length})</span>
                </button>

                {usersList.length > 0 && (
                    <button
                        type="button"
                        onClick={() => handleTabChange('users')}
                        className={`pb-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                            activeTab === 'users'
                                ? 'border-indigo-600 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        <span>Users Directory ({usersList.length})</span>
                    </button>
                )}
            </div>

            {/* View 1: ITEMS TABLE */}
            {activeTab === 'items' && (
                <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-soft overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200 text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-5 py-4">Item & Location</th>
                                    <th className="px-5 py-4">Category</th>
                                    <th className="px-5 py-4">Reported By</th>
                                    <th className="px-5 py-4">Date</th>
                                    <th className="px-5 py-4">Status Override</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 text-slate-400">Loading listings catalog...</td>
                                    </tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 text-slate-400">No listings match the filter query.</td>
                                    </tr>
                                ) : (
                                    filteredItems.map((item) => {
                                        const imageUrl = getImageUrl(item.imageUrl);
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                                                            {imageUrl ? (
                                                                <img
                                                                    src={imageUrl}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                    onError={handleImageError}
                                                                />
                                                            ) : null}
                                                            <Package className={`w-5 h-5 text-slate-400 ${imageUrl ? 'hidden' : ''}`} />
                                                        </div>
                                                        <div>
                                                            <Link
                                                                to={`/items/${item.id}`}
                                                                className="font-bold text-slate-900 hover:text-indigo-600 flex items-center gap-1 transition"
                                                            >
                                                                {item.title} <ExternalLink className="w-3 h-3 opacity-40" />
                                                            </Link>
                                                            <span className="text-[11px] text-slate-400">{item.location || 'Location unlisted'}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                                                        {item.category}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="text-slate-800 font-bold">{item.userName || item.userEmail || item.user?.email || 'Unknown'}</span>
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    {item.date || item.createdAt ? new Date(item.date || item.createdAt).toLocaleDateString('en-GB') : '—'}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <select
                                                        value={item.status || item.type}
                                                        disabled={actionLoading === item.id}
                                                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                                        className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 cursor-pointer"
                                                    >
                                                        <option value="LOST">LOST</option>
                                                        <option value="FOUND">FOUND</option>
                                                        <option value="CLAIMED">CLAIMED</option>
                                                        <option value="REUNITED">REUNITED</option>
                                                        <option value="RESOLVED">RESOLVED</option>
                                                    </select>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        disabled={actionLoading === item.id}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                                        title="Force Delete Item"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* View 2: CLAIMS MANAGEMENT */}
            {activeTab === 'claims' && (
                <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-soft overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200 text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-5 py-4">Target Item</th>
                                    <th className="px-5 py-4">Claimant</th>
                                    <th className="px-5 py-4">Proof & Verification</th>
                                    <th className="px-5 py-4">Claim Date</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4 text-right">Moderation Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 text-slate-400">Loading claims...</td>
                                    </tr>
                                ) : filteredClaims.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 text-slate-400">No claims match the search criteria.</td>
                                    </tr>
                                ) : (
                                    filteredClaims.map((claim) => {
                                        const isPending = claim.status?.toUpperCase() === 'PENDING';
                                        const isApproved = claim.status?.toUpperCase() === 'APPROVED';
                                        const isRejected = claim.status?.toUpperCase() === 'REJECTED';

                                        return (
                                            <tr key={claim.id} className="hover:bg-slate-50/80 transition">
                                                <td className="px-5 py-4">
                                                    {claim.itemId ? (
                                                        <Link
                                                            to={`/items/${claim.itemId}`}
                                                            className="font-bold text-slate-900 hover:text-indigo-600 flex items-center gap-1 transition"
                                                        >
                                                            <span>{claim.itemTitle || `Item #${claim.itemId}`}</span>
                                                            <ExternalLink className="w-3 h-3 opacity-40" />
                                                        </Link>
                                                    ) : (
                                                        <span className="text-slate-400">Item Unspecified</span>
                                                    )}
                                                    <span className="text-[11px] text-slate-400 block">{claim.itemCategory || ''}</span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="font-bold text-slate-900">{claim.claimantName || 'Anonymous'}</div>
                                                    <div className="text-[11px] text-slate-400">{claim.claimantEmail}</div>
                                                </td>
                                                <td className="px-5 py-4 max-w-xs space-y-1.5">
                                                    <p className="line-clamp-2 text-slate-700 leading-relaxed">
                                                        {claim.proofDescription || 'No description provided.'}
                                                    </p>
                                                    {claim.verificationAnswer && (
                                                        <p className="text-[11px] text-slate-500">
                                                            <strong>Answer:</strong> {claim.verificationAnswer}
                                                        </p>
                                                    )}

                                                    {claim.proofImageUrl && (
                                                        <div className="pt-1">
                                                            <a
                                                                href={getImageUrl(claim.proofImageUrl)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 p-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg group transition"
                                                            >
                                                                <img
                                                                    src={getImageUrl(claim.proofImageUrl)}
                                                                    alt="Proof thumbnail"
                                                                    className="w-10 h-10 object-cover rounded border border-slate-200 group-hover:opacity-90"
                                                                />
                                                                <span className="text-[10px] font-bold text-indigo-700 group-hover:underline flex items-center gap-0.5 pr-1">
                                                                    Inspect Proof <ExternalLink className="w-2.5 h-2.5" />
                                                                </span>
                                                            </a>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString('en-GB') : '—'}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                                                        isApproved
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : isRejected
                                                                ? 'bg-rose-100 text-rose-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {claim.status || 'PENDING'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {isPending ? (
                                                        <div className="inline-flex items-center gap-1.5">
                                                            <button
                                                                onClick={() => handleApproveClaim(claim.id)}
                                                                disabled={actionLoading === `claim-${claim.id}`}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs transition cursor-pointer"
                                                                title="Approve Claim"
                                                            >
                                                                <Check className="w-3.5 h-3.5" /> Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectClaim(claim.id)}
                                                                disabled={actionLoading === `claim-${claim.id}`}
                                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs transition cursor-pointer"
                                                                title="Reject Claim"
                                                            >
                                                                <XCircle className="w-3.5 h-3.5" /> Reject
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 text-xs italic">Reviewed</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* View 3: USERS DIRECTORY */}
            {activeTab === 'users' && (
                <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-soft overflow-hidden">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-xs text-slate-600">
                            <thead className="bg-slate-50 text-slate-700 uppercase font-bold border-b border-slate-200 text-[10px] tracking-wider">
                                <tr>
                                    <th className="px-5 py-4">User ID</th>
                                    <th className="px-5 py-4">Name</th>
                                    <th className="px-5 py-4">Email</th>
                                    <th className="px-5 py-4">Role</th>
                                    <th className="px-5 py-4 text-right">Moderation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12 text-slate-400">No users found.</td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => {
                                        const isAdminUser = u.role === 'ADMIN' || u.role === 'ROLE_ADMIN';
                                        return (
                                            <tr key={u.id} className="hover:bg-slate-50/80 transition">
                                                <td className="px-5 py-4 font-bold text-slate-800">#{u.id}</td>
                                                <td className="px-5 py-4 font-bold text-slate-900">
                                                    {u.name || `User #${u.id}`}
                                                </td>
                                                <td className="px-5 py-4 text-slate-600">{u.email}</td>
                                                <td className="px-5 py-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                                        isAdminUser ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                                                    }`}>
                                                        {u.role || 'USER'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right">
                                                    {!isAdminUser && (
                                                        <button
                                                            onClick={() => handleDeleteUser(u.id)}
                                                            disabled={actionLoading === `user-${u.id}`}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" /> Remove
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}