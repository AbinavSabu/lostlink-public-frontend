# LostLink — Public Hosting & Deployment Guide

> **Important Safety Notice**: The original local/demo project (`project/`) remains completely untouched as the stable local baseline with its embedded H2 database, local filesystem uploads, and demo configuration intact. All public-hosting modifications exist exclusively in this repository (`lostlink-public`).

---

## 1. Cloud Architecture Overview

The public-hosting deployment separates concerns between managed serverless cloud services and enterprise infrastructure:

```
┌─────────────────────────────────┐
│     React 19 + Vite 8 SPA       │  Hosted on Vercel
│     (lostlink-public-frontend)  │  (HTTPS, CDN-cached, Global Edge)
└────────────────┬────────────────┘
                 │ HTTPS (REST API) & WSS (SockJS / STOMP WebSockets)
                 ▼
┌─────────────────────────────────┐
│     Spring Boot 3.3.5 Backend   │  Hosted on Render (Docker / Web Service)
│     (lostlink-public)           │  (Dynamic PORT, Java 17+, Stateless)
└───────┬─────────────────┬───────┘
        │                 │
        │ JDBC (SSL)      │ HTTPS (Cloudinary Java SDK)
        ▼                 ▼
┌──────────────────┐ ┌──────────────────────────────────────┐
│ Supabase         │ │ Cloudinary Media Store               │
│ PostgreSQL       │ │ (Persistent Cloud Storage for        │
│ Database         │ │  Item Photos & Chat Attachments)     │
└──────────────────┘ └──────────────────────────────────────┘
```

---

## 2. Environment Variables Reference

### Backend (Render Web Service)

| Variable | Required in Prod | Example / Description |
| :--- | :---: | :--- |
| `PORT` | Auto (Render) | `8081` (Injected automatically by Render) |
| `SPRING_PROFILES_ACTIVE` | Yes | `prod` (Enables PostgreSQL dialect & Cloudinary storage) |
| `SPRING_DATASOURCE_URL` | Yes | `jdbc:postgresql://db.xxxx.supabase.co:5432/postgres?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | Yes | `postgres` |
| `SPRING_DATASOURCE_PASSWORD` | Yes | Your strong Supabase database password |
| `JWT_SECRET` | Yes | A 32+ character random string (e.g. `zK9#vL2$pQ8@xW1!mN4*tR7^yU5&sA0~`) |
| `FRONTEND_URL` | Yes | `https://your-app.vercel.app` (Your public Vercel frontend URL for CORS) |
| `STORAGE_PROVIDER` | Yes | `cloudinary` (Switches upload handler from local disk to Cloudinary) |
| `CLOUDINARY_CLOUD_NAME` | Yes | Your Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | Yes | Your Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | Yes | Your Cloudinary API Secret |
| `SPRING_H2_CONSOLE_ENABLED`| No | `false` (Defaults to false; keep disabled in production) |

### Frontend (Vercel Project)

| Variable | Required in Prod | Example / Description |
| :--- | :---: | :--- |
| `VITE_API_BASE_URL` | Yes | `https://your-backend.onrender.com` (Render Web Service HTTPS URL) |
| `VITE_WS_URL` | Optional | `https://your-backend.onrender.com/ws` (Auto-derived from `VITE_API_BASE_URL` if omitted) |

---

## 3. Step-by-Step Cloud Setup

