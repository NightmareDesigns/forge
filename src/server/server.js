const express = require('express');
const fetch = require('node-fetch');
const fetchFn = fetch.default || fetch;
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Ollama local AI configuration
const OLLAMA_HOST = 'http://localhost:11434';
const MODEL = 'mistral'; // Lightweight, fast model. Other options: 'neural-chat', 'orca-mini', 'llama2'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const BING_API_KEY = process.env.BING_API_KEY || '';
const PORT = process.env.AI_SERVER_PORT || 4000;

// If an Ollama runtime is bundled with the app (packaged into `bin/`), try to start it.
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

try {
  const bundledDir = path.join(__dirname, '..', 'bin');
  const bundledExe = process.platform === 'win32' ? path.join(bundledDir, 'ollama.exe') : path.join(bundledDir, 'ollama');
  if (fs.existsSync(bundledExe)) {
    console.log('Found bundled Ollama at', bundledExe, '- attempting to start');
    try {
      const p = spawn(bundledExe, ['serve'], { detached: true, stdio: 'ignore' });
      p.unref();
      console.log('Started bundled Ollama (detached process)');
    } catch (err) {
      console.warn('Failed to start bundled Ollama:', err.message);
    }
  }
} catch (e) {
  // non-fatal
}
function escapeHtml(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function decodeHtmlEntities(str) {
  return (str || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractDuckDuckGoUrl(href) {
  try {
    const u = new URL(href);
    if (u.hostname.includes('duckduckgo.com') && u.pathname === '/l/') {
      const target = u.searchParams.get('uddg');
      if (target) return decodeURIComponent(target);
    }
    return href;
  } catch (e) {
    return href;
  }
}

app.get('/', (req, res) => {
  res.json({ ok: true, msg: 'Nightmare Designs SVG Forge AI server running (Local Ollama)', model: MODEL });
});

// Generate a design (SVG) from a prompt using Ollama (local AI)
app.post('/generate', async (req, res) => {
  const { prompt, format = 'svg' } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'prompt required' });

  try {
    const systemPrompt = `You are a helpful SVG design generator. Generate compact SVG markup only. Do NOT include any markdown, explanations, or code blocks. Return only the raw SVG code.`;
    const userPrompt = `Generate an SVG design for: ${prompt}\n\nReturn ONLY the SVG markup, nothing else.`;

    try {
      const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
        model: MODEL,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
        temperature: 0.7
      });

      let output = response.data.response || '';
      output = output.replace(/```svg\n?/g, '').replace(/```\n?/g, '').trim();
      if (!output.startsWith('<svg')) {
        const svgMatch = output.match(/<svg[^>]*>[\s\S]*<\/svg>/i);
        if (svgMatch) {
          output = svgMatch[0];
        } else {
          throw new Error('No SVG generated');
        }
      }
      res.json({ svg: output, prompt: prompt });
    } catch (ollama_err) {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#6C5CE7', '#00B894'];
      const shapes = ['circle', 'rect', 'polygon'];
      const randColor = colors[Math.floor(Math.random() * colors.length)];
      const randShape = shapes[Math.floor(Math.random() * shapes.length)];
      let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
        <rect width="400" height="400" fill="#f9f9f9"/>`;
      if (randShape === 'circle') {
        svg += `<circle cx="200" cy="200" r="120" fill="${randColor}" opacity="0.8"/>
                <circle cx="150" cy="150" r="60" fill="${randColor}" opacity="0.6"/>
                <circle cx="250" cy="250" r="60" fill="${randColor}" opacity="0.6"/>`;
      } else if (randShape === 'rect') {
        svg += `<rect x="100" y="100" width="200" height="200" fill="${randColor}" opacity="0.8" rx="20"/>
                <rect x="150" y="150" width="100" height="100" fill="white" opacity="0.8" rx="10"/>`;
      } else if (randShape === 'polygon') {
        svg += `<polygon points="200,50 350,350 50,350" fill="${randColor}" opacity="0.8"/>
                <polygon points="200,100 320,320 80,320" fill="white" opacity="0.6"/>`;
      }
      svg += `<text x="200" y="375" text-anchor="middle" font-size="14" fill="#666" font-family="Arial">
              ${escapeHtml(prompt.substring(0, 40))}
            </text>
          </svg>`;
      res.json({ svg: svg, prompt: prompt, note: 'Using fallback - install Ollama for full AI' });
    }
  }
  catch (error) {
    res.status(500).json({ error: 'Generation failed', detail: error.message });
  }
});

// Web search - SVG-only results (Wikimedia Commons API)
app.post('/search', async (req, res) => {
  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    // Using Wikimedia Commons API - free and reliable
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query + ' filetype:svg')}&srnamespace=6&srlimit=20&format=json`;
    
    const response = await fetchFn(searchUrl);
    const data = await response.json();
    
    const results = [];
    const seen = new Set();

    if (data.query?.search) {
      // Get file info for each result
      const fileNames = data.query.search.map(item => item.title).join('|');
      const fileInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileNames)}&prop=imageinfo&iiprop=url&format=json`;
      
      const fileResponse = await fetchFn(fileInfoUrl);
      const fileData = await fileResponse.json();

      for (const [pageId, pageData] of Object.entries(fileData.query?.pages || {})) {
        if (pageData.imageinfo && pageData.imageinfo[0]) {
          const url = pageData.imageinfo[0].url;
          if (url && /\.svg/i.test(url) && !seen.has(url)) {
            seen.add(url);
            const title = pageData.title || 'SVG File';
            results.push({
              id: results.length,
              title: title,
              url: url,
              snippet: 'SVG from Wikimedia Commons'
            });
            if (results.length >= 15) break;
          }
        }
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed', detail: error.message });
  }
});

// Fetch SVG content from URL for import
app.post('/fetch-svg', async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'url required' });

  try {
    const target = new URL(url);
    if (!['http:', 'https:'].includes(target.protocol)) {
      return res.status(400).json({ error: 'invalid protocol' });
    }

    const resp = await fetchFn(target.toString(), { headers: { 'User-Agent': 'NightmareDesignsSVGForge/1.0' } });
    const contentType = resp.headers.get('content-type') || '';
    const text = await resp.text();

    if (!text.trim().startsWith('<svg') && !contentType.includes('image/svg+xml')) {
      return res.status(400).json({ error: 'not an svg' });
    }

    // basic size guard
    if (text.length > 2_000_000) {
      return res.status(413).json({ error: 'svg too large' });
    }

    res.json({ svg: text });
  } catch (error) {
    res.status(500).json({ error: 'fetch failed', detail: error.message });
  }
});

// Chat endpoint for key generator and general assistant
app.post('/chat', async (req, res) => {
  const { message, context } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    const contextInfo = context ? `\n\nContext: ${JSON.stringify(context)}` : '';
    const systemPrompt = `You are a helpful Nightmare Designs SVG Forge AI assistant. Answer questions about license keys, software features, and provide technical support. Be concise and friendly.${contextInfo}`;
    
    try {
      const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
        model: MODEL,
        prompt: `${systemPrompt}\n\nUser: ${message}\n\nAssistant:`,
        stream: false,
        temperature: 0.7
      });

      const reply = response.data.response || 'I apologize, but I could not generate a response.';
      res.json({ reply: reply.trim() });
    } catch (ollama_err) {
      // Fallback response
      let reply = "I'm here to help! ";
      const msg = message.toLowerCase();
      
      if (msg.includes('key') || msg.includes('license')) {
        reply += "Nightmare Designs SVG Forge uses 16-character license keys (XXXX-XXXX-XXXX-XXXX). Keys are machine-locked and include a 30-day trial.";
      } else if (msg.includes('feature') || msg.includes('what can')) {
        reply += "Nightmare Designs SVG Forge has AI design generation, 20+ tools, image tracing, and supports Cricut/HPGL devices.";
      } else if (msg.includes('price') || msg.includes('cost')) {
        reply += "Nightmare Designs SVG Forge Professional is $79.99 one-time payment via CashApp ($NGTMRE1).";
      } else {
        reply += "I can help with license keys, software features, pricing, and technical support. What would you like to know?";
      }
      
      res.json({ reply, note: 'Using fallback - install Ollama for full AI chat' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Chat failed', detail: error.message });
  }
});

// Design Assistant endpoint
app.post('/assistant', async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Create design-focused context for AI
    const systemPrompt = `You are a helpful design assistant for Nightmare Designs SVG Forge, a professional SVG design and cutting software.
Your role is to help users with:
- Tool usage and best practices
- Material recommendations (vinyl, cardstock, fabric, etc.)
- Cutting machine settings (Cricut, Silhouette, etc.)
- Design tips and troubleshooting
- SVG optimization and file preparation

Keep responses concise (2-3 sentences) and practical. Focus on actionable advice.

Current context: ${context.hasObjects ? `User has ${context.selectedObjects} selected objects` : 'Canvas is empty'}.`;

    try {
      const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
        model: MODEL,
        prompt: `${systemPrompt}\n\nUser question: ${message}\n\nAssistant:`,
        stream: false,
        temperature: 0.7
      });

      const reply = response.data.response || 'I apologize, but I could not generate a response.';
      res.json({ reply: reply.trim() });
    } catch (ollama_err) {
      // Fallback design-focused responses
      let reply = "";
      const msg = message.toLowerCase();
      
      if (msg.includes('vinyl') || msg.includes('material')) {
        reply = "For vinyl, use a sharp blade and medium pressure. Removable vinyl works great for wall decals, while permanent vinyl is better for outdoor projects. Always weed carefully with a hook tool.";
      } else if (msg.includes('weld') || msg.includes('combine') || msg.includes('merge')) {
        reply = "To weld/combine shapes, select multiple objects and use Path > Union from the tools menu. This merges overlapping shapes into one continuous path, perfect for complex designs.";
      } else if (msg.includes('trace') || msg.includes('image')) {
        reply = "Import your image (PNG/JPG), then use the Trace tool in the left panel. Adjust threshold for clean results. Lower values = more detail, higher values = simpler shapes.";
      } else if (msg.includes('size') || msg.includes('resize') || msg.includes('scale')) {
        reply = "Select your object and use the Transform tools (right panel) or type exact dimensions in the Quick Properties. Hold Shift while dragging to maintain proportions.";
      } else if (msg.includes('cut') || msg.includes('settings') || msg.includes('blade')) {
        reply = "Start with these settings: Vinyl (Blade 2, Pressure 3), Cardstock (Blade 3, Pressure 4), Fabric (Blade 5, Pressure 5). Always do a test cut first.";
      } else if (msg.includes('export') || msg.includes('save')) {
        reply = "Export via File > Export. SVG is best for cutting machines. Choose 'Optimized' to reduce file size. DXF works for older Cricut models.";
      } else if (msg.includes('text') || msg.includes('font')) {
        reply = "Use the Text tool (left panel) to add text. For cutting, choose bold sans-serif fonts - they cut cleaner. Convert text to paths before exporting for better compatibility.";
      } else if (msg.includes('color') || msg.includes('layer')) {
        reply = "Colors become separate layers for cutting. Use the Fill tool to change colors. Group related objects with the same color to cut them together efficiently.";
      } else {
        reply = "I can help with materials, cutting settings, tools, design tips, and troubleshooting. What would you like to know?";
      }
      
      res.json({ reply });
    }
  } catch (error) {
    res.status(500).json({ error: 'Assistant failed', detail: error.message });
  }
});

// SVG Optimization endpoints
app.post('/optimize-svg', async (req, res) => {
  try {
    const { svg } = req.body;
    if (!svg) {
      return res.status(400).json({ error: 'SVG required' });
    }

    const { optimize } = require('svgo');
    const originalSize = Buffer.byteLength(svg, 'utf8');

    const result = await optimize(svg, {
      multipass: true,
      plugins: [
        'preset-default',
        'removeDoctype',
        'removeComments',
        'removeMetadata',
        'removeEditorsNSData',
        'cleanupIds',
        'minifyStyles',
        'convertStyleToAttrs',
        'removeEmptyAttrs',
        'removeEmptyContainers',
        'mergePaths',
        'convertPathData',
        'convertTransform',
        'removeUnusedNS'
      ]
    });

    const optimizedSize = Buffer.byteLength(result.data, 'utf8');
    
    res.json({ 
      optimized: result.data,
      originalSize,
      optimizedSize
    });
  } catch (error) {
    res.status(500).json({ error: 'Optimization failed', detail: error.message });
  }
});

app.post('/simplify-svg', async (req, res) => {
  try {
    const { svg, tolerance = 1.0 } = req.body;
    if (!svg) {
      return res.status(400).json({ error: 'SVG required' });
    }

    const { optimize } = require('svgo');
    
    const result = await optimize(svg, {
      plugins: [
        {
          name: 'convertPathData',
          params: {
            floatPrecision: 2,
            transformPrecision: 3,
            removeUseless: true,
            straightCurves: true,
            lineShorthands: true,
            curveSmoothShorthands: true,
            makeArcs: {
              threshold: tolerance,
              tolerance: tolerance
            }
          }
        },
        'mergePaths',
        'cleanupNumericValues'
      ]
    });

    res.json({ simplified: result.data });
  } catch (error) {
    res.status(500).json({ error: 'Simplification failed', detail: error.message });
  }
});

app.post('/clean-svg', async (req, res) => {
  try {
    const { svg } = req.body;
    if (!svg) {
      return res.status(400).json({ error: 'SVG required' });
    }

    const { optimize } = require('svgo');
    
    const result = await optimize(svg, {
      plugins: [
        'removeDoctype',
        'removeXMLProcInst',
        'removeComments',
        'removeMetadata',
        'removeEditorsNSData',
        'cleanupAttrs',
        'removeEmptyAttrs',
        'removeEmptyText',
        'removeEmptyContainers',
        'removeUnusedNS',
        'cleanupIds',
        'cleanupNumericValues'
      ]
    });

    res.json({ cleaned: result.data });
  } catch (error) {
    res.status(500).json({ error: 'Cleaning failed', detail: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Nightmare Designs SVG Forge AI server listening on ${PORT}`);
  console.log(`Using local Ollama model: ${MODEL}`);
  console.log(`To install Ollama, visit: https://ollama.ai`);
  console.log(`Then run: ollama pull ${MODEL}`);
});
