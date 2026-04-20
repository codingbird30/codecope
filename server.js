import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.warn('[codescope] WARNING: ANTHROPIC_API_KEY not set — /api/analyze will fail');
}

app.use(express.json({ limit: '1mb' }));

// ── API proxy ─────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({
      error: { message: 'Server misconfigured: ANTHROPIC_API_KEY missing.' }
    });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await anthropicRes.json();
    res.status(anthropicRes.status).json(data);
  } catch (err) {
    console.error('[codescope] proxy error:', err);
    res.status(500).json({ error: { message: 'Proxy request failed: ' + err.message } });
  }
});

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => res.json({ ok: true }));

// ── Serve built frontend ──────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — any non-/api path serves index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[codescope] server running on port ${PORT}`);
});