### A. Supabase (PostgreSQL Database)
1. Sign up / Log in to [Supabase](https://supabase.com).
2. Create a **New Project** (choose a region close to your Render deployment, e.g. US East or US West).
3. Set a strong database password (store it securely).
4. In **Project Settings** > **Database** > **Connection string**:
   - Select **URI** or **JDBC**.
   - Note down:
     - Host: `db.<project-ref>.supabase.co`
     - Port: `5432`
     - Database name: `postgres`
     - User: `postgres`
     - JDBC URL: `jdbc:postgresql://db.<project-ref>.supabase.co:5432/postgres?sslmode=require`
5. **Data Seeding**:
   - Option 1 (Automatic): Spring Boot's `DataInitializer` will automatically detect when the database has 0 items and seed the complete 12 curated demo items and 5 accounts on first boot!
   - Option 2 (Manual SQL): Open Supabase **SQL Editor**, open `postgres-seed.sql` from this repository, and click **Run**.

### B. Cloudinary (Persistent Image Storage)
1. Sign up / Log in to [Cloudinary](https://cloudinary.com).
2. From the **Cloudinary Dashboard**, copy:
   - `Cloud Name`
   - `API Key`
   - `API Secret`
3. **Demo Image Catalog Migration**:
   - To upload the 12 curated demo item photos to your Cloudinary account:
     ```bash
     export CLOUDINARY_CLOUD_NAME="your-cloud-name"
     export CLOUDINARY_API_KEY="your-api-key"
     export CLOUDINARY_API_SECRET="your-api-secret"
     node scripts/upload-demo-images-to-cloudinary.js
     ```
   - The script will upload each image to `lostlink/catalog` and generate `update-cloudinary-image-urls.sql` containing the exact `UPDATE items SET image_url = '...'` SQL commands to execute in Supabase.

### C. Render (Spring Boot Backend)
1. Sign up / Log in to [Render](https://render.com).
2. Click **New +** > **Web Service**.
3. Connect your Git repository (`lostlink-public`).
4. Settings:
   - **Environment**: `Docker`
   - **Branch**: `main`
   - **Dockerfile Path**: `./Dockerfile` (or `./lostfound/Dockerfile` if deploying from backend subfolder)
   - **Plan**: `Free`
5. Under **Environment Variables**, add the backend environment variables listed in Section 2.
6. Click **Deploy Web Service**.
7. Once deployed, copy your public Render URL (e.g. `https://lostlink-backend.onrender.com`).

### D. Vercel (React Frontend)
1. Sign up / Log in to [Vercel](https://vercel.com).
2. Click **Add New...** > **Project**.
3. Import your frontend repository (`lostlink-public-frontend` or `lostlink-public` with Root Directory set to `lostfound-frontend`).
4. Framework Preset: **Vite**.
5. Build and Output Settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Under **Environment Variables**:
   - `VITE_API_BASE_URL`: `https://lostlink-backend.onrender.com`
7. Click **Deploy**.
8. Once deployed, copy your Vercel URL (e.g. `https://lostlink.vercel.app`), go back to your Render Dashboard, and update `FRONTEND_URL` to match this URL.

---

## 4. How to Run the Public Codebase Locally Before Deployment

You can test the public version locally in two modes:

### Mode 1: Local Fallback (Zero-Config Embedded H2 + Local Uploads)
Even in the public version, embedded H2 and local file storage remain fully supported for local offline testing:
```bash
# Terminal 1 - Backend
cd lostfound
.\mvnw.cmd spring-boot:run

# Terminal 2 - Frontend
cd lostfound-frontend
npm install
npm run dev
```

### Mode 2: Cloud Emulation (Using Real Supabase & Cloudinary)
To verify your cloud connections before pushing:
```bash
# Terminal 1 - Backend with Cloud Configuration
cd lostfound
$env:SPRING_PROFILES_ACTIVE="prod"
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://db.xxxx.supabase.co:5432/postgres?sslmode=require"
$env:SPRING_DATASOURCE_USERNAME="postgres"
$env:SPRING_DATASOURCE_PASSWORD="your-supabase-password"
$env:JWT_SECRET="your-test-secret-at-least-32-chars-long!"
$env:STORAGE_PROVIDER="cloudinary"
$env:CLOUDINARY_CLOUD_NAME="your-cloud-name"
$env:CLOUDINARY_API_KEY="your-api-key"
$env:CLOUDINARY_API_SECRET="your-api-secret"
$env:FRONTEND_URL="http://localhost:5173"
.\mvnw.cmd spring-boot:run

# Terminal 2 - Frontend
cd lostfound-frontend
$env:VITE_API_BASE_URL="http://localhost:8081"
npm run dev
```

---

## 5. Security & Verification Checklist

- [x] **No Secrets Committed**: `.env`, database passwords, Cloudinary secrets, and JWT production keys are completely excluded from Git via `.gitignore`.
- [x] **H2 Console Disabled in Prod**: `spring.h2.console.enabled=false` in production profile.
- [x] **Strict CORS**: Dynamic origin validation binds to `FRONTEND_URL` while preserving local development patterns.
- [x] **WebSocket Security**: SockJS STOMP endpoints inherit dynamic origin checks from `FRONTEND_URL`.
- [x] **Clean Local Isolation**: Original local version (`project/`) remains 100% untouched.
