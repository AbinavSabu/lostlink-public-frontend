import { CheckCircle2, Clock, ShieldCheck, KeyRound, Check, AlertCircle } from 'lucide-react';

export default function ItemLifecycleStepper({ item, claim }) {
    if (!item) return null;

    const status = (item.status || '').toUpperCase();
    const isApproved = claim && (claim.status || '').toUpperCase() === 'APPROVED';
    const isHandoverVerified = claim && Boolean(claim.handoverVerified);
    const isReunited = status === 'REUNITED' || isHandoverVerified;
    const hasClaim = Boolean(claim);

    const steps = [
        {
            id: 1,
            label: 'Reported',
            desc: item.date ? `Logged on ${item.date}` : 'Item cataloged',
            isComplete: true,
            isCurrent: !hasClaim && !isReunited
        },
        {
            id: 2,
            label: 'Claim Filed',
            desc: hasClaim ? 'Ownership asserted' : 'Awaiting claimant',
            isComplete: hasClaim,
            isCurrent: hasClaim && !isApproved && !isReunited
        },
        {
            id: 3,
            label: 'Approved & PIN',
            desc: isApproved || isReunited ? '6-digit OTP issued' : 'Under verification',
            isComplete: isApproved || isReunited,
            isCurrent: isApproved && !isReunited
        },
        {
            id: 4,
            label: 'Reunited',
            desc: isReunited ? 'Handover completed' : 'Final handoff',
            isComplete: isReunited,
            isCurrent: isReunited
        }
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                        Item Lifecycle &amp; Custody Trail
                    </h3>
                </div>
                <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        isReunited
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : isApproved
                            ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                >
                    {status}
                </span>
            </div>

            {/* Stepper Progress Bar */}
            <div className="relative flex items-center justify-between">
                <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 dark:bg-slate-800 -z-0" />
                <div
                    className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 transition-all duration-500 -z-0"
                    style={{
                        width: isReunited
                            ? 'calc(100% - 48px)'
                            : isApproved
                            ? 'calc(66% - 32px)'
                            : hasClaim
                            ? 'calc(33% - 16px)'
                            : '0%'
                    }}
                />

                {steps.map((step) => (
                    <div key={step.id} className="relative z-10 flex flex-col items-center">
                        <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                step.isComplete
                                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-50 dark:ring-indigo-950'
                                    : step.isCurrent
                                    ? 'bg-white dark:bg-slate-900 border-2 border-indigo-600 text-indigo-600 ring-4 ring-indigo-50 dark:ring-indigo-950 animate-pulse'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                            }`}
                        >
                            {step.isComplete ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                        </div>
                        <span className="mt-2 text-xs font-bold text-slate-900 dark:text-slate-100 text-center">
                            {step.label}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 text-center hidden sm:block">
                            {step.desc}
                        </span>
                    </div>
                ))}
            </div>

            {/* Custody Desk Audit Info */}
            {(item.custodyDesk || item.storageBin) && (
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {item.custodyDesk && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">Custody Desk:</span>
                            <span className="font-bold">{item.custodyDesk}</span>
                        </div>
                    )}
                    {item.storageBin && (
                        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-slate-500 dark:text-slate-400">Shelf / Storage Bin:</span>
                            <span className="font-bold">{item.storageBin}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
