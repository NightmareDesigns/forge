CraftForge AI Server

This lightweight server provides two endpoints to support the desktop app:

- POST /generate — generate a design (SVG) from a prompt.
- POST /search — perform a web search and return top results (requires `BING_API_KEY`).

Setup

1. Install dependencies (project root):

```powershell
npm install
```

2. Environment variables (optional):

- `OPENAI_API_KEY` — if set, `/generate` will call OpenAI Chat Completions (you must supply a valid key).
- `BING_API_KEY` — if set, `/search` will call Bing Web Search API.
- `AI_SERVER_PORT` — optional, defaults to `4000`.

Run

```powershell
# from repo root
npm run ai-server
```

Examples

Generate (no API key -> placeholder SVG):

```bash
curl -X POST http://localhost:4000/generate -H "Content-Type: application/json" -d '{"prompt":"A simple floral sticker, high contrast"}'
```

Search (requires BING_API_KEY):

```bash
curl -X POST http://localhost:4000/search -H "Content-Type: application/json" -d '{"q":"floral sticker svg free"}'
```

Notes

- The server is intentionally small and designed to be run locally. It does not include heavy ML models — it proxies to OpenAI if you provide a key.
- If you want to plug a self-hosted LLM, change the `/generate` handler to call your model endpoint.
