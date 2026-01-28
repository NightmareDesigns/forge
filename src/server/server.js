const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const BING_API_KEY = process.env.BING_API_KEY || '';
const PORT = process.env.AI_SERVER_PORT || 4000;

function escapeHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

app.get('/', (req, res) => {
  res.json({ ok: true, msg: 'CraftForge AI server running', env: { openai: !!OPENAI_API_KEY, bing: !!BING_API_KEY } });
});

// Generate a design (SVG) from a prompt. If OPENAI_API_KEY is set, the server will use OpenAI Chat Completions.
app.post('/generate', async (req, res) => {
  const { prompt, format = 'svg' } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  if (OPENAI_API_KEY) {
    try {
      const system = `You are a helpful assistant that generates compact ${format} markup only. Do NOT include any surrounding explanation.`;
      const user = `Generate a ${format} design for the following description. Return only the raw ${format} content (no markdown):\n\n${prompt}`;

      const body = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ],
        max_tokens: 1500
      };

      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!r.ok) {
        const txt = await r.text();
        return res.status(502).json({ error: 'OpenAI error', detail: txt });
      }

      const j = await r.json();
      const output = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || j.choices?.[0]?.text || '';
      return res.json({ ok: true, svg: output });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Fallback: return a simple placeholder SVG
  const safe = escapeHtml(prompt).slice(0, 140);
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="100%" height="100%" fill="#111"/><text x="50%" y="50%" fill="#fff" font-family="Arial,Helvetica,sans-serif" font-size="20" text-anchor="middle" dominant-baseline="middle">${safe}</text></svg>`;
  res.json({ ok: true, svg });
});

// Web search: requires BING_API_KEY (Azure/Bing Web Search). Returns top results.
app.post('/search', async (req, res) => {
  const { q } = req.body || {};
  if (!q) return res.status(400).json({ error: 'q required' });

  if (!BING_API_KEY) return res.status(400).json({ error: 'No search provider configured. Set BING_API_KEY.' });

  try {
    const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(q)}&count=5`;
    const r = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': BING_API_KEY } });
    if (!r.ok) return res.status(502).json({ error: 'Search provider error', status: r.status });
    const j = await r.json();
    const results = (j.webPages && j.webPages.value) ? j.webPages.value.map(v => ({ name: v.name, url: v.url, snippet: v.snippet })) : [];
    return res.json({ ok: true, results });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`CraftForge AI server listening on ${PORT}`);
});
