import { useState } from 'react';
import {
    MapPin,
    Calendar,
    Tag,
    HelpCircle,
    User,
    Clock,
    AlertTriangle,
    Maximize2,
    X,
    Building2,
    ShieldAlert
} from 'lucide-react';
import { getImageUrl, handleImageError } from '../../utils/imageUrl';

export default function ItemOverviewCard({ item }) {
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    if (!item) return null;

    // Calculate campus custody retention days for FOUND items (60-day policy)
    const calculateRetention = () => {
        if (!item.date || (item.status || '').toUpperCase() !== 'FOUND') return null;
        const reportedDate = new Date(item.date);
        const today = new Date();
        const diffDays = Math.floor((today - reportedDate) / (1000 * 60 * 60 * 24));
        const remainingDays = Math.max(0, 60 - diffDays);
        return {
            diffDays,
            remainingDays,
            isNearExpiry: remainingDays <= 14
        };
    };

    const retention = calculateRetention();

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            {/* Image Preview with Zoom */}
            {item.imageUrl && !imageError ? (
                <div className="relative group rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 aspect-video max-h-[360px] flex items-center justify-center">
                    <img
                        src={getImageUrl(item.imageUrl)}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                        onClick={() => setIsZoomOpen(true)}
                        onError={(e) => handleImageError(e, { onFallback: () => setImageError(true) })}
                    />
                    <button
                        onClick={() => setIsZoomOpen(true)}
                        className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-xs font-semibold"
                    >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Enlarge Photo</span>
                    </button>
                </div>
            ) : (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 dark:text-slate-600">
                    <Tag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-medium">No photo provided with this listing</p>
                </div>
            )}

            {/* Retention Urgency Banner (Found items only) */}
            {retention && (
                <div
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs ${
                        retention.isNearExpiry
                            ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200'
                            : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200'
                    }`}
                >
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <div>
                        <span className="font-bold">Campus Custody Retention Policy: </span>
                        <span>
                            Held for {retention.diffDays} days ({retention.remainingDays} days remaining before
                            campus donation review).
                        </span>
                    </div>
                </div>
            )}

            {/* Key Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Category
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate">
                        {item.category || 'General'}
                    </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Date
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                        {item.date || 'Recent'}
                    </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        Location
                    </div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate">
                        {item.location || 'Campus'}
                    </div>
                </div>
            </div>

            {/* Description */}
            <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                    Item Description
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {item.description || 'No description provided.'}
                </p>
            </div>

            {/* Security Verification Question */}
            {item.verificationQuestion && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60">
                    <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold text-xs mb-1">
                        <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>Owner Verification Question</span>
                    </div>
                    <p className="text-xs text-indigo-950 dark:text-indigo-200 font-medium">
                        "{item.verificationQuestion}"
                    </p>
                    <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80 mt-1">
                        Claimants must answer this question correctly to prove ownership.
                    </p>
                </div>
            )}

            {/* Reporter Contact Info */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                        {item.userName ? item.userName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                            {item.userName || 'Anonymous User'}
                        </span>
                        <span className="text-[10px]">Listing Author</span>
                    </div>
                </div>
                {item.userEmail && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        {item.userEmail}
                    </span>
                )}
            </div>

            {/* Lightbox Zoom Modal */}
            {isZoomOpen && (
                <div
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                    onClick={() => setIsZoomOpen(false)}
                >
                    <button
                        onClick={() => setIsZoomOpen(false)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/40 text-white transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={getImageUrl(item.imageUrl)}
                        alt={item.title}
                        className="max-w-full max-h-[90vh] rounded-xl object-contain shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
