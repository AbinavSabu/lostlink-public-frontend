import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Tag, MapPin, Award } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';

export default function PotentialMatchesList({ matches, currentItem }) {
    if (!matches || matches.length === 0) return null;

    const targetType = (currentItem?.status || '').toUpperCase() === 'LOST' ? 'Found Items' : 'Lost Items';

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        Heuristic Match Recommendations
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Top matching {targetType} on campus based on category, keywords, and proximity
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matches.map((match) => (
                    <Link
                        key={match.id}
                        to={`/items/${match.id}`}
                        className="group flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all text-left"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            {match.imageUrl ? (
                                <img
                                    src={getImageUrl(match.imageUrl)}
                                    alt=""
                                    className="w-12 h-12 object-cover rounded-xl flex-shrink-0 border border-slate-200 dark:border-slate-700"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-400">
                                    <Tag className="w-5 h-5" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                    {match.title}
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5 mt-0.5">
                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                    <span>{match.location || 'Campus'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                            {match.matchScore && (
                                <span className="px-2 py-0.5 text-[11px] font-extrabold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                                    {match.matchScore}%
                                </span>
                            )}
                            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
