import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Award, Printer, X, ShieldCheck, Tag } from 'lucide-react';

export default function HandoverCertificateModal({ item, isOpen, onClose, defaultTab }) {
    const isReunited = (item?.status || '').toUpperCase() === 'REUNITED';
    const [activeTab, setActiveTab] = useState(defaultTab || (isReunited ? 'certificate' : 'tag'));

    useEffect(() => {
        if (defaultTab) {
            setActiveTab(defaultTab);
        } else {
            setActiveTab(isReunited ? 'certificate' : 'tag');
        }
    }, [defaultTab, isReunited, isOpen]);

    if (!isOpen || !item) return null;

    const itemUrl = `${window.location.origin}/items/${item.id}`;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-soft-xl border border-slate-200 overflow-hidden print:m-0 print:p-0 print:border-none print:shadow-none">
                
                {/* Header (Hidden on Print) */}
                <div className="flex items-center justify-between p-5 border-b border-slate-100 print:hidden bg-slate-50/50">
                    <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-2xl">
                        <button
                            type="button"
                            onClick={() => setActiveTab('tag')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                                activeTab === 'tag'
                                    ? 'bg-white text-indigo-700 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Tag className="w-3.5 h-3.5" />
                            <span>Custody Tag</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('certificate')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition ${
                                activeTab === 'certificate'
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Award className="w-3.5 h-3.5" />
                            <span>Return Certificate</span>
                        </button>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Printable Content Area */}
                {activeTab === 'tag' ? (
                    /* --- 1. Printable Custody Property Tag View --- */
                    <div id="printable-custody-tag" className="p-6 space-y-4 bg-slate-50/50 print:bg-white print:p-8">
                        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-4 shadow-sm">
                            <div className="flex items-center justify-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-widest border-b border-slate-100 pb-3">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                                <span>Campus LostLink Property Tag</span>
                            </div>

                            {/* QR Code */}
                            <div className="flex justify-center p-2 bg-white inline-block mx-auto rounded-xl border border-slate-200">
                                <QRCodeSVG
                                    value={itemUrl}
                                    size={140}
                                    level="M"
                                    includeMargin={true}
                                />
                            </div>

                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Listing #{item.id} • {item.status || item.type}
                                </div>
                                <h2 className="text-lg font-black text-slate-900 leading-snug mt-1">
                                    {item.title}
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">
                                    Category: <strong>{item.category?.replace('_', ' ')}</strong>
                                </p>
                                <p className="text-xs text-slate-500">
                                    Location: <strong>{item.location}</strong>
                                </p>
                                {item.date && (
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Reported: {new Date(item.date).toLocaleDateString()}
                                    </p>
                                )}
                            </div>

                            {item.verificationQuestion && (
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 text-left text-[11px] text-indigo-900">
                                    <span className="font-bold block text-[10px] text-indigo-600 uppercase tracking-wider">
                                        Secret Verification Question:
                                    </span>
                                    <span>{item.verificationQuestion}</span>
                                </div>
                            )}

                            <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-2">
                                Scan with any smartphone camera to verify custody or contact finder.
                            </div>
                        </div>
                    </div>
                ) : (
                    /* --- 2. Printable Certificate of Return View --- */
                    <div id="printable-certificate" className="p-8 bg-slate-50/60 print:bg-white print:p-10">
                        <div className="bg-white border-2 border-emerald-500/80 rounded-2xl p-8 text-center space-y-6 shadow-soft relative overflow-hidden">
                            {/* Watermark ribbon */}
                            <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Verified Handover</span>
                            </div>

                            <div className="space-y-1 pt-2">
                                <span className="text-xs font-black tracking-widest text-emerald-700 uppercase">
                                    Campus LostLink System
                                </span>
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                                    Certificate of Return
                                </h1>
                                <p className="text-xs text-slate-500">
                                    Official verification that ownership custody was authenticated and restored.
                                </p>
                            </div>

                            {/* Details grid */}
                            <div className="grid grid-cols-2 gap-3 text-left bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Item Title</span>
                                    <span className="font-bold text-slate-800">{item.title}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Listing ID</span>
                                    <span className="font-bold text-slate-800">#{item.id}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Category</span>
                                    <span className="font-bold text-slate-800">{item.category?.replace('_', ' ')}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Resolution Status</span>
                                    <span className="font-bold text-emerald-600">
                                        {isReunited ? 'REUNITED' : (item.status || 'VERIFIED')}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reported By</span>
                                    <span className="font-medium text-slate-700">{item.userName || item.userEmail || 'Finder'}</span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Date Verified</span>
                                    <span className="font-medium text-slate-700">{new Date().toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Signatures */}
                            <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs">
                                <div className="border-t border-dashed border-slate-300 pt-2 text-center text-slate-400 text-[11px]">
                                    Finder / Custodian Signature
                                </div>
                                <div className="border-t border-dashed border-slate-300 pt-2 text-center text-slate-400 text-[11px]">
                                    Claimant / Owner Signature
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Actions (Hidden on Print) */}
                <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between gap-2 print:hidden">
                    <span className="text-[11px] text-slate-400 pl-2">
                        {activeTab === 'tag' ? 'Printable QR identification tag' : 'Official resolution & custody audit receipt'}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                        >
                            Close
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-soft cursor-pointer ${
                                activeTab === 'tag'
                                    ? 'bg-indigo-600 hover:bg-indigo-500'
                                    : 'bg-emerald-600 hover:bg-emerald-500'
                            }`}
                        >
                            <Printer className="w-4 h-4" />
                            <span>{activeTab === 'tag' ? 'Print Property Tag' : 'Print / Save Certificate'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
