import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getWebSocketUrl } from '../utils/wsUrl';
import {
    Bell,
    CheckCheck,
    Package,
    MessageSquare,
    AlertCircle,
    Info,
    ArrowRight,
    Inbox,
    ShieldAlert,
    Sparkles,
    CheckCircle2
} from 'lucide-react';

export default function NotificationCenter() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'CLAIMS' | 'MESSAGES'
    const [markingAll, setMarkingAll] = useState(false);

    // Safely parse user
    const parsedUser = typeof user === 'string' ? (() => {
        try { return JSON.parse(user); } catch { return null; }
    })() : user;

    const currentUserId = parsedUser?.id || parsedUser?.userId;

    const fetchAllNotifications = useCallback(async () => {
        if (!token || !currentUserId) return;
        setLoading(true);
        setError('');

        try {
            // 1. Claims notifications
            const claimsPromise = api.get('/claims/notifications')
                .then((res) => {
                    const raw = res.data?.notifications || (Array.isArray(res.data) ? res.data : []);
                    return raw.map((c) => ({
                        id: `claim-${c.id}`,
                        rawId: c.id,
                        type: 'CLAIM',
                        title: `New claim on ${c.itemTitle || c.item?.title || 'an item'}`,
                        message: c.proofDescription || c.proofDetails || 'No description provided',
                        date: c.createdAt || c.claimDate || new Date().toISOString(),
                        isRead: c.status && c.status.toUpperCase() !== 'PENDING',
                        itemId: c.itemId || c.item?.id,
                        sender: c.claimantName || c.claimantEmail || 'Claimant'
                    }));
                })
                .catch(() => []);

            // 2. Direct message inbox
            const messagesPromise = currentUserId
                ? api.get(`/messages/inbox/${currentUserId}`)
                    .then((res) => {
                        const raw = Array.isArray(res.data) ? res.data : [];
                        return raw.map((m) => ({
                            id: `msg-${m.id}`,
                            rawId: m.id,
                            type: 'MESSAGE',
                            title: 'New chat reply received',
                            message: m.content || 'Sent you a direct message',
                            date: m.sentAt || m.timestamp || new Date().toISOString(),
                            isRead: Boolean(m.isRead || m.read),
                            itemId: m.itemId,
                            sender: m.senderName || m.senderEmail || `User #${m.senderId}`
                        }));
                    })
                    .catch(() => [])
                : Promise.resolve([]);

            // 3. System & Algorithmic match notifications
            const systemPromise = api.get('/notifications')
                .then((res) => {
                    const raw = Array.isArray(res.data) ? res.data : (res.data?.content || []);
                    return raw.map((n) => ({
                        id: `sys-${n.id}`,
                        rawId: n.id,
                        type: n.type || 'SYSTEM',
                        title: n.title || 'LostLink Notice',
                        message: n.message || '',
                        date: n.createdAt || new Date().toISOString(),
                        isRead: Boolean(n.read || n.isRead),
                        itemId: n.relatedItemId,
                        sender: 'System'
                    }));
                })
                .catch(() => []);

            const [claims, messages, system] = await Promise.all([
                claimsPromise,
                messagesPromise,
                systemPromise
            ]);

            const combined = [...claims, ...messages, ...system].sort(
                (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );

            setNotifications(combined);
        } catch {
            setError('Failed to load notifications.');
        } finally {
            setLoading(false);
        }
    }, [token, currentUserId]);

    useEffect(() => {
        void fetchAllNotifications();

        const handleRefresh = () => void fetchAllNotifications();
        window.addEventListener('notifications:refresh', handleRefresh);

        return () => window.removeEventListener('notifications:refresh', handleRefresh);
    }, [fetchAllNotifications]);

    // Live STOMP WebSocket for real-time notifications
    useEffect(() => {
        if (!currentUserId || !token) return;

        const stompClient = new Client({
            webSocketFactory: () => new SockJS(getWebSocketUrl()),
            reconnectDelay: 5000,
            onConnect: () => {
                stompClient.subscribe(`/topic/users/${currentUserId}/notifications`, (frame) => {
                    try {
                        const n = JSON.parse(frame.body);
                        const transformed = {
                            id: `sys-${n.id}`,
                            rawId: n.id,
                            type: n.type || 'SYSTEM',
                            title: n.title || 'LostLink Notice',
                            message: n.message || '',
                            date: n.createdAt || new Date().toISOString(),
                            isRead: false,
                            itemId: n.relatedItemId,
                            sender: 'System'
                        };
                        setNotifications((prev) => [transformed, ...prev.filter((item) => item.id !== transformed.id)]);
                    } catch (err) {
                        console.error('Failed to parse incoming notification frame', err);
                    }
                });

                stompClient.subscribe(`/topic/users/${currentUserId}/messages`, (frame) => {
                    try {
                        const m = JSON.parse(frame.body);
                        const transformed = {
                            id: `msg-${m.id}`,
                            rawId: m.id,
                            type: 'MESSAGE',
                            title: 'New chat reply received',
                            message: m.content || 'Sent you a direct message',
                            date: m.sentAt || new Date().toISOString(),
                            isRead: false,
                            itemId: m.itemId,
                            sender: m.senderName || m.senderEmail || `User #${m.senderId}`
                        };
                        setNotifications((prev) => [transformed, ...prev.filter((item) => item.id !== transformed.id)]);
                    } catch (err) {
                        console.error('Failed to parse incoming message frame', err);
                    }
                });
            }
        });

        stompClient.activate();

        return () => {
            stompClient.deactivate();
        };
    }, [currentUserId, token]);

    const handleItemClick = async (notif) => {
        if (!notif.isRead) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
            );

            if (notif.type === 'MESSAGE' && notif.itemId) {
                try {
                    await api.patch(`/messages/item/${notif.itemId}/read`, null, {
                        params: { userId: currentUserId }
                    });
                } catch (e) {
                    console.error(e);
                }
            } else if (notif.rawId) {
                try {
                    await api.patch(`/notifications/${notif.rawId}/read`);
                } catch (e) {
                    console.error(e);
                }
            }

            window.dispatchEvent(new Event('notifications:refresh'));
        }

        if (notif.itemId) {
            navigate(`/items/${notif.itemId}${notif.type === 'MESSAGE' ? '?openChat=true' : ''}`);
        } else if (notif.type === 'CLAIM') {
            navigate('/my-items?tab=claims');
        }
    };

    const handleMarkAllAsRead = async () => {
        setMarkingAll(true);
        try {
            await api.patch('/notifications/read-all');

            const messageItems = [...new Set(notifications.filter((n) => n.type === 'MESSAGE').map((n) => n.itemId).filter(Boolean))];
            await Promise.all(
                messageItems.map((itemId) =>
                    api.patch(`/messages/item/${itemId}/read`, null, { params: { userId: currentUserId } }).catch(() => {})
                )
            );

            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            window.dispatchEvent(new Event('notifications:refresh'));
        } catch {
            alert('Failed to mark all as read.');
        } finally {
            setMarkingAll(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'MESSAGE':
                return <MessageSquare className="w-5 h-5 text-indigo-600" />;
            case 'CLAIM':
                return <Package className="w-5 h-5 text-emerald-600" />;
            case 'ALERT':
                return <AlertCircle className="w-5 h-5 text-rose-500" />;
            default:
                return <Info className="w-5 h-5 text-indigo-500" />;
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
                hour: '2-digit',
                minute: '2-digit'
            });
    };

    const filteredNotifications = notifications.filter((n) => {
        if (filter === 'UNREAD') return !n.isRead;
        if (filter === 'CLAIMS') return n.type === 'CLAIM';
        if (filter === 'MESSAGES') return n.type === 'MESSAGE';
        return true;
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-soft">
                            <Bell className="w-5 h-5" />
                        </div>
                        <span>Notifications</span>
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Review direct message updates, ownership claims, and system notifications.
                    </p>
                </div>

                {unreadCount > 0 && (
                    <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        disabled={markingAll}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-2xl shadow-soft transition self-start sm:self-auto disabled:opacity-50 cursor-pointer"
                    >
                        <CheckCheck className="w-4 h-4 text-emerald-600" />
                        <span>{markingAll ? 'Marking read...' : `Mark all read (${unreadCount})`}</span>
                    </button>
                )}
            </div>

            {/* Filter Pills */}
            <div className="flex gap-2 border-b border-slate-200 pb-4 mb-6 overflow-x-auto custom-scrollbar">
                {[
                    { label: `All Alerts (${notifications.length})`, value: 'ALL' },
                    { label: `Unread (${unreadCount})`, value: 'UNREAD' },
                    { label: 'Claims', value: 'CLAIMS' },
                    { label: 'Chat Inquiries', value: 'MESSAGES' }
                ].map((t) => (
                    <button
                        key={t.value}
                        type="button"
                        onClick={() => setFilter(t.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                            filter === t.value
                                ? 'bg-indigo-600 text-white shadow-soft'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {error && (
                <div className="flex items-center gap-3 p-4 text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl text-sm mb-6 shadow-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {loading && (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-24 bg-white border border-slate-200 rounded-2xl animate-pulse p-4 shadow-soft" />
                    ))}
                </div>
            )}

            {!loading && filteredNotifications.length === 0 && (
                <div className="text-center py-20 bg-white/90 backdrop-blur-sm border border-dashed border-slate-300 rounded-3xl shadow-soft">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                        <Inbox className="w-7 h-7" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">No notifications found</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        {filter === 'UNREAD' ? 'You have read all of your recent alerts.' : 'No alerts match the chosen filter.'}
                    </p>
                </div>
            )}

            {!loading && filteredNotifications.length > 0 && (
                <div className="space-y-3">
                    {filteredNotifications.map((notif) => (
                        <div
                            key={notif.id}
                            onClick={() => handleItemClick(notif)}
                            className={`p-5 rounded-3xl border transition-all flex items-start gap-4 cursor-pointer group ${
                                notif.isRead
                                    ? 'bg-white/90 border-slate-200/90 hover:border-indigo-300 hover:shadow-soft'
                                    : 'bg-indigo-50/50 border-indigo-200/90 hover:bg-indigo-50/80 shadow-soft'
                            }`}
                        >
                            <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-soft flex-shrink-0 mt-0.5">
                                {getIcon(notif.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <h4 className={`text-sm ${notif.isRead ? 'font-semibold text-slate-800' : 'font-black text-slate-900'}`}>
                                            {notif.title}
                                        </h4>
                                        {!notif.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                                        {formatDate(notif.date)}
                                    </span>
                                </div>

                                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                                    "{notif.message}"
                                </p>

                                {notif.sender && (
                                    <span className="text-[11px] text-slate-400 mt-2 inline-block">
                                        From: <strong className="text-slate-700">{notif.sender}</strong>
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center self-center text-slate-300 group-hover:text-indigo-600 transition-colors">
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}