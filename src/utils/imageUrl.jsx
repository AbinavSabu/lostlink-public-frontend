import { useState, useEffect, useRef } from 'react';

export const DEFAULT_PLACEHOLDER_IMAGE =
    "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80";

/**
 * Resolves relative or absolute image paths to complete backend origin URLs or placeholders.
 * Dynamically resolves against window.location.hostname to support localhost,
 * LAN IP (e.g. 192.168.x.x), or configured VITE_API_BASE_URL.
 * If path is missing, returns DEFAULT_PLACEHOLDER_IMAGE.
 */
export const getImageUrl = (path, fallback = DEFAULT_PLACEHOLDER_IMAGE) => {
    if (!path || typeof path !== 'string' || !path.trim()) {
        return fallback;
    }
    const trimmed = path.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    // Normalize Windows backslashes to forward slashes
    const cleanPath = trimmed.replace(/\\/g, '/');
    const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    const rawBase = import.meta.env.VITE_API_BASE_URL ||
        (import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '') : `http://${host}:8081`);
    const apiBase = rawBase.replace(/\/+$/, '').replace(/\/api\/?$/, '');
    return `${apiBase}${cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath}`;
};

/**
 * Global onError handler for <img> elements.
 * Automatically retries loading the image after a short delay (1.8s) with a cache-busting
 * timestamp query param (_t=...).
 * If the image still fails after retries, it switches src to DEFAULT_PLACEHOLDER_IMAGE,
 * or hides the image and displays any sibling fallback element.
 */
export const handleImageError = (e, options = {}) => {
    const img = e.currentTarget;
    if (!img) return;

    // If already set to default placeholder and that fails, hide element
    if (img.src === DEFAULT_PLACEHOLDER_IMAGE || img.dataset.failedPlaceholder === 'true') {
        img.style.display = 'none';
        if (img.nextElementSibling) {
            img.nextElementSibling.classList.remove('hidden');
        }
        if (typeof options.onFallback === 'function') {
            options.onFallback();
        }
        return;
    }

    const maxRetries = options.maxRetries || 1;
    const delayMs = options.delayMs || 1500;
    const currentRetry = parseInt(img.dataset.retryCount || '0', 10);

    if (currentRetry < maxRetries) {
        img.dataset.retryCount = (currentRetry + 1).toString();
        const baseSrc = img.dataset.originalSrc || img.src;
        img.dataset.originalSrc = baseSrc;

        setTimeout(() => {
            const separator = baseSrc.includes('?') ? '&' : '?';
            img.src = `${baseSrc}${separator}_t=${Date.now()}`;
        }, delayMs);
        return;
    }

    // Exhausted retries: switch to placeholder or reveal sibling fallback container
    img.dataset.failedPlaceholder = 'true';
    if (options.usePlaceholder !== false) {
        img.src = DEFAULT_PLACEHOLDER_IMAGE;
    } else {
        img.style.display = 'none';
        if (img.nextElementSibling) {
            img.nextElementSibling.classList.remove('hidden');
        }
    }

    if (typeof options.onFallback === 'function') {
        options.onFallback();
    }
};

/**
 * Resilient React image component with built-in retry and fallback logic.
 */
export function SafeImage({ src, alt = '', className = '', fallback = null, onClick = null, ...props }) {
    const [failed, setFailed] = useState(false);
    const [retrySrc, setRetrySrc] = useState(src);
    const retryRef = useRef(0);

    useEffect(() => {
        setRetrySrc(src);
        setFailed(false);
        retryRef.current = 0;
    }, [src]);

    const onError = () => {
        if (retryRef.current < 2) {
            retryRef.current += 1;
            setTimeout(() => {
                const separator = (src || '').includes('?') ? '&' : '?';
                setRetrySrc(`${src}${separator}_t=${Date.now()}`);
            }, 1800);
        } else {
            setFailed(true);
        }
    };

    if (!src || failed) {
        return fallback || (
            <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-400 p-4 rounded-xl">
                <span className="text-xs font-medium">Image Unavailable</span>
            </div>
        );
    }

    return (
        <img
            src={retrySrc}
            alt={alt}
            className={className}
            onError={onError}
            onClick={onClick}
            {...props}
        />
    );
}

export default getImageUrl;