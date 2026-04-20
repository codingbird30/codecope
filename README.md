# Codescope — Visual Debugging Agent

An interactive, AI-powered code visualizer and debugger. Upload a ZIP of your project and get:

- **Interactive call graph** — draggable function/method/class nodes with bezier edges
- **AST-level code expansion** — click any node to expand and see the actual code, line by line
- **Inline bug highlighting** — buggy lines are marked in red directly in the node
- **Debug report panel** — issues, fixes, edge cases, and notes in a tabbed sidebar
- **Light/Dark mode** — toggle with the sun/moon button in the top bar
- **Auto-detects language** — JS, TS, Python, Java, Go, Rust, Ruby, PHP, C#, C++, Swift, Kotlin, and more

---

## Local development

### 1. Install dependencies

```bash
npm install
```

### 2. Add your API key

```bash
cp .env.example .env
```

Then edit `.env` and replace the placeholder:

```
VITE_ANTHROPIC_API_KEY=sk-ant-your-real-key-here
```

Get a key at [console.anthropic.com](https://console.anthropic.com).

### 3. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Deploy to Render

This app ships with a built-in Express backend that proxies requests to the Anthropic API. **Your API key stays on the server — it's never exposed to the browser.**

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/codescope.git
git branch -M main
git push -u origin main
```

### Step 2 — Create the service on Render

1. Go to [dashboard.render.com](https://dashboard.render.com) and sign in
2. Click **New** → **Web Service**
3. Connect your GitHub account and pick the `codescope` repo
4. Render will auto-detect settings from `render.yaml`, but confirm:
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Free (or paid for always-on)

### Step 3 — Set the API key

Under **Environment Variables**, add:

- Key: `ANTHROPIC_API_KEY` (note: **NOT** `VITE_ANTHROPIC_API_KEY` in production)
- Value: `sk-ant-...`

Then click **Create Web Service**.

### Step 4 — Wait for deploy

First deploy takes 2–4 minutes. You'll get a URL like `https://codescope.onrender.com`.

> **Free tier note:** The service spins down after 15 minutes of inactivity. First request after idle takes ~30 seconds to wake up. Upgrade to Starter ($7/mo) for always-on.

---

## How the backend proxy works

- In **dev** (`npm run dev`): reads `VITE_ANTHROPIC_API_KEY` from `.env`, calls Anthropic directly from the browser
- In **production** (deployed): posts to `/api/analyze` on your own server, which forwards to Anthropic using server-side `ANTHROPIC_API_KEY`

Benefits:
- ✅ Key is never in the browser bundle
- ✅ Users of your deployed app can't steal it
- ✅ You can add rate limiting, auth, or usage tracking later in `server.js`

---

## Usage

1. Drop a `.zip` of your project onto the upload zone
2. Optionally set a **Usage context** and **Focus area**
3. Click **Analyze** — Claude reads your code and returns a structured graph
4. Explore:
   - **Click** any node to expand/collapse
   - **Drag** any node by its header to reposition
   - **Scroll** to zoom, **drag empty space** to pan
   - **Click an issue** in the right panel to zoom to that node

---

## Project limits

- Max **50 source files** (skips `node_modules`, `.git`, `dist`, `build`, etc.)
- Max **200KB per file**, max **~400KB total payload** to Claude
- **2-minute timeout** on API requests

---

## Stack

- **React 18** + **Vite 5** (frontend)
- **Express 4** (backend proxy, production only)
- **JSZip** for client-side zip extraction
- **Anthropic Claude API** (`claude-sonnet-4-6`)
- Native pointer events for drag — no heavy dependencies

---

## Scripts

```bash
npm run dev       # Vite dev server (localhost:5173)
npm run build     # Build frontend to dist/
npm run preview   # Preview the built frontend locally
npm start         # Start production server (serves dist/ + /api/analyze proxy)
```
