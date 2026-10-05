import { useState, useRef } from 'react';
import {
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    KeyRound,
    Camera,
    UploadCloud,
    X,
    Loader2,
    Send,
    Sparkles,
    Lock,
    Copy,
    Check
} from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';
import { getImageUrl } from '../../utils/imageUrl';

export default function ClaimSection({
    item,
    myExistingClaim,
    onSubmitClaim,
    claimSubmitting,
    isOwner,
    user
}) {
    const [proofDescription, setProofDescription] = useState('');
    const [verificationAnswer, setVerificationAnswer] = useState('');
    const [proofImageFile, setProofImageFile] = useState(null);
    const [proofImagePreview, setProofImagePreview] = useState(null);
    const [compressionSavings, setCompressionSavings] = useState(null);
    const [formError, setFormError] = useState('');
    const [copiedPin, setCopiedPin] = useState(false);

    const fileInputRef = useRef(null);

    const isResolved =
        (item?.status || '').toUpperCase() === 'CLAIMED' ||
        (item?.status || '').toUpperCase() === 'REUNITED';

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFormError('');
        if (!file.type.startsWith('image/')) {
            setFormError('Please select a valid image file (JPG, PNG, WEBP).');
            return;
        }

        try {
            // Compress on client side before upload
            const compressed = await compressImage(file, { maxWidth: 1400, quality: 0.8 });
            setProofImageFile(compressed);
            setProofImagePreview(URL.createObjectURL(compressed));

            if (compressed.savingsPercent && compressed.savingsPercent > 0) {
                const origMb = (compressed.originalSize / (1024 * 1024)).toFixed(1);
                const compKb = Math.round(compressed.compressedSize / 1024);
                setCompressionSavings(`${origMb}MB ➔ ${compKb}KB (${compressed.savingsPercent}% faster)`);
            } else {
                setCompressionSavings(null);
            }
        } catch {
            setProofImageFile(file);
            setProofImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveProofImage = () => {
        if (proofImagePreview) URL.revokeObjectURL(proofImagePreview);
        setProofImageFile(null);
        setProofImagePreview(null);
        setCompressionSavings(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!proofDescription.trim()) {
            setFormError('Please provide a detailed description of your proof of ownership.');
            return;
        }

        if (item?.verificationQuestion && !verificationAnswer.trim()) {
            setFormError('Please answer the security verification question.');
            return;
        }

        await onSubmitClaim({
            proofDescription: proofDescription.trim(),
            verificationAnswer: verificationAnswer.trim(),
            proofImageFile
        });
    };

    const handleCopyPin = (pin) => {
        if (!pin) return;
        navigator.clipboard.writeText(pin);
        setCopiedPin(true);
        setTimeout(() => setCopiedPin(false), 2000);
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    Ownership Claim &amp; Verification
                </h3>
            </div>

            {/* Case 1: User has an active filed claim */}
            {myExistingClaim ? (
                <div className="space-y-4">
                    <div
                        className={`p-4 rounded-2xl border ${
                            (myExistingClaim.status || '').toUpperCase() === 'APPROVED'
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                                : (myExistingClaim.status || '').toUpperCase() === 'REJECTED'
                                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Your Claim Status
                            </span>
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                                    (myExistingClaim.status || '').toUpperCase() === 'APPROVED'
                                        ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                                        : (myExistingClaim.status || '').toUpperCase() === 'REJECTED'
                                        ? 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-200'
                                        : 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                                }`}
                            >
                                {myExistingClaim.status}
                            </span>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300">
                            <strong>Submitted Proof:</strong> {myExistingClaim.proofDescription}
                        </p>

                        {/* Approved Claim 6-digit Handover PIN Display */}
                        {(myExistingClaim.status || '').toUpperCase() === 'APPROVED' && (
                            <div className="mt-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide block">
                                        Your 6-Digit Handover PIN:
                                    </span>
                                    <span className="text-lg font-mono font-black text-emerald-900 dark:text-emerald-200 tracking-wider">
                                        {myExistingClaim.handoverPin || '******'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 block">
                                        Give this PIN to the finder in person to verify collection.
                                    </span>
                                </div>
                                {myExistingClaim.handoverPin && (
                                    <button
                                        onClick={() => handleCopyPin(myExistingClaim.handoverPin)}
                                        className="p-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 transition-all text-xs flex items-center gap-1 font-semibold"
                                    >
                                        {copiedPin ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                                        <span>{copiedPin ? 'Copied' : 'Copy'}</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : isOwner ? (
                /* Case 2: User is the reporter */
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                    <p className="font-semibold">You reported this item listing.</p>
                    <p className="mt-1">
                        Review incoming claims from finders or students under{' '}
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">My Items &gt; Received Claims</span>.
                    </p>
                </div>
            ) : isResolved ? (
                /* Case 3: Item already claimed */
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 text-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                        This item has already been claimed &amp; resolved.
                    </p>
                </div>
            ) : !user ? (
                /* Case 4: Not logged in */
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-200 text-center">
                    <p className="font-semibold mb-2">Sign in to assert ownership over this item.</p>
                    <a
                        href="/login"
                        className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm"
                    >
                        Sign In to Claim
                    </a>
                </div>
            ) : (
                /* Case 5: Eligible to submit claim */
                <form onSubmit={handleSubmit} className="space-y-4">
                    {formError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    {/* Security Question Answer */}
                    {item?.verificationQuestion && (
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Answer Security Question: <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={verificationAnswer}
                                onChange={(e) => setVerificationAnswer(e.target.value)}
                                placeholder="Enter secret answer known only to owner"
                                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    )}

                    {/* Proof Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Proof Description &amp; Identifying Details: <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            value={proofDescription}
                            onChange={(e) => setProofDescription(e.target.value)}
                            placeholder="Describe unique marks, serial numbers, wallpapers, stickers, or purchase details that verify you own this item."
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Photo Proof Upload with Compression */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Attach Photo Proof (Optional):
                        </label>
                        {proofImagePreview ? (
                            <div className="relative inline-block">
                                <img
                                    src={proofImagePreview}
                                    alt="Proof"
                                    className="w-24 h-24 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                                />
                                <button
                                    type="button"
                                    onClick={handleRemoveProofImage}
                                    className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-sm"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                                {compressionSavings && (
                                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                                        ⚡ {compressionSavings}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full py-3 px-4 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                <Camera className="w-4 h-4 text-slate-400" />
                                <span>Upload photo of receipt, past photo, or serial sticker</span>
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={claimSubmitting}
                        className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        {claimSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Submitting Claim...</span>
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                <span>Submit Ownership Claim</span>
                            </>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}
