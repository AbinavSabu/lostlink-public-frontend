import { useState, useRef, useEffect } from 'react';
import {
    MessageSquare,
    X,
    Send,
    Camera,
    Loader2,
    User,
    Sparkles,
    Image as ImageIcon
} from 'lucide-react';
import { compressImage } from '../../utils/imageCompressor';
import { getImageUrl } from '../../utils/imageUrl';

export default function ChatDrawer({
    isOpen,
    onClose,
    item,
    currentUser,
    messages,
    onSendMessage,
    sendingMessage,
    activeClaimantIds,
    selectedClaimantId,
    onSelectClaimantId
}) {
    const [text, setText] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [compressionBadge, setCompressionBadge] = useState(null);

    const fileInputRef = useRef(null);
    const endRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            endRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [isOpen, messages]);

    if (!isOpen || !item) return null;

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const compressed = await compressImage(file, { maxWidth: 1200, quality: 0.8 });
            setImageFile(compressed);
            setImagePreview(URL.createObjectURL(compressed));
            if (compressed.savingsPercent) {
                setCompressionBadge(`⚡ Compressed (${compressed.savingsPercent}% smaller)`);
            }
        } catch {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleRemoveImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(null);
        setImagePreview(null);
        setCompressionBadge(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if ((!text.trim() && !imageFile) || sendingMessage) return;

        const content = text.trim();
        const fileToSend = imageFile;

        setText('');
        handleRemoveImage();

        await onSendMessage({
            content,
            imageFile: fileToSend,
            claimantId: selectedClaimantId
        });
    };

    const currentUserId = currentUser?.id;

    return (
        <div className="fixed inset-y-0 right-0 z-[9999] w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col text-slate-900 dark:text-slate-100 animate-in slide-in-from-right duration-200">
            {/* Chat Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm">Live Discussion Thread</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                            {item.title}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Claimant Thread Scoping (for item reporter when multiple claims exist) */}
            {activeClaimantIds && activeClaimantIds.length > 1 && (
                <div className="px-4 py-2 bg-indigo-50/60 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center gap-2 overflow-x-auto text-xs">
                    <span className="font-bold text-indigo-900 dark:text-indigo-300 flex-shrink-0">
                        Threads:
                    </span>
                    {activeClaimantIds.map((cid) => (
                        <button
                            key={cid}
                            onClick={() => onSelectClaimantId(cid)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                selectedClaimantId === cid
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-100'
                            }`}
                        >
                            Claimant #{cid}
                        </button>
                    ))}
                </div>
            )}

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 p-6">
                        <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
                        <p className="text-xs font-medium">No messages yet.</p>
                        <p className="text-[11px] mt-1">
                            Ask questions or arrange meeting times securely.
                        </p>
                    </div>
                ) : (
                    messages.map((m) => {
                        const isMe = currentUserId && Number(m.senderId) === Number(currentUserId);
                        return (
                            <div
                                key={m.id || Math.random()}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 mb-1 px-1 font-medium">
                                    {isMe ? 'You' : m.senderName || `User #${m.senderId}`}
                                </span>
                                <div
                                    className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                                        isMe
                                            ? 'bg-indigo-600 text-white rounded-br-xs shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-xs border border-slate-200/60 dark:border-slate-700/60'
                                    }`}
                                >
                                    {m.imageUrl && (
                                        <img
                                            src={getImageUrl(m.imageUrl)}
                                            alt="Attachment"
                                            className="w-full max-h-48 object-cover rounded-xl mb-1.5 border border-white/20"
                                        />
                                    )}
                                    {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                                </div>
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 px-1">
                                    {m.sentAt ? new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={endRef} />
            </div>

            {/* Photo Preview inside Chat */}
            {imagePreview && (
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img
                            src={imagePreview}
                            alt="Attachment preview"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-300 dark:border-slate-600"
                        />
                        {compressionBadge && (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                {compressionBadge}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={handleRemoveImage}
                        className="p-1 rounded-full text-slate-400 hover:text-rose-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Input Bar */}
            <form
                onSubmit={handleSend}
                className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
            >
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Attach photo"
                >
                    <Camera className="w-5 h-5" />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />

                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                    type="submit"
                    disabled={(!text.trim() && !imageFile) || sendingMessage}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white rounded-xl transition-all shadow-sm flex-shrink-0"
                >
                    {sendingMessage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Send className="w-4 h-4" />
                    )}
                </button>
            </form>
        </div>
    );
}
