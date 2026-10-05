import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getWebSocketUrl } from '../utils/wsUrl';
import {
    Loader2,
    AlertCircle,
    MessageSquare,
    Sparkles
} from 'lucide-react';

import ItemHeader from '../components/item-details/ItemHeader';
import ItemLifecycleStepper from '../components/item-details/ItemLifecycleStepper';
import ItemOverviewCard from '../components/item-details/ItemOverviewCard';
import ClaimSection from '../components/item-details/ClaimSection';
import HandoverVerificationCard from '../components/item-details/HandoverVerificationCard';
import ChatDrawer from '../components/item-details/ChatDrawer';
import PotentialMatchesList from '../components/item-details/PotentialMatchesList';

import HandoverCertificateModal from '../components/HandoverCertificateModal';
import PrintableFlyerModal from '../components/PrintableFlyerModal';
import EditItemModal from '../components/EditItemModal';
import ShareModal from '../components/ShareModal';

export default function ItemDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Core Item & Claim State
    const [item, setItem] = useState(null);
    const [matches, setMatches] = useState([]);
    const [myExistingClaim, setMyExistingClaim] = useState(null);
    const [allItemClaims, setAllItemClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modals
    const [isCertModalOpen, setIsCertModalOpen] = useState(false);
    const [certModalTab, setCertModalTab] = useState('tag');
    const [isFlyerModalOpen, setIsFlyerModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);

    // Claim submission & PIN state
    const [claimSubmitting, setClaimSubmitting] = useState(false);
    const [verifyingPin, setVerifyingPin] = useState(false);
    const [pinError, setPinError] = useState('');

    // Live Messages State
    const [messages, setMessages] = useState([]);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [activeClaimantIds, setActiveClaimantIds] = useState([]);
    const [selectedClaimantId, setSelectedClaimantId] = useState(null);

    const stompClientRef = useRef(null);

    const parsedUser = typeof user === 'string' ? (() => {
        try { return JSON.parse(user); } catch { return null; }
    })() : user;

    const currentUserId = parsedUser?.id;
    const isAdmin = Boolean(
        parsedUser && (
            parsedUser.role === 'ROLE_ADMIN' ||
            parsedUser.role === 'ADMIN' ||
            parsedUser.roles?.includes('ROLE_ADMIN') ||
            parsedUser.roles?.includes('ADMIN')
        )
    );

    const isOwner = Boolean(
        item && currentUserId && (
            (item.userId && Number(item.userId) === Number(currentUserId)) ||
            (item.user && Number(item.user.id) === Number(currentUserId))
        )
    );

    const isOwnerOrAdmin = isOwner || isAdmin;

    // Fetch Details & Claims
    const fetchItemAndClaims = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [itemRes, matchesRes] = await Promise.all([
                api.get(`/items/${id}`),
                api.get(`/items/${id}/matches`).catch(() => ({ data: [] }))
            ]);

            const itemData = itemRes.data;
            setItem(itemData);
            setMatches(matchesRes.data || []);

            // If user is logged in, check existing claims
            if (currentUserId) {
                try {
                    const myClaimsRes = await api.get('/claims/my-claims');
                    const myClaimsList = Array.isArray(myClaimsRes.data)
                        ? myClaimsRes.data
                        : myClaimsRes.data?.content || [];
                    const foundMine = myClaimsList.find((c) => Number(c.itemId) === Number(id));
                    setMyExistingClaim(foundMine || null);
                } catch {
                    // non-fatal
                }

                // If owner or admin, check all claims on this item
                if (isAdmin || (itemData.userId && Number(itemData.userId) === Number(currentUserId))) {
                    try {
                        const allClaimsRes = await api.get('/claims');
                        const allList = Array.isArray(allClaimsRes.data)
                            ? allClaimsRes.data
                            : allClaimsRes.data?.content || [];
                        const itemClaims = allList.filter((c) => Number(c.itemId) === Number(id));
                        setAllItemClaims(itemClaims);

                        const cids = [...new Set(itemClaims.map((c) => c.claimantId).filter(Boolean))];
                        setActiveClaimantIds(cids);
                        if (cids.length > 0 && !selectedClaimantId) {
                            setSelectedClaimantId(cids[0]);
                        }
                    } catch {
                        // non-fatal
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load item details:', err);
            setError('Unable to load item details. The listing may have been removed.');
        } finally {
            setLoading(false);
        }
    }, [id, currentUserId, isAdmin, selectedClaimantId]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    useEffect(() => {
        void fetchItemAndClaims();
    }, [fetchItemAndClaims]);

    // WebSocket STOMP for live status and chat messages
    useEffect(() => {
        if (!id) return;

        const wsUrl = getWebSocketUrl();
        const socket = new SockJS(wsUrl);
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            debug: () => {}
        });

        client.onConnect = () => {
            // 1. Subscribe to item status transitions
            client.subscribe(`/topic/items/${id}/status`, (msg) => {
                try {
                    const payload = JSON.parse(msg.body);
                    if (payload.status) {
                        setItem((prev) => (prev ? { ...prev, status: payload.status } : prev));
                    }
                } catch {
                    // ignore parse error
                }
            });

            // 2. Subscribe to messages on item
            client.subscribe(`/topic/items/${id}`, (msg) => {
                try {
                    const newMsg = JSON.parse(msg.body);
                    setMessages((prev) => {
                        if (prev.some((m) => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg];
                    });
                } catch {
                    // ignore
                }
            });

            // 3. Subscribe to claimant thread if scoped
            if (selectedClaimantId) {
                client.subscribe(`/topic/items/${id}/thread/${selectedClaimantId}`, (msg) => {
                    try {
                        const newMsg = JSON.parse(msg.body);
                        setMessages((prev) => {
                            if (prev.some((m) => m.id === newMsg.id)) return prev;
                            return [...prev, newMsg];
                        });
                    } catch {
                        // ignore
                    }
                });
            }
        };

        client.activate();
        stompClientRef.current = client;

        return () => {
            if (client.active) client.deactivate();
        };
    }, [id, selectedClaimantId]);

    // Fetch chat history when chat drawer opens
    useEffect(() => {
        if (!isChatOpen || !id) return;

        const loadThread = async () => {
            try {
                const endpoint = selectedClaimantId
                    ? `/messages/thread/${id}/claimant/${selectedClaimantId}`
                    : `/messages/thread/${id}`;
                const res = await api.get(endpoint);
                setMessages(Array.isArray(res.data) ? res.data : []);
            } catch {
                setMessages([]);
            }
        };

        void loadThread();
    }, [isChatOpen, id, selectedClaimantId]);

    // Submit Ownership Claim
    const handleSubmitClaim = async ({ proofDescription, verificationAnswer, proofImageFile }) => {
        setClaimSubmitting(true);
        try {
            let uploadedUrl = null;
            if (proofImageFile) {
                const formData = new FormData();
                formData.append('file', proofImageFile);
                const uploadRes = await api.post('/items/upload-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedUrl = uploadRes.data.imageUrl || uploadRes.data.url;
            }

            const claimPayload = {
                itemId: Number(id),
                proofDescription,
                verificationAnswer: verificationAnswer || null,
                proofImageUrl: uploadedUrl
            };

            const res = await api.post('/claims', claimPayload);
            setMyExistingClaim(res.data);
            void fetchItemAndClaims();
        } catch (err) {
            console.error('Failed to submit claim:', err);
            alert(err.response?.data?.message || 'Failed to submit claim. Please try again.');
        } finally {
            setClaimSubmitting(false);
        }
    };

    // Verify 6-digit Handover PIN
    const handleVerifyPin = async (pin) => {
        setVerifyingPin(true);
        setPinError('');
        try {
            const res = await api.post('/claims/verify-pin', { itemId: Number(id), pin });
            setItem((prev) => (prev ? { ...prev, status: 'REUNITED' } : prev));
            if (myExistingClaim) {
                setMyExistingClaim((prev) => (prev ? { ...prev, handoverVerified: true } : prev));
            }
            void fetchItemAndClaims();
        } catch (err) {
            setPinError(err.response?.data?.message || 'Invalid handover PIN. Please try again.');
        } finally {
            setVerifyingPin(false);
        }
    };

    // Send Live Chat Message
    const handleSendMessage = async ({ content, imageFile, claimantId }) => {
        if (!content && !imageFile) return;
        setSendingMessage(true);
        try {
            let uploadedUrl = null;
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);
                const uploadRes = await api.post('/items/upload-image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedUrl = uploadRes.data.imageUrl || uploadRes.data.url;
            }

            const recipientId = isOwner
                ? claimantId || item.userId
                : item.userId || (item.user && item.user.id);

            const payload = {
                itemId: Number(id),
                recipientId: Number(recipientId),
                claimantId: claimantId ? Number(claimantId) : Number(currentUserId),
                content: content || 'Sent an image attachment',
                imageUrl: uploadedUrl
            };

            const res = await api.post('/messages', payload);
            setMessages((prev) => [...prev, res.data]);
        } catch (err) {
            console.error('Failed to send message:', err);
        } finally {
            setSendingMessage(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400 mb-3" />
                <p className="text-sm font-semibold">Loading listing details...</p>
            </div>
        );
    }

    if (error || !item) {
        return (
            <div className="max-w-xl mx-auto px-4 py-16 text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                    Listing Not Found
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{error}</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
                >
                    Return to Catalog
                </button>
            </div>
        );
    }

    const activeApprovedClaim =
        myExistingClaim && (myExistingClaim.status || '').toUpperCase() === 'APPROVED'
            ? myExistingClaim
            : allItemClaims.find((c) => (c.status || '').toUpperCase() === 'APPROVED') || myExistingClaim;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
            {/* Header with Title & Action Bar */}
            <ItemHeader
                item={item}
                isOwnerOrAdmin={isOwnerOrAdmin}
                onOpenShare={() => setIsShareModalOpen(true)}
                onOpenTag={() => {
                    setCertModalTab('tag');
                    setIsCertModalOpen(true);
                }}
                onOpenFlyer={() => setIsFlyerModalOpen(true)}
                onOpenCert={() => {
                    setCertModalTab('certificate');
                    setIsCertModalOpen(true);
                }}
                onOpenEdit={() => setIsEditModalOpen(true)}
            />

            {/* Lifecycle Stepper & Custody Trail */}
            <ItemLifecycleStepper item={item} claim={activeApprovedClaim} />

            {/* Two Column Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Column: Overview, Images, Description (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                    <ItemOverviewCard item={item} />
                    <PotentialMatchesList matches={matches} currentItem={item} />
                </div>

                {/* Right Column: Claims, Verification, Live Chat Trigger (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Live Discussion Button */}
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-5 text-white shadow-soft flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-sm">Need to discuss this item?</h4>
                            <p className="text-xs text-indigo-100 mt-0.5">
                                Chat securely in real-time with photo attachments
                            </p>
                        </div>
                        <button
                            onClick={() => setIsChatOpen(true)}
                            className="px-4 py-2 bg-white text-indigo-600 hover:bg-indigo-50 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span>Open Chat</span>
                        </button>
                    </div>

                    {/* In-Person Handover PIN Verification Card (Reporter/Admin) */}
                    {isOwnerOrAdmin && (
                        <HandoverVerificationCard
                            item={item}
                            claim={activeApprovedClaim}
                            onVerifyPin={handleVerifyPin}
                            verifyingPin={verifyingPin}
                            pinError={pinError}
                            onOpenCert={() => setIsCertModalOpen(true)}
                        />
                    )}

                    {/* Claim Submission & Verification Status Card */}
                    <ClaimSection
                        item={item}
                        myExistingClaim={myExistingClaim}
                        onSubmitClaim={handleSubmitClaim}
                        claimSubmitting={claimSubmitting}
                        isOwner={isOwner}
                        user={user}
                    />
                </div>
            </div>

            {/* Live Chat Drawer */}
            <ChatDrawer
                isOpen={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                item={item}
                currentUser={parsedUser}
                messages={messages}
                onSendMessage={handleSendMessage}
                sendingMessage={sendingMessage}
                activeClaimantIds={activeClaimantIds}
                selectedClaimantId={selectedClaimantId}
                onSelectClaimantId={setSelectedClaimantId}
            />

            {/* Modals */}
            <ShareModal
                item={item}
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
            />
            <PrintableFlyerModal
                item={item}
                isOpen={isFlyerModalOpen}
                onClose={() => setIsFlyerModalOpen(false)}
            />
            <HandoverCertificateModal
                item={item}
                isOpen={isCertModalOpen}
                defaultTab={certModalTab}
                onClose={() => setIsCertModalOpen(false)}
            />
            <EditItemModal
                item={item}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onUpdated={() => void fetchItemAndClaims()}
            />
        </div>
    );
}