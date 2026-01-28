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

    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model: MODEL,
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      stream: false,
      temperature: 0.7
    });

    let output = response.data.response || '';
    
    // Clean up the response - remove markdown code blocks if present
    output = output.replace(/```svg\n?/g, '').replace(/```\n?/g, '').trim();
    
    // If we got an SVG, wrap it properly
    if (!output.startsWith('<svg')) {
      // Try to extract SVG from the output
      const svgMatch = output.match(/<svg[^>]*>[\s\S]*<\/svg>/i);
      if (svgMatch) {
        output = svgMatch[0];
      } else {
        // Create a simple SVG fallback
        output = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
          <rect width="400" height="400" fill="#f0f0f0"/>
          <text x="200" y="200" text-anchor="middle" dy=".3em" font-size="16" fill="#666">
            AI: ${escapeHtml(prompt.substring(0, 50))}
          </text>
        </svg>`;
      }
    }

    res.json({ svg: output, prompt: prompt });
  } catch (error) {
    res.status(500).json({ error: 'Generation failed', detail: error.message, note: 'Make sure Ollama is running (visit ollama.ai to install)' });
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

app.listen(PORT, () => {
  console.log(`CraftForge AI server listening on ${PORT}`);
  console.log(`Using local Ollama model: ${MODEL}`);
  console.log(`To install Ollama, visit: https://ollama.ai`);
  console.log(`Then run: ollama pull ${MODEL}`);
});
