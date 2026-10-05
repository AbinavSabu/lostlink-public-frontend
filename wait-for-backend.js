// lostfound-frontend/wait-for-backend.js
import http from 'node:http';

const targetUrl = process.env.VITE_API_URL || 'http://localhost:8081/api/items';
const maxWaitSeconds = 45;
let elapsed = 0;

console.log('[SYNC] Waiting for Spring Boot backend to initialize on port 8081...');

function poll() {
    elapsed++;
    const req = http.get(targetUrl, (res) => {
        // Any HTTP response (200, 401, 403, 302, etc.) proves Tomcat is active and listening
        console.log(`[SYNC] Spring Boot backend is healthy and responding (HTTP ${res.statusCode}). Launching frontend...`);
        process.exit(0);
    });

    req.on('error', () => {
        if (elapsed >= maxWaitSeconds) {
            console.log(`[SYNC] Backend wait timeout reached (${maxWaitSeconds}s). Launching frontend anyway...`);
            process.exit(0);
        }
        setTimeout(poll, 1000);
    });

    req.setTimeout(2500, () => {
        req.destroy();
    });
}

poll();
