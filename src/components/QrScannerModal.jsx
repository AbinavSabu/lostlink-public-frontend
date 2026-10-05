import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Camera,
    X,
    QrCode,
    AlertCircle,
    CheckCircle2,
    Upload,
    ArrowRight,
    Loader2,
    RefreshCw
} from 'lucide-react';

export default function QrScannerModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [hasCamera, setHasCamera] = useState(true);
    const [cameraError, setCameraError] = useState('');
    const [scanning, setScanning] = useState(false);
    const [manualId, setManualId] = useState('');
    const [scanSuccess, setScanSuccess] = useState('');

    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const animFrameRef = useRef(null);
    const navigate = useNavigate();

    // Listen to global open event
    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-qr-scanner', handleOpen);
        return () => window.removeEventListener('open-qr-scanner', handleOpen);
    }, []);

    const stopCamera = () => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        setScanning(false);
    };

    const handleClose = () => {
        stopCamera();
        setIsOpen(false);
        setCameraError('');
        setScanSuccess('');
        setManualId('');
    };

    const handleDetectedCode = (rawValue) => {
        if (!rawValue) return;
        stopCamera();

        // Extract ID from URL like http://.../items/12 or raw string '12' or 'ITEM-12'
        const match = rawValue.match(/items\/(\d+)/i) || rawValue.match(/(\d+)/);
        const extractedId = match ? match[1] : null;

        if (extractedId) {
            setScanSuccess(`Found Item #${extractedId}! Redirecting...`);
            setTimeout(() => {
                handleClose();
                navigate(`/items/${extractedId}`);
            }, 800);
        } else {
            setCameraError(`Scanned code "${rawValue}" did not match an item format.`);
        }
    };

    // Initialize Camera and BarcodeDetector
    useEffect(() => {
        if (!isOpen) {
            stopCamera();
            return;
        }

        let isSubscribed = true;
        setCameraError('');
        setScanSuccess('');

        async function startCamera() {
            try {
                // Check for secure context and mediaDevices support
                if (typeof window !== 'undefined' && window.isSecureContext === false && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                    setHasCamera(false);
                    setCameraError('Camera access requires HTTPS or localhost. You can enter the item ID manually below.');
                    return;
                }

                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    setHasCamera(false);
                    setCameraError('Camera access is not supported by this browser. Enter the item ID manually below.');
                    return;
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
                });

                if (!isSubscribed) {
                    stream.getTracks().forEach((t) => t.stop());
                    return;
                }

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    try {
                        await videoRef.current.play();
                    } catch (playErr) {
                        console.warn('Video play blocked or interrupted:', playErr);
                    }
                }

                setScanning(true);

                // Use BarcodeDetector if available
                if ('BarcodeDetector' in window) {
                    try {
                        const detector = new window.BarcodeDetector({
                            formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'upc_a']
                        });

                        const scanLoop = async () => {
                            if (!videoRef.current || videoRef.current.readyState < 2) {
                                animFrameRef.current = requestAnimationFrame(scanLoop);
                                return;
                            }

                            try {
                                const barcodes = await detector.detect(videoRef.current);
                                if (barcodes.length > 0 && barcodes[0].rawValue) {
                                    handleDetectedCode(barcodes[0].rawValue);
                                    return;
                                }
                            } catch {
                                // Non-fatal frame detection error
                            }

                            animFrameRef.current = requestAnimationFrame(scanLoop);
                        };

                        animFrameRef.current = requestAnimationFrame(scanLoop);
                    } catch (detErr) {
                        console.warn('BarcodeDetector initialization error:', detErr);
                    }
                }
            } catch (err) {
                console.warn('Camera stream error:', err);
                setHasCamera(false);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setCameraError('Camera permission was denied. Please allow camera access in browser settings or enter the Item ID manually.');
                } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                    setCameraError('No camera found on this device. Enter the Item ID manually below.');
                } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                    setCameraError('Camera is currently in use by another application. Enter the Item ID manually below.');
                } else {
                    setCameraError('Camera unavailable. You can enter the Item ID manually below.');
                }
            }
        }

        void startCamera();

        return () => {
            isSubscribed = false;
            stopCamera();
        };
    }, [isOpen]);

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (manualId.trim()) {
            handleDetectedCode(manualId.trim());
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div
                className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                            <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base">Scan Tag or Flyer</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Point camera at QR code on custody tags
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Viewfinder Container */}
                <div className="p-6">
                    {scanSuccess ? (
                        <div className="p-8 text-center bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-3 animate-bounce" />
                            <div className="font-bold text-emerald-900 dark:text-emerald-200">
                                {scanSuccess}
                            </div>
                        </div>
                    ) : hasCamera && !cameraError ? (
                        <div className="relative aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden bg-black border-2 border-indigo-500 shadow-inner">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover"
                                autoPlay
                                playsInline
                                muted
                            />
                            {/* Animated scanner overlay */}
                            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                                <div className="w-full h-full border-2 border-dashed border-white/60 rounded-xl relative">
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent animate-pulse" />
                                </div>
                            </div>
                            <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/80 font-medium tracking-wide">
                                Align tag inside border
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 text-center bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200">
                            <Camera className="w-10 h-10 mx-auto mb-2 text-amber-600 dark:text-amber-400" />
                            <p className="text-xs font-semibold">{cameraError || 'Camera unavailable'}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                You can enter the reference ID below manually.
                            </p>
                        </div>
                    )}

                    {/* Manual Reference ID Fallback */}
                    <form onSubmit={handleManualSubmit} className="mt-5">
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                            Or enter Item ID manually:
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={manualId}
                                onChange={(e) => setManualId(e.target.value)}
                                placeholder="e.g. 42 or ITEM-42"
                                className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                            >
                                <span>Go</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
