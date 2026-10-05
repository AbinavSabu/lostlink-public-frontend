import { useState } from 'react';
import {
    Share2,
    X,
    Check,
    Copy,
    MessageCircle,
    Send,
    Mail,
    Smartphone,
    ExternalLink
} from 'lucide-react';

export default function ShareModal({ item, isOpen, onClose }) {
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedText, setCopiedText] = useState(false);

    if (!isOpen || !item) return null;

    const currentUrl = window.location.origin + `/items/${item.id}`;
    const isLost = (item.status || '').toUpperCase() === 'LOST';

    const formattedMessage = [
        `🚨 CAMPUS ${isLost ? 'LOST PROPERTY' : 'FOUND PROPERTY'} ALERT!`,
        `📦 Item: ${item.title}`,
        `📍 Location: ${item.location || 'Campus'}`,
        item.reward ? `💰 Reward Offered: ${item.reward}` : null,
        `🔗 View details & help reunite: ${currentUrl}`,
        `#CampusLostLink #HelpReunite`
    ]
        .filter(Boolean)
        .join('\n');

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(currentUrl);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch {
            // fallback
        }
    };

    const handleCopyFormatted = async () => {
        try {
            await navigator.clipboard.writeText(formattedMessage);
            setCopiedText(true);
            setTimeout(() => setCopiedText(false), 2000);
        } catch {
            // fallback
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: item.title,
                    text: formattedMessage,
                    url: currentUrl
                });
            } catch {
                // User canceled share
            }
        }
    };

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedMessage)}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(formattedMessage)}`;
    const emailUrl = `mailto:?subject=${encodeURIComponent(`[LostLink] ${item.title}`)}&body=${encodeURIComponent(formattedMessage)}`;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div
                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-900 dark:text-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Broadcast &amp; Share Listing</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Share with campus group chats and social feeds
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Share Channels */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-all font-medium text-xs gap-1.5"
                        >
                            <MessageCircle className="w-5 h-5" />
                            <span>WhatsApp</span>
                        </a>
                        <a
                            href={telegramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 transition-all font-medium text-xs gap-1.5"
                        >
                            <Send className="w-5 h-5" />
                            <span>Telegram</span>
                        </a>
                        <a
                            href={emailUrl}
                            className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-all font-medium text-xs gap-1.5"
                        >
                            <Mail className="w-5 h-5" />
                            <span>Email</span>
                        </a>
                        {typeof navigator !== 'undefined' && navigator.share && (
                            <button
                                onClick={handleNativeShare}
                                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all font-medium text-xs gap-1.5"
                            >
                                <Smartphone className="w-5 h-5" />
                                <span>More...</span>
                            </button>
                        )}
                    </div>

                    {/* Pre-formatted text box */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Pre-formatted Announcement Text:
                            </label>
                            <button
                                onClick={handleCopyFormatted}
                                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            >
                                {copiedText ? (
                                    <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Copied!</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy Text</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <textarea
                            readOnly
                            value={formattedMessage}
                            rows={5}
                            className="w-full text-xs font-mono p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 resize-none focus:outline-none"
                        />
                    </div>

                    {/* Copy Link input */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                            Direct Link:
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                readOnly
                                value={currentUrl}
                                className="flex-1 px-3 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
                            />
                            <button
                                onClick={handleCopyLink}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                            >
                                {copiedLink ? (
                                    <>
                                        <Check className="w-3.5 h-3.5" />
                                        <span>Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
