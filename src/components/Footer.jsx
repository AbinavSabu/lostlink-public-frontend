import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Heart, Sparkles, HelpCircle } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="mt-auto border-t border-slate-200/80 bg-white/70 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand column */}
                    <div className="md:col-span-2 space-y-3">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-soft">
                                <Compass className="w-5 h-5" />
                            </div>
                            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-700 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                                LostLink
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 leading-relaxed max-w-sm">
                            The central campus hub for reporting, tracking, and reuniting lost belongings with their rightful owners safely and transparently.
                        </p>
                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-3 py-1.5 rounded-full w-fit">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Protected by 6-Digit Handover Verification</span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3.5">
                            Quick Links
                        </h4>
                        <ul className="space-y-2.5 text-sm text-slate-600 font-medium">
                            <li>
                                <Link to="/" className="hover:text-indigo-600 transition flex items-center gap-1.5">
                                    <span>Browse Listings</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/create-item" className="hover:text-indigo-600 transition flex items-center gap-1.5">
                                    <span>Report an Item</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/my-items" className="hover:text-indigo-600 transition flex items-center gap-1.5">
                                    <span>My Submissions & Claims</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/notifications" className="hover:text-indigo-600 transition flex items-center gap-1.5">
                                    <span>Notifications Center</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Recovery Tips */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3.5">
                            Recovery Tips
                        </h4>
                        <div className="space-y-2 text-xs text-slate-500 leading-relaxed">
                            <p className="flex items-start gap-1.5">
                                <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                                <span>Upload clear photos and note exact identifying marks or colors.</span>
                            </p>
                            <p className="flex items-start gap-1.5">
                                <HelpCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <span>Always complete handovers in well-lit public campus locations.</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
                    <p>© {new Date().getFullYear()} Campus LostLink Portal. All rights reserved.</p>
                    <p className="flex items-center gap-1">
                        Designed with care for a safe campus community <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    </p>
                </div>
            </div>
        </footer>
    );
}
