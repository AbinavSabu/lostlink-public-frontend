import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Share2,
    QrCode,
    Printer,
    Award,
    Edit,
    Tag,
    Building2
} from 'lucide-react';

export default function ItemHeader({
    item,
    isOwnerOrAdmin,
    onOpenShare,
    onOpenTag,
    onOpenFlyer,
    onOpenCert,
    onOpenEdit
}) {
    if (!item) return null;

    const isLost = (item.status || '').toUpperCase() === 'LOST';
    const isReunited = (item.status || '').toUpperCase() === 'REUNITED';

    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div>
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-2 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to all listings</span>
                </Link>

                <div className="flex items-center flex-wrap gap-3">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        {item.title}
                    </h1>
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                            isLost
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                : isReunited
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                    >
                        {item.status}
                    </span>
                    {item.reward && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            <span>Reward: {item.reward}</span>
                        </span>
                    )}
                </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center flex-wrap gap-2">
                <button
                    onClick={onOpenShare}
                    className="px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
                    title="Share item alert on WhatsApp, Telegram, or Email"
                >
                    <Share2 className="w-4 h-4 text-indigo-500" />
                    <span>Share Alert</span>
                </button>

                <button
                    onClick={onOpenTag}
                    className="px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
                    title="View printable QR Custody Tag"
                >
                    <QrCode className="w-4 h-4 text-slate-500" />
                    <span className="hidden sm:inline">Custody Tag</span>
                </button>

                <button
                    onClick={onOpenFlyer}
                    className="px-3 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 shadow-sm"
                    title="Generate PDF Flyer to print on campus notice boards"
                >
                    <Printer className="w-4 h-4 text-slate-500" />
                    <span className="hidden sm:inline">Notice Flyer</span>
                </button>

                {isReunited && (
                    <button
                        onClick={onOpenCert}
                        className="px-3 py-2 text-xs font-bold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-all flex items-center gap-1.5 shadow-sm"
                        title="Download official Handover Certificate"
                    >
                        <Award className="w-4 h-4" />
                        <span>Certificate</span>
                    </button>
                )}

                {isOwnerOrAdmin && onOpenEdit && (
                    <button
                        onClick={onOpenEdit}
                        className="px-3 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all flex items-center gap-1.5 shadow-sm"
                    >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                    </button>
                )}
            </div>
        </div>
    );
}
