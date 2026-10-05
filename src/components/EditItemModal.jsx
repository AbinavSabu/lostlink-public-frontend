import { useState, useEffect } from 'react';
import api from '../api/axios';
import { X, Save, AlertCircle, Loader2, Tag, MapPin, FileText, HelpCircle, Award, Building2 } from 'lucide-react';

export default function EditItemModal({ item, isOpen, onClose, onUpdated }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('ELECTRONICS');
    const [location, setLocation] = useState('');
    const [verificationQuestion, setVerificationQuestion] = useState('');
    const [reward, setReward] = useState('');
    const [custodyDesk, setCustodyDesk] = useState('');
    const [storageBin, setStorageBin] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (item) {
            setTitle(item.title || '');
            setDescription(item.description || '');
            setCategory(item.category || 'ELECTRONICS');
            setLocation(item.location || '');
            setVerificationQuestion(item.verificationQuestion || '');
            setReward(item.reward || '');
            setCustodyDesk(item.custodyDesk || '');
            setStorageBin(item.storageBin || '');
            setError('');
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                category,
                location: location.trim(),
                verificationQuestion: verificationQuestion.trim() || null,
                reward: reward.trim() || null,
                custodyDesk: custodyDesk.trim() || null,
                storageBin: storageBin.trim() || null
            };

            const res = await api.put(`/items/${item.id}`, payload);
            if (onUpdated) onUpdated(res.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update item.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-soft-xl border border-slate-200 my-8">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h3 className="text-base font-black text-slate-800">Edit Listing #{item.id}</h3>
                        <p className="text-xs text-slate-500">Update item details, location, and question</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Category
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                            >
                                <option value="ELECTRONICS">Electronics</option>
                                <option value="WALLETS_CARDS">Wallets & Cards</option>
                                <option value="KEYS">Keys</option>
                                <option value="CLOTHING">Clothing & Accessories</option>
                                <option value="DOCUMENTS">Books & Documents</option>
                                <option value="OTHER">Other Belongings</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                Location Name <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Description <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={3}
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            Secret Verification Question (Optional)
                        </label>
                        <input
                            type="text"
                            value={verificationQuestion}
                            onChange={(e) => setVerificationQuestion(e.target.value)}
                            placeholder="e.g. What is the wallpaper image? What color keychain?"
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
                        />
                    </div>

                    {/* Reward & Bounty */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-amber-800 mb-1.5 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <span>Finder's Reward / Bounty (Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={reward}
                            onChange={(e) => setReward(e.target.value)}
                            placeholder="e.g. $25, Coffee treat"
                            className="w-full px-4 py-2 bg-amber-50/40 border border-amber-200 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-amber-500/10"
                        />
                    </div>

                    {/* Custody Desk */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1.5 flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Campus Help Desk Custody (Optional)</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <select
                                value={custodyDesk}
                                onChange={(e) => setCustodyDesk(e.target.value)}
                                className="w-full px-3 py-2 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                            >
                                <option value="">Kept in personal custody</option>
                                <option value="Main Campus Library Reception">Main Campus Library Reception</option>
                                <option value="Campus Security Post 1 (Main Gate)">Campus Security Post 1 (Main Gate)</option>
                                <option value="Campus Security West Gate">Campus Security West Gate</option>
                                <option value="Student Union Information Desk">Student Union Information Desk</option>
                                <option value="Science & Tech Building Help Desk">Science & Tech Building Help Desk</option>
                                <option value="Department Office / Staff Room">Department Office / Staff Room</option>
                            </select>
                            <input
                                type="text"
                                value={storageBin}
                                onChange={(e) => setStorageBin(e.target.value)}
                                placeholder="Locker / Storage Bin (e.g. Bin #4)"
                                className="w-full px-3 py-2 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
                            />
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-soft disabled:opacity-50 cursor-pointer"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Saving Changes...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Save Listing Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
