import { QRCodeSVG } from 'qrcode.react';
import { X, Printer, Phone, Calendar, MapPin, Tag, Award, Building2, Scissors } from 'lucide-react';
import { getImageUrl } from '../utils/imageUrl';

export default function PrintableFlyerModal({ item, isOpen, onClose }) {
    if (!isOpen || !item) return null;

    const isLost = item.status === 'LOST';
    const itemUrl = `${window.location.origin}/items/${item.id}`;
    const contactInfo = item.phoneNumber || item.userEmail || 'Campus Lost & Found Desk';

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in overflow-y-auto">
            {/* Modal Container */}
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200 my-6 print:m-0 print:p-0 print:border-none print:shadow-none print:max-h-none print:overflow-visible">
                
                {/* Modal Top Bar (Hidden on Print) */}
                <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 print:hidden bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                            <Printer className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Printable Noticeboard Flyer</h3>
                            <p className="text-[11px] text-slate-500">A4 campus noticeboard bulletin with QR & tear-off tabs</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Print / Save as PDF</span>
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Flyer Sheet Body */}
                <div id="noticeboard-flyer-content" className="p-6 sm:p-8 bg-white print:p-4 text-slate-900">
                    {/* Header Banner */}
                    <div className={`text-center py-4 px-6 rounded-2xl border-4 ${
                        isLost 
                            ? 'bg-rose-50 border-rose-500 text-rose-600' 
                            : 'bg-emerald-50 border-emerald-500 text-emerald-700'
                    }`}>
                        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider">
                            {isLost ? 'MISSING / LOST' : 'FOUND ON CAMPUS'}
                        </h1>
                        <p className="text-xs sm:text-sm font-bold tracking-widest uppercase mt-0.5 opacity-90">
                            {isLost ? 'Have you seen this item on campus?' : 'Did you misplace this item? Claim it below.'}
                        </p>
                    </div>

                    {/* Reward Callout (if offered) */}
                    {item.reward && (
                        <div className="mt-4 bg-amber-50 border-2 border-amber-400 rounded-xl p-3 text-center flex items-center justify-center gap-2">
                            <Award className="w-5 h-5 text-amber-600 animate-bounce" />
                            <span className="text-sm font-black uppercase tracking-wider text-amber-900">
                                REWARD OFFERED: {item.reward}
                            </span>
                        </div>
                    )}

                    {/* Main Content Grid */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
                        {/* Photo Column */}
                        <div className="sm:col-span-1 flex flex-col items-center">
                            <div className="w-full aspect-square bg-slate-100 rounded-2xl border-2 border-slate-300 overflow-hidden flex items-center justify-center shadow-inner">
                                {item.imageUrl ? (
                                    <img
                                        src={getImageUrl(item.imageUrl)}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center p-4 text-slate-400">
                                        <Tag className="w-12 h-12 mx-auto mb-2 opacity-40" />
                                        <span className="text-xs font-semibold">No Image Provided</span>
                                    </div>
                                )}
                            </div>

                            {/* Live Smartphone QR Code */}
                            <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center flex flex-col items-center w-full">
                                <QRCodeSVG value={itemUrl} size={110} level="M" />
                                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mt-2">
                                    Scan to view & claim
                                </span>
                                <span className="text-[9px] text-slate-400 truncate max-w-full font-mono">
                                    Item #{item.id}
                                </span>
                            </div>
                        </div>

                        {/* Details Column */}
                        <div className="sm:col-span-2 space-y-4">
                            <div>
                                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 mb-1">
                                    {item.category?.replace('_', ' ')}
                                </span>
                                <h2 className="text-2xl font-black text-slate-900 leading-tight">
                                    {item.title}
                                </h2>
                            </div>

                            <div className="space-y-2 text-xs text-slate-700 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                                    <span><strong>Location:</strong> {item.location || 'Campus'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                    <span><strong>Date:</strong> {item.date || 'Recently'}</span>
                                </div>
                                {item.custodyDesk && (
                                    <div className="flex items-center gap-2 text-indigo-700 font-semibold">
                                        <Building2 className="w-4 h-4 flex-shrink-0" />
                                        <span><strong>Campus Desk:</strong> {item.custodyDesk} {item.storageBin ? `(Bin: ${item.storageBin})` : ''}</span>
                                    </div>
                                )}
                                {item.phoneNumber && (
                                    <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                                        <Phone className="w-4 h-4 flex-shrink-0" />
                                        <span><strong>Contact Phone:</strong> {item.phoneNumber}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                    Description & Distinguishing Features:
                                </h4>
                                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-white border border-slate-200 rounded-xl p-3">
                                    {item.description || 'No detailed description provided.'}
                                </p>
                            </div>

                            <div className="text-[11px] text-slate-500 font-medium">
                                If found or recognized, please scan the QR code or contact via the tear-off slips below.
                            </div>
                        </div>
                    </div>

                    {/* Tear-Off Slips Perforation Line */}
                    <div className="mt-8 pt-4 border-t-2 border-dashed border-slate-400">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                            <span className="flex items-center gap-1"><Scissors className="w-3 h-3" /> Cut / Tear Along Perforations</span>
                            <span>Campus LostLink Platform • Item #{item.id}</span>
                        </div>

                        {/* Grid of 6 Tear-Off Tabs */}
                        <div className="grid grid-cols-6 gap-2 border-t border-slate-300 pt-2">
                            {[1, 2, 3, 4, 5, 6].map((tabIdx) => (
                                <div
                                    key={tabIdx}
                                    className="border-l first:border-l-0 border-dashed border-slate-300 pl-1.5 pr-1 py-1 text-center flex flex-col justify-between min-h-[90px]"
                                >
                                    <div className="space-y-0.5">
                                        <div className="text-[9px] font-black uppercase text-slate-800 line-clamp-1">
                                            {isLost ? 'LOST ITEM' : 'FOUND ITEM'}
                                        </div>
                                        <div className="text-[8px] font-bold text-slate-600 line-clamp-2 leading-tight">
                                            {item.title}
                                        </div>
                                    </div>
                                    <div className="space-y-0.5 mt-2">
                                        {item.reward && (
                                            <div className="text-[8px] font-extrabold text-amber-700 bg-amber-50 rounded px-0.5">
                                                🪙 {item.reward}
                                            </div>
                                        )}
                                        <div className="text-[8px] font-mono text-slate-500 truncate">
                                            #{item.id}
                                        </div>
                                        <div className="text-[8px] font-bold text-indigo-700 truncate">
                                            {contactInfo}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Print Stylesheet Hook */}
                <style>{`
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #noticeboard-flyer-content, #noticeboard-flyer-content * {
                            visibility: visible;
                        }
                        #noticeboard-flyer-content {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            padding: 20px !important;
                            border: none !important;
                            box-shadow: none !important;
                        }
                    }
                `}</style>
            </div>
        </div>
    );
}
