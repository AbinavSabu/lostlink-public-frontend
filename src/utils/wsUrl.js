/**
 * Resolves the WebSocket STOMP endpoint URL.
 * Automatically aligns with VITE_WS_URL, VITE_API_BASE_URL, or VITE_API_URL.
 */
export const getWebSocketUrl = () => {
    // 1. Explicit WebSocket URL override
    if (import.meta.env.VITE_WS_URL) {
        return import.meta.env.VITE_WS_URL;
    }

    // 2. Derive from VITE_API_BASE_URL (standard for public hosting)
    if (import.meta.env.VITE_API_BASE_URL) {
        const base = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '').replace(/\/api\/?$/, '');
        return `${base}/ws`;
    }

    // 3. Derive from VITE_API_URL
    if (import.meta.env.VITE_API_URL) {
        const base = import.meta.env.VITE_API_URL.replace(/\/+$/, '').replace(/\/api\/?$/, '');
        return `${base}/ws`;
    }

    // 4. Default to current browser hostname on port 8081
    const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
    return `http://${host}:8081/ws`;
};

export default getWebSocketUrl;
