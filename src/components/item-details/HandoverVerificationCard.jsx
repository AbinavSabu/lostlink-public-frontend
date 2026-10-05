import { useState } from 'react';
import {
    KeyRound,
    CheckCircle2,
    AlertCircle,
    Loader2,
    ShieldCheck,
    Award
} from 'lucide-react';

export default function HandoverVerificationCard({
    item,
    claim,
    onVerifyPin,
    verifyingPin,
    pinError,
    onOpenCert
}) {
    const [enteredPin, setEnteredPin] = useState('');

    if (!item) return null;

    const isReunited = (item.status || '').toUpperCase() === 'REUNITED';
    const isApproved = claim && (claim.status || '').toUpperCase() === 'APPROVED';

    // Only show if claim is approved or already reunited
    if (!isApproved && !isReunited) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (enteredPin.trim().length === 6) {
            onVerifyPin(enteredPin.trim());
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
                <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    In-Person Handover PIN Authentication
                </h3>
            </div>

            {isReunited ? (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs">
                    <div className="flex items-center gap-2 font-bold text-sm mb-1 text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Handover Authentication Verified!</span>
                    </div>
                    <p>
                        The 6-digit OTP was validated successfully. This item is officially marked as{' '}
                        <strong>REUNITED</strong> with its rightful owner.
                    </p>
                    {onOpenCert && (
                        <button
                            onClick={onOpenCert}
                            className="mt-3 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                        >
                            <Award className="w-4 h-4" />
                            <span>Download Official Certificate</span>
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-3 text-xs">
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        The claimant has been given a secure <strong>6-digit numeric OTP</strong>. Ask them for
                        their PIN when they collect the item in person and enter it below to verify handover.
                    </p>

                    {pinError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{pinError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex gap-2 items-center pt-1">
                        <input
                            type="text"
                            maxLength={6}
                            value={enteredPin}
                            onChange={(e) => setEnteredPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 6-digit PIN"
                            className="w-40 px-3.5 py-2.5 text-center font-mono font-black tracking-widest text-base rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            disabled={verifyingPin || enteredPin.length !== 6}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                        >
                            {verifyingPin ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Verify Handover</span>
                                </>
                            )}
                        </button>
                    </form>
                    <span className="text-[10px] text-slate-400 block">
                        Protected by 5-attempt rate-limiting lockout to prevent brute-forcing.
                    </span>
                </div>
            )}
        </div>
    );
}
