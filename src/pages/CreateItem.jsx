import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import {
    UploadCloud,
    AlertCircle,
    CheckCircle2,
    X,
    ArrowLeft,
    HelpCircle,
    Sparkles,
    ShieldAlert,
    MapPin,
    Tag,
    FileText,
    Camera,
    Loader2,
    ShieldCheck,
    Award,
    Building2,
    Mic,
    MicOff,
    ExternalLink,
    ArrowRight
} from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';
import { getImageUrl } from '../utils/imageUrl';

const CATEGORIES = [
    { value: 'ELECTRONICS', label: 'Electronics (Laptops, Phones, AirPods)' },
    { value: 'WALLETS_CARDS', label: 'Wallets, IDs & Cards' },
    { value: 'KEYS', label: 'Keys & Fobs' },
    { value: 'CLOTHING', label: 'Clothing, Backpacks & Accessories' },
    { value: 'DOCUMENTS', label: 'Books, Folders & Documents' },
    { value: 'OTHER', label: 'Other Items' }
];

export default function CreateItem() {
    const [searchParams] = useSearchParams();
    const initialType = (searchParams.get('type') || 'LOST').toUpperCase();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('ELECTRONICS');
    const [type, setType] = useState(initialType === 'FOUND' ? 'FOUND' : 'LOST');
    const [location, setLocation] = useState('');
    const [verificationQuestion, setVerificationQuestion] = useState('');
    const [reward, setReward] = useState('');
    const [custodyDesk, setCustodyDesk] = useState('');
    const [storageBin, setStorageBin] = useState('');

    // Image & Compression State
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [compressionInfo, setCompressionInfo] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Real-Time Duplicate / Similar Match Suggestions
    const [debouncedTitle, setDebouncedTitle] = useState('');
    const [similarMatches, setSimilarMatches] = useState([]);
    const [searchingSimilar, setSearchingSimilar] = useState(false);

    // Speech-to-Text State
    const [isListening, setIsListening] = useState(false);
    const speechRecognitionRef = useRef(null);

    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    // Revoke preview object URL on unmount
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    // 300ms debounce on title for real-time match check
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTitle(title.trim());
        }, 300);
        return () => clearTimeout(timer);
    }, [title]);

    // Query opposing listings to prevent duplicate reporting
    useEffect(() => {
        if (!debouncedTitle || debouncedTitle.length < 3) {
            setSimilarMatches([]);
            return;
        }

        const oppositeStatus = type === 'LOST' ? 'FOUND' : 'LOST';

        let isMounted = true;
        setSearchingSimilar(true);

        const fetchSimilar = async () => {
            try {
                const res = await api.get('/items', {
                    params: {
                        keyword: debouncedTitle,
                        category: category,
                        status: oppositeStatus
                    }
                });
                const list = res.data.content || res.data || [];
                if (isMounted) {
                    setSimilarMatches(Array.isArray(list) ? list.slice(0, 3) : []);
                }
            } catch {
                if (isMounted) setSimilarMatches([]);
            } finally {
                if (isMounted) setSearchingSimilar(false);
            }
        };

        void fetchSimilar();

        return () => {
            isMounted = false;
        };
    }, [debouncedTitle, category, type]);

    const resetFileInput = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setImageFile(null);
        setPreviewUrl('');
        setCompressionInfo(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const validateAndSetFile = async (file) => {
        setError('');
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file (JPEG, PNG, or WEBP).');
            resetFileInput();
            return;
        }

        try {
            // Compress on client side before upload
            const compressed = await compressImage(file, { maxWidth: 1600, quality: 0.82 });
            if (previewUrl) URL.revokeObjectURL(previewUrl);

            setImageFile(compressed);
            setPreviewUrl(URL.createObjectURL(compressed));

            if (compressed.savingsPercent && compressed.savingsPercent > 0) {
                const origMb = (compressed.originalSize / (1024 * 1024)).toFixed(1);
                const compKb = Math.round(compressed.compressedSize / 1024);
                setCompressionInfo(
                    `⚡ Compressed ${origMb}MB ➔ ${compKb}KB (${compressed.savingsPercent}% faster upload)`
                );
            } else {
                setCompressionInfo(null);
            }
        } catch {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) void validateAndSetFile(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void validateAndSetFile(file);
    };

    // Voice Speech-to-Text for Description
    const toggleSpeechToText = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Speech Recognition is not supported by your browser.');
            return;
        }

        if (isListening) {
            speechRecognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
        };

        speechRecognitionRef.current = recognition;
        recognition.start();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!title.trim() || !location.trim()) {
            setError('Please provide a title and campus location.');
            return;
        }

        setSubmitting(true);

        try {
            let uploadedImageUrl = null;

            if (imageFile) {
                const fileData = new FormData();
                fileData.append('file', imageFile);

                const uploadRes = await api.post('/items/upload-image', fileData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                uploadedImageUrl = uploadRes.data?.imageUrl || uploadRes.data?.url || uploadRes.data;
            }

            const payload = {
                title: title.trim(),
                description: description.trim(),
                category,
                status: type,
                type,
                location: location.trim(),
                imageUrl: uploadedImageUrl,
                verificationQuestion: verificationQuestion.trim() || null,
                reward: reward.trim() || null,
                custodyDesk: custodyDesk.trim() || null,
                storageBin: storageBin.trim() || null
            };

            const res = await api.post('/items', payload);
            navigate(`/items/${res.data.id}`);
        } catch (err) {
            console.error('Failed to create item:', err);
            setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-200">
            <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-6 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Listings</span>
            </Link>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        Report Property on Campus
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Log lost property or report an item turned in to accelerate campus reunions.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Type Toggle: LOST vs FOUND */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Report Type:
                        </label>
                        <div className="grid grid-cols-2 gap-3 max-w-md">
                            <button
                                type="button"
                                onClick={() => setType('LOST')}
                                className={`py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                                    type === 'LOST'
                                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <span>I Lost Something</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('FOUND')}
                                className={`py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                                    type === 'FOUND'
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                <span>I Found Something</span>
                            </button>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                            Item Title / Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Midnight Blue Hydro Flask, Silver MacBook Air M2, Black Leather Wallet"
                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        />
                    </div>

                    {/* Real-Time Duplicate / Similar Match Suggestions Drawer */}
                    {similarMatches.length > 0 && (
                        <div className="p-4 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 animate-in fade-in duration-200">
                            <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 text-xs font-bold mb-2">
                                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span>
                                    Possible {type === 'LOST' ? 'Found' : 'Lost'} Matches Already on Campus!
                                </span>
                            </div>
                            <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mb-3">
                                Review these listings before submitting to see if someone already turned it in:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                {similarMatches.map((m) => (
                                    <a
                                        key={m.id}
                                        href={`/items/${m.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 bg-white dark:bg-slate-900 rounded-xl border border-indigo-100 dark:border-indigo-900/50 hover:shadow-sm text-xs font-medium text-slate-900 dark:text-slate-100 group"
                                    >
                                        {m.imageUrl ? (
                                            <img
                                                src={getImageUrl(m.imageUrl)}
                                                alt=""
                                                className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                                                <Tag className="w-4 h-4" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-bold">{m.title}</div>
                                            <div className="text-[10px] text-slate-400 truncate">{m.location}</div>
                                        </div>
                                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 flex-shrink-0" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Category & Location Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                Category <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                Campus Location <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                placeholder="e.g. Science Library 2nd Floor, Cafeteria Table 4"
                                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Description with Voice Speech-to-Text */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Detailed Description:
                            </label>
                            <button
                                type="button"
                                onClick={toggleSpeechToText}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                                    isListening
                                        ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600'
                                }`}
                            >
                                {isListening ? <MicOff className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5" />}
                                <span>{isListening ? 'Listening... Speak' : 'Voice Dictate'}</span>
                            </button>
                        </div>
                        <textarea
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe identifying marks, color, stickers, engravings, or circumstances..."
                            className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        />
                    </div>

                    {/* Photo Upload with Client-Side Compression */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                            Item Photograph (Auto-Compressed):
                        </label>
                        {previewUrl ? (
                            <div className="relative inline-block">
                                <img
                                    src={previewUrl}
                                    alt="Preview"
                                    className="w-48 h-36 object-cover rounded-2xl border border-slate-200 dark:border-slate-700"
                                />
                                <button
                                    type="button"
                                    onClick={resetFileInput}
                                    className="absolute -top-2 -right-2 p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full shadow-sm"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                {compressionInfo && (
                                    <span className="block text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1.5">
                                        {compressionInfo}
                                    </span>
                                )}
                            </div>
                        ) : (
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                                    isDragging
                                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20'
                                        : 'border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/50'
                                }`}
                            >
                                <Camera className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Click or drag photo here to upload
                                </p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    High-res photos are automatically compressed before upload
                                </p>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    {/* Verification Question & Reward Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                Security Question (For Claimants):
                            </label>
                            <input
                                type="text"
                                value={verificationQuestion}
                                onChange={(e) => setVerificationQuestion(e.target.value)}
                                placeholder="e.g. What sticker is on the laptop lid?"
                                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                Reward Offered (Optional):
                            </label>
                            <input
                                type="text"
                                value={reward}
                                onChange={(e) => setReward(e.target.value)}
                                placeholder="e.g. $25 Coffee Gift Card, 50 Campus Points"
                                className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Custody Desk Intake (For Found Items) */}
                    {type === 'FOUND' && (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span>Campus Custody Intake (Security / Library Desks)</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input
                                    type="text"
                                    value={custodyDesk}
                                    onChange={(e) => setCustodyDesk(e.target.value)}
                                    placeholder="Intake Desk (e.g. Student Union Desk B)"
                                    className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                />
                                <input
                                    type="text"
                                    value={storageBin}
                                    onChange={(e) => setStorageBin(e.target.value)}
                                    placeholder="Storage Shelf / Bin (e.g. Shelf #3, Bin A)"
                                    className="px-3.5 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Publishing Report...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                <span>Publish Campus Listing</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}