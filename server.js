import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.ANTHROPIC_API_KEY;

console.log('[codescope] Starting server...');
console.log('[codescope] Port:', PORT);
console.log('[codescope] API key present:', !!API_KEY);
if (API_KEY) {
  console.log('[codescope] API key prefix:', API_KEY.slice(0, 10) + '...');
  if (!API_KEY.startsWith('sk-ant-')) {
    console.warn('[codescope] WARNING: API key does not start with "sk-ant-" — may be invalid');
  }
} else {
  console.error('[codescope] FATAL: ANTHROPIC_API_KEY environment variable is not set!');
  console.error('[codescope] Set it in Render Dashboard → your service → Environment');
}

app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  console.log(`[codescope] ${req.method} ${req.path}`);
  next();
});

// ── API proxy ─────────────────────────────────────────────────
app.post('/api/analyze', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');

  if (!API_KEY) {
    console.error('[codescope] /api/analyze called but no API key configured');
    return res.status(500).json({
      error: {
        message: 'Server misconfigured: ANTHROPIC_API_KEY is not set on Render. Go to your Render dashboard → Environment and add it.'
      }
    });
  }

  try {
    console.log('[codescope] Forwarding to Anthropic API...');
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const contentType = anthropicRes.headers.get('content-type') || '';
    console.log('[codescope] Anthropic responded:', anthropicRes.status, contentType);

    if (contentType.includes('application/json')) {
      const data = await anthropicRes.json();
      if (!anthropicRes.ok) {
        console.error('[codescope] Anthropic error:', JSON.stringify(data).slice(0, 500));
      }
      return res.status(anthropicRes.status).json(data);
    } else {
      const text = await anthropicRes.text();
      console.error('[codescope] Anthropic non-JSON response:', text.slice(0, 500));
      return res.status(anthropicRes.status).json({
        error: {
          message: `Anthropic returned non-JSON (status ${anthropicRes.status}): ${text.slice(0, 200)}`
        }
      });
    }
  } catch (err) {
    console.error('[codescope] Proxy error:', err);
    return res.status(500).json({
      error: {
        message: 'Proxy request failed: ' + (err.message || String(err))
      }
    });
  }
});

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    ok: true,
    apiKeyConfigured: !!API_KEY,
    node: process.version
  });
});

// ── Serve built frontend ──────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// JSON error handler (never let /api return HTML)
app.use((err, req, res, next) => {
  console.error('[codescope] Unhandled error:', err);
  if (req.path.startsWith('/api')) {
    return res.status(500).json({
      error: { message: err.message || 'Internal server error' }
    });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`[codescope] ✓ Server listening on port ${PORT}`);
});
