import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getImageUrl, handleImageError } from '../utils/imageUrl';
import {
    Package,
    Trash2,
    AlertCircle,
    MapPin,
    Calendar,
    ExternalLink,
    ShieldAlert,
    Clock,
    Check,
    X,
    MessageSquare,
    Send,
    ChevronDown,
    ChevronUp,
    MessageCircle,
    ShieldCheck,
    CheckCircle2,
    HelpCircle,
    PlusCircle,
    User as UserIcon,
    Inbox,
    Eye,
    Edit3,
    RotateCcw
} from 'lucide-react';
import EditItemModal from '../components/EditItemModal';

export default function MyItems() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabParam = searchParams.get('tab') || 'claims';
    const [activeTab, setActiveTab] = useState(tabParam);
    const { user } = useAuth();

    const [items, setItems] = useState([]);
    const [receivedClaims, setReceivedClaims] = useState([]);
    const [myClaims, setMyClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    // Claim Comments & Dispute State
    const [openCommentsClaimId, setOpenCommentsClaimId] = useState(null);
    const [claimComments, setClaimComments] = useState({});
    const [loadingComments, setLoadingComments] = useState(false);
    const [newCommentText, setNewCommentText] = useState({});
    const [submittingComment, setSubmittingComment] = useState(false);

    // Chat Drawer State
    const [activeChatItem, setActiveChatItem] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (tabParam) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [itemsRes, receivedRes, myClaimsRes] = await Promise.all([
                api.get('/items/my-items').catch(() => ({ data: [] })),
                api.get('/claims/received').catch(() => ({ data: [] })),
                api.get('/claims/my-claims').catch(() => ({ data: [] }))
            ]);

            const itemsData = itemsRes.data?.content || itemsRes.data || [];
            setItems(Array.isArray(itemsData) ? itemsData : []);

            const receivedData = receivedRes.data?.content || receivedRes.data || [];
            setReceivedClaims(Array.isArray(receivedData) ? receivedData : []);

            const myClaimsData = myClaimsRes.data?.content || myClaimsRes.data || [];
            setMyClaims(Array.isArray(myClaimsData) ? myClaimsData : []);
        } catch {
            setError('Failed to load dashboard data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData();
    }, []);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSearchParams({ tab });
    };

    const handleStatusChange = async (id, newStatus) => {
        setActionLoading(id);
        try {
            await api.patch(`/items/${id}/status?status=${newStatus}`);
            setItems((prev) =>
                prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
            );
        } catch {
            alert('Failed to update status.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this listing?')) return;
        setActionLoading(id);
        try {
            await api.delete(`/items/${id}`);
            setItems((prev) => prev.filter((item) => item.id !== id));
        } catch {
            alert('Failed to delete item.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleClaimAction = async (claimId, status) => {
        setActionLoading(claimId);
        try {
            await api.patch(`/claims/${claimId}/status`, null, {
                params: { status }
            });

            if (user?.id) {
                const key = `dismissed_claims_${user.id}`;
                const existing = JSON.parse(localStorage.getItem(key) || '[]');
                const updated = existing.filter((id) => id !== claimId);
                localStorage.setItem(key, JSON.stringify(updated));
            }

            window.dispatchEvent(new Event('notifications:refresh'));
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update claim status.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleCancelClaim = async (claimId) => {
        if (!window.confirm('Are you sure you want to withdraw and cancel this claim?')) return;
        setActionLoading(`cancel-${claimId}`);
        try {
            await api.patch(`/claims/${claimId}/cancel`);
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel claim.');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReopenItem = async (itemId) => {
        if (!window.confirm('Reopen this listing? If the claimant did not collect the item, this will restore it to an active listing and cancel the approved claim.')) return;
        setActionLoading(`reopen-${itemId}`);
        try {
            await api.patch(`/claims/item/${itemId}/reopen`);
            await fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reopen listing.');
        } finally {
            setActionLoading(null);
        }
    };

    // --- CLAIM COMMENTS / DISPUTE FUNCTIONS ---
    const fetchClaimComments = useCallback(async (claimId) => {
        setLoadingComments(true);
        try {
            const res = await api.get(`/claims/${claimId}/comments`);
            const list = Array.isArray(res.data) ? res.data : (res.data?.content || []);
            setClaimComments((prev) => ({ ...prev, [claimId]: list }));
        } catch {
            setClaimComments((prev) => ({ ...prev, [claimId]: [] }));
        } finally {
            setLoadingComments(false);
        }
    }, []);

    const toggleClaimComments = (claimId) => {
        if (openCommentsClaimId === claimId) {
            setOpenCommentsClaimId(null);
        } else {
            setOpenCommentsClaimId(claimId);
            void fetchClaimComments(claimId);
        }
    };

    const handleSendClaimComment = async (e, claimId) => {
        e.preventDefault();
        const text = newCommentText[claimId]?.trim();
        if (!text) return;

        setSubmittingComment(true);
        try {
            const res = await api.post(`/claims/${claimId}/comments`, {
                content: text,
                comment: text
            });

            setClaimComments((prev) => ({
                ...prev,
                [claimId]: [...(prev[claimId] || []), res.data]
            }));

            setNewCommentText((prev) => ({ ...prev, [claimId]: '' }));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to post comment on this claim.');
        } finally {
            setSubmittingComment(false);
        }
    };

    // --- DIRECT CHAT DRAWER FUNCTIONS ---
    const markThreadAsRead = async (itemId) => {
        if (!user?.id || !itemId) return;
        try {
            await api.patch(`/messages/item/${itemId}/read`, null, {
                params: { userId: user.id }
            });
        } catch {
            // Optional read receipts endpoint
        }
    };

    const fetchChatMessages = async (itemId, silent = false) => {
        if (!silent) setLoadingMessages(true);
        try {
            const res = await api.get(`/messages/item/${itemId}`);
            setMessages(Array.isArray(res.data) ? res.data : []);
            void markThreadAsRead(itemId);
        } catch {
            if (!silent) setMessages([]);
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    };

    const openChatDrawer = async (claim) => {
        const targetRecipientId =
            claim.claimantId ||
            claim.claimant?.id ||
            claim.userId ||
            claim.user?.id ||
            claim.posterId ||
            null;

        setActiveChatItem({
            itemId: claim.itemId || claim.item?.id,
            itemTitle: claim.itemTitle || claim.item?.title || 'Item Chat',
            recipientId: targetRecipientId
        });
        await fetchChatMessages(claim.itemId || claim.item?.id, false);
    };

    useEffect(() => {
        if (!activeChatItem?.itemId) return;
        const interval = setInterval(() => {
            void fetchChatMessages(activeChatItem.itemId, true);
        }, 4000);
        return () => clearInterval(interval);
    }, [activeChatItem?.itemId]);

    useEffect(() => {
        if (activeChatItem) {
            scrollToBottom();
        }
    }, [messages, activeChatItem]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChatItem || !user) return;

        setSendingMessage(true);
        try {
            let recipientId = activeChatItem.recipientId;

            if (!recipientId || recipientId === user.id) {
                const otherMsg = [...messages].reverse().find((m) => m.senderId !== user.id);
                if (otherMsg) recipientId = otherMsg.senderId;
            }

            if (!recipientId) {
                alert('Unable to identify the recipient for this thread.');
                setSendingMessage(false);
                return;
            }

            const payload = {
                itemId: Number(activeChatItem.itemId),
                senderId: user.id,
                recipientId: recipientId,
                content: newMessage.trim()
            };

            const res = await api.post('/messages', payload);
            setMessages((prev) => [...prev, res.data]);
            setNewMessage('');
            void markThreadAsRead(activeChatItem.itemId);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send message.');
        } finally {
            setSendingMessage(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return isNaN(d.getTime())
            ? ''
            : d.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
    };

    const pendingClaimsCount = receivedClaims.filter((c) => c.status === 'PENDING').length;

    const renderClaimComments = (claimId) => {
        const comments = claimComments[claimId] || [];
        const isOpen = openCommentsClaimId === claimId;

        if (!isOpen) return null;

        return (
            <div className="w-full mt-4 pt-4 border-t border-slate-200/80 bg-slate-50/80 p-4 sm:p-5 rounded-2xl space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5 text-indigo-700">
                        <MessageCircle className="w-4 h-4" />
                        Verification Discussion & Inquiries ({comments.length})
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                        Ask clarifying details before approving/rejecting
                    </span>
                </div>

                {loadingComments ? (
                    <p className="text-xs text-slate-400 py-3 text-center">Loading discussion notes...</p>
                ) : comments.length === 0 ? (
                    <p className="text-xs text-slate-400 py-2 italic text-center">
                        No discussion notes yet. Leave a question or clarification below.
                    </p>
                ) : (
                    <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                        {comments.map((comment) => {
                            const isMe = user && (comment.userId === user.id || comment.authorId === user.id);
                            const author = comment.authorName || comment.userName || (isMe ? 'You' : `User #${comment.userId || comment.authorId}`);
                            const text = comment.content || comment.comment;

                            return (
                                <div
                                    key={comment.id}
                                    className={`p-3 rounded-2xl border text-xs ${
                                        isMe
                                            ? 'bg-indigo-50 border-indigo-200 ml-6 text-indigo-950'
                                            : 'bg-white border-slate-200 mr-6 text-slate-800 shadow-soft'
                                    }`}
                                >
                                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                                        <strong className={isMe ? 'text-indigo-700 font-bold' : 'text-slate-700 font-bold'}>
                                            {author}
                                        </strong>
                                        <span>{formatDate(comment.createdAt)}</span>
                                    </div>
                                    <p className="leading-relaxed">{text}</p>
                                </div>
                            );
                        })}
                    </div>
                )}

                <form onSubmit={(e) => handleSendClaimComment(e, claimId)} className="flex gap-2 pt-1">
                    <input
                        type="text"
                        required
                        placeholder="Add a verification question or note..."
                        value={newCommentText[claimId] || ''}
                        onChange={(e) =>
                            setNewCommentText((prev) => ({ ...prev, [claimId]: e.target.value }))
                        }
                        className="flex-1 text-xs border border-slate-200 bg-white rounded-xl px-3.5 py-2 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                    />
                    <button
                        type="submit"
                        disabled={submittingComment || !(newCommentText[claimId]?.trim())}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-soft disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                        <Send className="w-3.5 h-3.5" /> Post Note
                    </button>
                </form>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Activity Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Track your reported listings, manage incoming ownership claims, and view claim status.
                    </p>
                </div>
                <Link
                    to="/create-item"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition shadow-soft hover:shadow-glow-primary active:scale-95"
                >
                    <PlusCircle className="w-4 h-4" />
                    <span>Report New Item</span>
                </Link>
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl text-sm mb-6 shadow-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Navigation Tabs Bar */}
            <div className="flex border-b border-slate-200 mb-8 gap-2 overflow-x-auto custom-scrollbar">
                <button
                    type="button"
                    onClick={() => handleTabChange('claims')}
                    className={`pb-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === 'claims'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Incoming Claims</span>
                    {pendingClaimsCount > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                            {pendingClaimsCount}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => handleTabChange('my-claims')}
                    className={`pb-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === 'my-claims'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Clock className="w-4 h-4" />
                    <span>My Submitted Claims ({myClaims.length})</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleTabChange('listings')}
                    className={`pb-3.5 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        activeTab === 'listings'
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                >
                    <Package className="w-4 h-4" />
                    <span>My Reported Listings ({items.length})</span>
                </button>
            </div>

            {/* Loading Skeleton */}
            {loading && (
                <div className="space-y-4">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="h-32 bg-white border border-slate-200 rounded-3xl animate-pulse p-6 shadow-soft" />
                    ))}
                </div>
            )}

            {/* Tab 1: INCOMING CLAIMS */}
            {!loading && activeTab === 'claims' && (
                receivedClaims.length === 0 ? (
                    <div className="text-center py-20 bg-white/90 backdrop-blur-sm border border-dashed border-slate-300 rounded-3xl shadow-soft">
                        <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-800">No incoming claims received</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            When someone claims one of your reported items, their proof will show up here for your verification.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {receivedClaims.map((claim) => (
                            <div
                                key={claim.id}
                                className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all flex flex-col justify-between gap-4"
                            >
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="space-y-3 max-w-2xl flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Item:</span>
                                            <Link
                                                to={`/items/${claim.itemId || claim.item?.id}`}
                                                className="text-base font-bold text-slate-900 hover:text-indigo-600 transition flex items-center gap-1.5"
                                            >
                                                <span>{claim.itemTitle || claim.item?.title}</span>
                                                <ExternalLink className="w-3.5 h-3.5 opacity-50" />
                                            </Link>
                                            <span
                                                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                                                    claim.status === 'APPROVED'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : claim.status === 'REJECTED'
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                }`}
                                            >
                                                {claim.status}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-600">
                                            Claimed by: <strong className="text-slate-800">{claim.claimantName || claim.claimantEmail}</strong> ({claim.claimantEmail})
                                        </p>

                                        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2 text-xs">
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                                    Submitted Proof:
                                                </span>
                                                <p className="text-slate-800 italic leading-relaxed">
                                                    "{claim.proofDescription || 'No written description provided'}"
                                                </p>
                                            </div>

                                            {claim.verificationAnswer && (
                                                <p className="text-slate-700 pt-1">
                                                    <strong className="text-slate-500">Verification Answer:</strong> {claim.verificationAnswer}
                                                </p>
                                            )}

                                            {/* RENDER VERIFICATION PROOF PHOTO */}
                                            {claim.proofImageUrl && (
                                                <div className="pt-2 border-t border-slate-200">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                                        Attached Proof Photo:
                                                    </span>
                                                    <a
                                                        href={getImageUrl(claim.proofImageUrl)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-block"
                                                    >
                                                        <img
                                                            src={getImageUrl(claim.proofImageUrl)}
                                                            alt="Claim Verification Proof"
                                                            className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-xl border border-slate-200 hover:shadow-md hover:opacity-90 transition cursor-pointer"
                                                        />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0 self-end md:self-start">
                                        <button
                                            type="button"
                                            onClick={() => toggleClaimComments(claim.id)}
                                            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            <span>Discussion Notes</span>
                                            {openCommentsClaimId === claim.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => openChatDrawer(claim)}
                                            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition cursor-pointer"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span>Chat</span>
                                        </button>

                                        {claim.status === 'PENDING' && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleClaimAction(claim.id, 'APPROVED')}
                                                    disabled={actionLoading === claim.id}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-soft disabled:opacity-50 cursor-pointer"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span>Approve</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleClaimAction(claim.id, 'REJECTED')}
                                                    disabled={actionLoading === claim.id}
                                                    className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5" />
                                                    <span>Reject</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {renderClaimComments(claim.id)}
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Tab 2: MY SUBMITTED CLAIMS */}
            {!loading && activeTab === 'my-claims' && (
                myClaims.length === 0 ? (
                    <div className="text-center py-20 bg-white/90 backdrop-blur-sm border border-dashed border-slate-300 rounded-3xl shadow-soft">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-800">You haven't submitted any claims</h3>
                        <p className="text-xs text-slate-500 mt-1 mb-4">Browse campus listings to find your missing items.</p>
                        <Link to="/" className="text-xs font-bold text-indigo-600 hover:underline">
                            Browse Listings Feed &rarr;
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {myClaims.map((claim) => (
                            <div
                                key={claim.id}
                                className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all flex flex-col justify-between gap-4"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    <div className="space-y-2 flex-1">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/items/${claim.itemId || claim.item?.id}`}
                                                className="text-base font-bold text-slate-900 hover:text-indigo-600 transition"
                                            >
                                                {claim.itemTitle || claim.item?.title}
                                            </Link>
                                            <span
                                                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wide ${
                                                    claim.status === 'APPROVED'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : claim.status === 'REJECTED'
                                                            ? 'bg-rose-100 text-rose-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                }`}
                                            >
                                                {claim.status}
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-400">
                                            Submitted on: {formatDate(claim.createdAt)}
                                        </p>

                                        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-2 text-xs">
                                            <p className="text-slate-800">
                                                <span className="font-bold text-slate-500">Your Proof:</span> {claim.proofDescription}
                                            </p>

                                            {claim.proofImageUrl && (
                                                <div className="pt-2 border-t border-slate-200">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                                        Your Attached Photo:
                                                    </span>
                                                    <a
                                                        href={getImageUrl(claim.proofImageUrl)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-block"
                                                    >
                                                        <img
                                                            src={getImageUrl(claim.proofImageUrl)}
                                                            alt="Your Claim Proof"
                                                            className="w-20 h-20 object-cover rounded-xl border border-slate-200 hover:opacity-90 transition"
                                                        />
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-start sm:self-center">
                                        <button
                                            type="button"
                                            onClick={() => toggleClaimComments(claim.id)}
                                            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5 text-slate-600" />
                                            <span>Discussion</span>
                                            {openCommentsClaimId === claim.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => openChatDrawer(claim)}
                                            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" /> Message Finder
                                        </button>

                                        {claim.status === 'PENDING' && (
                                            <button
                                                type="button"
                                                disabled={actionLoading === `cancel-${claim.id}`}
                                                onClick={() => handleCancelClaim(claim.id)}
                                                className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
                                            >
                                                <X className="w-3.5 h-3.5" /> Cancel Claim
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {renderClaimComments(claim.id)}
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Tab 3: MY LISTINGS */}
            {!loading && activeTab === 'listings' && (
                items.length === 0 ? (
                    <div className="text-center py-20 bg-white/90 backdrop-blur-sm border border-dashed border-slate-300 rounded-3xl shadow-soft">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h3 className="text-base font-bold text-slate-800">No items reported yet</h3>
                        <p className="text-xs text-slate-500 mt-1 mb-4">Reports you publish will appear here for management.</p>
                        <Link to="/create-item" className="text-xs font-bold text-indigo-600 hover:underline">
                            Report your first item &rarr;
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item) => {
                            const imageUrl = getImageUrl(item.imageUrl);
                            const isResolved = item.status === 'CLAIMED' || item.status === 'RESOLVED';
                            return (
                                <div
                                    key={item.id}
                                    className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 transition-all"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                            {imageUrl ? (
                                                <img
                                                    src={imageUrl}
                                                    alt={item.title}
                                                    className="w-full h-full object-cover"
                                                    onError={handleImageError}
                                                />
                                            ) : null}
                                            <Package className={`w-6 h-6 text-slate-400 ${imageUrl ? 'hidden' : ''}`} />
                                        </div>

                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                                    {item.category}
                                                </span>
                                                <span
                                                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                                                        isResolved
                                                            ? 'bg-slate-200 text-slate-700'
                                                            : item.type === 'LOST' || item.status === 'LOST'
                                                                ? 'bg-rose-100 text-rose-700'
                                                                : 'bg-emerald-100 text-emerald-700'
                                                    }`}
                                                >
                                                    {item.status || item.type}
                                                </span>
                                            </div>

                                            <Link
                                                to={`/items/${item.id}`}
                                                className="text-base font-bold text-slate-900 hover:text-indigo-600 transition truncate flex items-center gap-1.5"
                                            >
                                                <span>{item.title}</span>
                                                <ExternalLink className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                                            </Link>

                                            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                    {item.location || 'Location unlisted'}
                                                </span>
                                                {(item.date || item.createdAt) && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        {formatDate(item.date || item.createdAt)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 self-end sm:self-center">
                                        <select
                                            value={item.status || item.type}
                                            disabled={actionLoading === item.id}
                                            onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                            className="bg-slate-50 border border-slate-200 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-slate-700 disabled:opacity-50 cursor-pointer"
                                        >
                                            <option value="LOST">Lost</option>
                                            <option value="FOUND">Found</option>
                                            <option value="CLAIMED">Claimed</option>
                                            <option value="RESOLVED">Resolved</option>
                                        </select>

                                        {item.status === 'CLAIMED' && (
                                            <button
                                                type="button"
                                                onClick={() => handleReopenItem(item.id)}
                                                disabled={actionLoading === `reopen-${item.id}`}
                                                title="Reopen listing if claimant didn't collect"
                                                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" /> Reopen
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => setEditingItem(item)}
                                            title="Edit listing details"
                                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition cursor-pointer"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(item.id)}
                                            disabled={actionLoading === item.id}
                                            title="Delete listing"
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition disabled:opacity-50 cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {/* Slide-over Item Chat Drawer */}
            {activeChatItem && (
                <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm transition-opacity">
                    <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="p-4 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/80">
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm">Item Discussion Thread</h3>
                                <p className="text-xs text-slate-500 truncate max-w-xs">{activeChatItem.itemTitle}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActiveChatItem(null)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 custom-scrollbar">
                            {loadingMessages ? (
                                <div className="text-center text-xs text-slate-400 py-12">Loading messages...</div>
                            ) : messages.length === 0 ? (
                                <div className="text-center text-xs text-slate-400 py-12 px-6">
                                    No messages in this discussion yet. Send a note to coordinate physical handover.
                                </div>
                            ) : (
                                messages.map((m) => {
                                    const isMe = user && (m.senderId === user.id || m.sender?.id === user.id);

                                    const otherParticipantName =
                                        activeChatItem?.recipientName ||
                                        activeChatItem?.claimantName ||
                                        null;

                                    const senderDisplayName = isMe
                                        ? 'You'
                                        : m.senderName ||
                                        m.sender?.name ||
                                        m.senderEmail ||
                                        m.sender?.email ||
                                        otherParticipantName ||
                                        `User #${m.senderId || m.sender?.id || '?'}`;

                                    return (
                                        <div
                                            key={m.id}
                                            className={`p-3 rounded-2xl border text-xs space-y-1 max-w-[85%] ${
                                                isMe
                                                    ? 'bg-indigo-600 text-white border-indigo-700 ml-auto'
                                                    : 'bg-white text-slate-800 border-slate-200 mr-auto shadow-soft'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center text-[10px] gap-2">
                                                <span className={`font-bold ${isMe ? 'text-indigo-100' : 'text-slate-700'}`}>
                                                    {senderDisplayName}
                                                </span>
                                                <span className={isMe ? 'text-indigo-200' : 'text-slate-400'}>
                                                    {formatDate(m.sentAt || m.timestamp || m.createdAt)}
                                                </span>
                                            </div>
                                            <p className={`leading-relaxed ${isMe ? 'text-white' : 'text-slate-700'}`}>
                                                {m.content}
                                            </p>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
                            <input
                                type="text"
                                required
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 text-xs border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                            />
                            <button
                                type="submit"
                                disabled={sendingMessage || !newMessage.trim()}
                                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition shadow-soft disabled:opacity-50 cursor-pointer"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            <EditItemModal
                item={editingItem}
                isOpen={Boolean(editingItem)}
                onClose={() => setEditingItem(null)}
                onUpdated={() => fetchData()}
            />
        </div>
    );
}