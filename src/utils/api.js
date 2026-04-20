import { MAX_PAYLOAD_SIZE } from './helpers';

const SYSTEM_PROMPT = `You are a senior software engineer and code visualization expert. You will be given the source code of a project. Analyze it thoroughly and return ONLY a valid JSON object — no markdown, no backticks, no text outside the JSON.

Your job: extract every FUNCTION, METHOD, and CLASS across all files, identify call relationships, and identify bugs/issues.

Return this exact schema:

{
  "summary": "1-2 sentence description of what the project does",
  "language": "primary language detected",
  "entry_point": "id of the node that is the main entry point",
  "nodes": [
    {
      "id": "unique_id_eg_filename_functionname",
      "type": "function|method|class|file",
      "name": "display name eg getUserById",
      "file": "path/to/file.js",
      "signature": "full signature eg function getUserById(id)",
      "start_line": 12,
      "end_line": 18,
      "code_lines": [
        { "n": 12, "text": "function getUserById(id) {", "bug": null },
        { "n": 13, "text": "  return db.query('SELECT * FROM users WHERE id = ' + id);", "bug": "SQL injection via string concat" },
        { "n": 14, "text": "}", "bug": null }
      ],
      "calls": ["ids of other nodes this node calls"],
      "has_bug": true,
      "summary": "1-line description of what this function does"
    }
  ],
  "edges": [
    { "from": "node_id", "to": "node_id", "label": "optional eg calls" }
  ],
  "issues": [
    {
      "title": "short name of the issue",
      "severity": "high|medium|low",
      "node_id": "id of the node where it lives (or null)",
      "file": "path/to/file",
      "line": 13,
      "reason": "why it is a problem and what the impact is"
    }
  ],
  "fixes": [
    {
      "title": "fix name",
      "for_issue": "title of the issue this addresses",
      "explanation": "what changed and why",
      "code": "corrected snippet"
    }
  ],
  "edge_cases": [
    { "case": "scenario", "behavior": "what happens", "node_id": "optional id" }
  ],
  "notes": ["engineering note 1", "engineering note 2"]
}

Rules:
- Extract a node for every function/method/class you see across all files. Methods of a class should have type "method" and their file should be the class's file.
- Include the ACTUAL lines of code in code_lines — preserve indentation, don't paraphrase. If a function is longer than 30 lines, include the first 25 lines and add a final entry { "n": last_line, "text": "// ... (truncated)", "bug": null }.
- For every line that has a bug or code smell, set its "bug" to a SHORT description (under 40 chars). Otherwise bug is null.
- Mark has_bug: true on the node if any of its lines have bugs.
- calls[] should reference node IDs of functions this one calls. Only include calls to functions that are also in your nodes[] list.
- edges[] should mirror the calls relationship (one edge per call).
- Pick ONE entry_point — the main/top-level function or the file's default export. If unclear, pick the most "called-by-nothing" function.
- Keep node count reasonable (target <40 nodes). Don't create nodes for tiny one-liner arrow functions unless they're significant.
- severity must be high, medium, or low — lowercase.
- Be precise. Never invent code that isn't there.`;

// In production (deployed build) call the backend proxy at /api/analyze.
// In dev (VITE_ANTHROPIC_API_KEY is set) call Anthropic directly from the browser.
const USE_BACKEND = !import.meta.env.VITE_ANTHROPIC_API_KEY;

export async function analyzeCode({ files, context, focus, apiKey, onProgress }) {
  const filesBlock = Object.entries(files)
    .map(([path, content]) => `\n=== FILE: ${path} ===\n${content}`)
    .join('\n');

  const payloadSize = filesBlock.length;
  console.log('[codescope] Payload size:', payloadSize, 'chars');
  console.log('[codescope] Mode:', USE_BACKEND ? 'backend proxy' : 'direct browser call');

  if (payloadSize > MAX_PAYLOAD_SIZE) {
    throw new Error(
      `Payload too large: ${(payloadSize / 1024).toFixed(0)}KB. Max is ${MAX_PAYLOAD_SIZE / 1024}KB. Try uploading fewer files.`
    );
  }

  if (!USE_BACKEND && !apiKey) {
    throw new Error(
      'API key is missing. Create a .env file in the project root with VITE_ANTHROPIC_API_KEY=sk-ant-...'
    );
  }

  const userMsg = `${context ? 'Usage context: ' + context + '\n' : ''}${focus ? 'Focus area: ' + focus + '\n' : ''}
Source files:
${filesBlock}`;

  const requestBody = {
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMsg }]
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('timeout'), 120000);

  try {
    onProgress?.('s1', 'done');
    onProgress?.('s2', 'active');
    onProgress?.('progress', 40);

    const url = USE_BACKEND
      ? '/api/analyze'
      : 'https://api.anthropic.com/v1/messages';

    const headers = USE_BACKEND
      ? { 'Content-Type': 'application/json' }
      : {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        };

    console.log('[codescope] Sending request to', url);
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log('[codescope] Response received. Status:', res.status);

    onProgress?.('s2', 'done');
    onProgress?.('s3', 'active');
    onProgress?.('progress', 75);

    if (!res.ok) {
      let errMsg = `HTTP ${res.status} ${res.statusText || ''}`.trim();
      const contentType = res.headers.get('content-type') || '';
      try {
        if (contentType.includes('application/json')) {
          const e = await res.json();
          errMsg = e.error?.message || e.message || JSON.stringify(e).slice(0, 300) || errMsg;
          console.error('[codescope] API error (JSON):', e);
        } else {
          const txt = await res.text();
          console.error('[codescope] API error (text):', txt.slice(0, 500));
          if (txt && txt.length < 200) errMsg = `${errMsg}: ${txt}`;
          else if (res.status === 502 || res.status === 503) {
            errMsg = `Server sleeping or unreachable (${res.status}). On Render free tier, first request can take 30+ seconds. Wait a moment and retry.`;
          } else if (res.status === 404) {
            errMsg = `Backend endpoint not found (404). The server may not have started correctly. Check Render logs.`;
          } else {
            errMsg = `${errMsg}. Server returned non-JSON response. Check Render logs.`;
          }
        }
      } catch (parseErr) {
        console.error('[codescope] Failed to parse error response:', parseErr);
        errMsg = `${errMsg} — could not parse server response. Check browser console and Render logs.`;
      }
      throw new Error(errMsg);
    }

    const data = await res.json();
    console.log('[codescope] Stop reason:', data.stop_reason);

    if (data.stop_reason === 'max_tokens') {
      console.warn('[codescope] Response hit max_tokens — JSON may be truncated');
    }

    const raw = (data.content || []).map(b => b.text || '').join('');
    if (!raw) throw new Error('Empty response from Claude. Check your API credits.');

    const clean = raw.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      const match = clean.match(/\{[\s\S]*\}/);
      if (!match) {
        console.error('[codescope] Raw response:', raw.slice(0, 500));
        throw new Error('Claude returned malformed JSON. Response may have been truncated. Try fewer files.');
      }
      try {
        parsed = JSON.parse(match[0]);
      } catch (err2) {
        console.error('[codescope] JSON parse failed:', err2);
        throw new Error('Response JSON was incomplete — likely truncated at max_tokens. Try fewer files.');
      }
    }

    if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
      throw new Error('Response missing "nodes" array. Claude may have misunderstood the schema.');
    }

    onProgress?.('s3', 'done');
    onProgress?.('progress', 92);

    return parsed;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError' || e.message === 'timeout') {
      throw new Error('Request timed out after 2 minutes. Try again or reduce files.');
    }
    throw e;
  }
}
