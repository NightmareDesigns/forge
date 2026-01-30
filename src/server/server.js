const express = require('express');
const fetch = require('node-fetch');
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

app.get('/', (req, res) => {
  res.json({ ok: true, msg: 'CraftForge AI server running (Local Ollama)', model: MODEL });
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

// Web search - uses local AI for suggestions
app.post('/search', async (req, res) => {
  const { query } = req.body || {};
  if (!query) return res.status(400).json({ error: 'query required' });

  try {
    // Use Ollama to generate design search suggestions
    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model: MODEL,
      prompt: `Suggest 3-5 design ideas related to "${query}". Return as a simple numbered list, nothing else.`,
      stream: false,
      temperature: 0.5
    });

    const suggestions = (response.data.response || '').split('\n').filter(s => s.trim()).slice(0, 5);
    
    res.json({ 
      results: suggestions.map((s, i) => ({ 
        id: i, 
        title: s.replace(/^\d+\.\s*/, ''),
        url: '#',
        snippet: 'Design suggestion from AI'
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Search failed', detail: error.message, note: 'Make sure Ollama is running' });
  }
});

// Chat endpoint for key generator and general assistant
app.post('/chat', async (req, res) => {
  const { message, context } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  try {
    const contextInfo = context ? `\n\nContext: ${JSON.stringify(context)}` : '';
    const systemPrompt = `You are a helpful CraftForge AI assistant. Answer questions about license keys, software features, and provide technical support. Be concise and friendly.${contextInfo}`;
    
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
        reply += "CraftForge uses 16-character license keys (XXXX-XXXX-XXXX-XXXX). Keys are machine-locked and include a 30-day trial.";
      } else if (msg.includes('feature') || msg.includes('what can')) {
        reply += "CraftForge has AI design generation, 20+ tools, image tracing, and supports Cricut/HPGL devices.";
      } else if (msg.includes('price') || msg.includes('cost')) {
        reply += "CraftForge Professional is $79.99 one-time payment via CashApp ($NGTMRE1).";
      } else {
        reply += "I can help with license keys, software features, pricing, and technical support. What would you like to know?";
      }
      
      res.json({ reply, note: 'Using fallback - install Ollama for full AI chat' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Chat failed', detail: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`CraftForge AI server listening on ${PORT}`);
  console.log(`Using local Ollama model: ${MODEL}`);
  console.log(`To install Ollama, visit: https://ollama.ai`);
  console.log(`Then run: ollama pull ${MODEL}`);
});
