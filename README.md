# Codescope — Visual Debugging Agent

An interactive, AI-powered code visualizer and debugger. Upload a ZIP of your project and get:

- **Interactive call graph** — draggable function/method/class nodes with bezier edges
- **AST-level code expansion** — click any node to expand and see the actual code, line by line
- **Inline bug highlighting** — buggy lines are marked in red directly in the node
- **Debug report panel** — issues, fixes, edge cases, and notes in a tabbed sidebar
- **Light/Dark mode** — toggle with the sun/moon button in the top bar
- **Auto-detects language** — JS, TS, Python, Java, Go, Rust, Ruby, PHP, C#, C++, Swift, Kotlin, and more

---

## Setup

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

## Usage

1. Drop a `.zip` of your project onto the upload zone
2. Optionally set a **Usage context** (e.g. "Production API") and **Focus area** (e.g. "auth security")
3. Click **Analyze** — Claude reads your code and returns a structured graph
4. Explore the graph:
   - **Click** any node to expand/collapse it and see the code
   - **Drag** any node by its header to reposition it
   - **Scroll** to zoom in/out
   - **Drag empty space** to pan
   - **Click an issue** in the right panel to zoom to that node

---

## Project limits

- Max **50 source files** (skips `node_modules`, `.git`, `dist`, `build`, etc.)
- Max **200KB per file**
- Max **~400KB total payload** to Claude
- **2-minute timeout** on API requests

For larger projects, focus the zip on a specific module or feature.

---

## Stack

- **React 18** + **Vite 5**
- **JSZip** for client-side zip extraction
- **Anthropic Claude API** (`claude-sonnet-4-6`) for analysis
- Native pointer events for drag — no heavy dependencies

---

## Build for production

```bash
npm run build
```

Output goes to `dist/`. Serve with any static host.

> ⚠️ The API key will be embedded in the build bundle. For production use, proxy the API call through your own backend so the key is never exposed client-side.
